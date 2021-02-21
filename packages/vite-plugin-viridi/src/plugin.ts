import fs from 'fs';
import { Plugin } from 'vite';
import { getGitHistoryData } from './git';
import { createPageRenderer, parseMarkdownFiles, RenderPage } from './markdown';
import { FullPages, PagePathToIdMap, UserConfig, Config, FullPage } from './types';
import { resolvePage } from './utils';

const viridiFileID = '@viridi';

function resolveConfig({ directory, gitHistory }: UserConfig = {}, root: string): Config {
  return {
    root,
    directory,
    history: gitHistory === true ? {} : gitHistory === false ? undefined : gitHistory,
  };
}

const virtualMarkdownRE = /^(.+\.md)\?(\w+)$/;

export function viridiPlugin(userConfig?: UserConfig): Plugin {
  let config: Config;
  let fullPages: FullPages;
  let pathToIdMap: PagePathToIdMap;
  let renderPage: RenderPage;

  return {
    name: 'vite-plugin-viridi',

    configResolved(resolvedConfig) {
      config = resolveConfig(userConfig, resolvedConfig.root);
      renderPage = createPageRenderer(config);
    },

    resolveId(id) {
      if (id === viridiFileID) {
        return viridiFileID;
      }
    },

    async load(id) {
      if (id === viridiFileID) {
        if (fullPages === undefined || pathToIdMap === undefined) {
          ({ fullPages, pathToIdMap } = await parseMarkdownFiles(config, renderPage));
        }

        return createPagesModule(config, fullPages);
      }

      // TODO: refactor this logic
      if (config.history !== undefined) {
        const [_, path, commit] = virtualMarkdownRE.exec(id) || [];
        if (path !== undefined && commit !== undefined) {
          const page = resolvePage(path, config.root, pathToIdMap, fullPages);
          const history = page.history?.find((log) => log.commit === commit);
          try {
            if (history !== undefined) {
              if (history.data === undefined) {
                const markdown = await getGitHistoryData(page.path, commit);
                // TODO: render markdown
                history.data = { content: markdown };
              }
              return `export default Object.freeze(${JSON.stringify(history.data)});`;
            } else {
              throw undefined;
            }
          } catch (error) {
            throw new Error(`Commit '${commit}' not found for markdown file '${id}'.`);
          }
        }
      }
    },

    async transform(content, id) {
      if (id.endsWith('.md')) {
        if (fullPages === undefined || pathToIdMap === undefined) {
          throw new Error(
            `It *appears* that you are trying to directly import a markdown file. Viridi handles that for you.`
          );
        }

        const page = resolvePage(id, config.root, pathToIdMap, fullPages);

        page.content = '';
        page.prompts = [];
        for (const backlinkId of page.backlinkIds) {
          const linkedPage = fullPages[backlinkId];
          linkedPage.backlinkIds.splice(linkedPage.backlinkIds.indexOf(page.id), 1);
        }

        await renderPage(id, content, fullPages, pathToIdMap);

        return `export default Object.freeze(${JSON.stringify({
          content: page.content,
          prompts: page.prompts,
        })});`;
      }
    },

    // TODO: look into better HMR
    // handleHotUpdate(ctx) {},
  };
}

// Use glob import to dynamically import all data for each markdown page.
function createPagesModule({ directory, history }: Config, fullPages: FullPages): string {
  return `
const pages = import.meta.glob('${directory ? '/' + directory : ''}/**/*.md');

const fullPages = {
${Object.values(fullPages)
  .map((page) => {
    const { id, title, path, backlinkIds, url, lastModified, created } = page;
    return `  ${id}: Object.freeze({
    id: ${id},
    title: '${title}',
    path: '${path}',
    url: '${url}',      
    backlinkIds: ${JSON.stringify(backlinkIds)},
    get backlinks() {
      return this.backlinkIds.map(id => fullPages[id]);
    },
    get lastModified() {
      return new Date('${lastModified}');
    },
    get created() {
      return new Date('${created}');
    },
    async data() {
      const { default: data } = await pages[this.path]();
      return data;
    },
    history: ${createHistoryList(page)},
  }),`;
  })
  .join('\n')}
};

export default Object.freeze(fullPages);`;
}

function createHistoryList(page: FullPage): string {
  if (!page.history) {
    return 'undefined';
  }
  return `[${page.history
    .map(
      ({ commit, modified, author }) => `Object.freeze({
      commit: '${commit}',
      authur: '${author}',
      get modified() {
        return new Date('${modified}');
      },
      async data() {
        const {default: data} = await import('${page.path}?${commit}');
        return data
      },
    }),`
    )
    .join('\n')}]`;
}
