import fs from 'fs';
import { Plugin } from 'vite';
import { createPageRenderer, parseMarkdownFiles, RenderPage } from './markdown';
import { FullPages, PagePathToIdMap, UserConfig, Config } from './types';
import { normalizeFilePath } from './utils';

const viridiFileID = '@viridi';

function resolveConfig(userConfig: UserConfig = {}, root: string): Config {
  const defaultConfig: Config = {
    root,
    directory: '',
    history: false,
  };

  return {
    ...defaultConfig,
    ...userConfig,
  };
}

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
    },

    async transform(content, id) {
      if (id.endsWith('.md')) {
        if (fullPages === undefined || pathToIdMap === undefined) {
          throw new Error(
            `viridi: It *appears* that you are trying to directly import a markdown file. Viridi handles that for you.`
          );
        }

        const path = normalizeFilePath(config.root, id);
        const pageId = pathToIdMap[path];
        const page = fullPages[pageId];

        page.content = '';
        page.prompts = [];
        for (const backlinkId of page.backlinkIds) {
          const linkedPage = fullPages[backlinkId];
          linkedPage.backlinkIds.splice(linkedPage.backlinkIds.indexOf(pageId), 1);
        }

        renderPage(path, content, fullPages, pathToIdMap);

        const stats = fs.statSync(id);
        page.lastUpdated = Math.round(stats.mtimeMs);

        return `export default ${JSON.stringify({
          content: page.content,
          prompts: page.prompts,
        })}`;
      }
    },

    // handleHotUpdate(ctx) {
    //   console.log(ctx.file);
    // },
  };
}

// Use glob import to dynamically import all data for each markdown page.
function createPagesModule(config: Config, fullPages: FullPages): string {
  return `
const pages = import.meta.glob('${config.directory}/**/*.md');

const fullPages = {
${Object.values(fullPages)
  .map((page) => {
    const { id, title, path, backlinkIds, url, lastUpdated, created } = page;
    return `  ${id}: Object.freeze({
    id: ${id},
    title: '${title}',
    path: '${path}',
    url: '${url}',      
    backlinkIds: ${JSON.stringify(backlinkIds)},
    get backlinks() {
      return this.backlinkIds.map(id => fullPages[id]);
    },
    get lastUpdated() {
      return new Date(${lastUpdated});
    },
    get created() {
      return new Date(${created});
    },
    async data() {
      const { default: data } = await pages[this.path]();
      return data;
    },
  }),`;
  })
  .join('\n')}
};

export default Object.freeze(fullPages);`;
}
