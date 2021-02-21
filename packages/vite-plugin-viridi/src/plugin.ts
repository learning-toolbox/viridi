import fs from 'fs';
import { Plugin } from 'vite';
import { createPageRenderer, parseMarkdownFiles, RenderPage } from './markdown';
import { FullPages, PagePathToIdMap } from 'types/node';
import { normalizeFilePath } from './utils';

const viridiFileID = '@viridi';

export type UserConfig = {
  root: string;
};

export function viridiPlugin(config: Partial<UserConfig> = {}): Plugin {
  let root: string;
  let fullPages: FullPages;
  let pathToIdMap: PagePathToIdMap;
  let renderPage: RenderPage;

  return {
    name: 'vite-plugin-viridi',

    configResolved(resolvedConfig) {
      root = resolvedConfig.root;
      renderPage = createPageRenderer(root);
    },

    resolveId(id) {
      if (id === viridiFileID) {
        return viridiFileID;
      }
    },

    async load(id) {
      if (id === viridiFileID) {
        if (fullPages === undefined || pathToIdMap === undefined) {
          ({ fullPages, pathToIdMap } = await parseMarkdownFiles(root, renderPage));
        }

        return createPagesModule(fullPages);
      }
    },

    async transform(content, id) {
      if (id.endsWith('.md')) {
        if (fullPages === undefined || pathToIdMap === undefined) {
          ({ fullPages, pathToIdMap } = await parseMarkdownFiles(root, renderPage));
        }

        const path = normalizeFilePath(root, id);
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
function createPagesModule(fullPages: FullPages): string {
  return `
const pages = import.meta.glob('/**/*.md');

const fullPages = {
  ${Object.values(fullPages)
    .map((page) => {
      const { id, title, path, backlinkIds, url, lastUpdated, created } = page;
      return `${id}: {
  id: ${id},
  title: '${title}',
  path: '${path}',
  lastUpdated: new Date(${lastUpdated}),
  created: new Date(${created}),
  url: '${url}',      
  backlinkIds: ${JSON.stringify(backlinkIds)},
  get backlinks() {
    return this.backlinkIds.map(id => fullPages[id]);
  },
  async data() {
    const { default: data } = await pages[this.path]();
    return data;
  },
},`;
    })
    .join('\n')}
}

export default fullPages;`;
}
