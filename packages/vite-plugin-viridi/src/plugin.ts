import { Plugin } from 'vite';
import { createPageRenderer, parseMarkdownFiles, RenderPage } from './markdown';
import { FullPages, PagePathToIdMap, Pages } from './types';
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
        const pages = Object.values(fullPages).reduce((acc, page) => {
          const { id, title, path, backlinks } = page;
          acc[id] = { id, title, path, backlinks };
          return acc;
        }, {} as Pages);
        return `export default ${JSON.stringify(pages)}`;
      }
    },

    async transform(content, id) {
      if (id.endsWith('.md')) {
        console.log(id);

        if (fullPages === undefined || pathToIdMap === undefined) {
          ({ fullPages, pathToIdMap } = await parseMarkdownFiles(root, renderPage));
        }

        const path = normalizeFilePath(root, id);
        const pageId = pathToIdMap[path];
        const page = fullPages[pageId];

        page.content = '';
        page.prompts = [];
        for (const backlink of page.backlinks) {
          const linkedPage = fullPages[backlink];
          linkedPage.backlinks.splice(linkedPage.backlinks.indexOf(pageId), 1);
        }

        renderPage(path, content, fullPages, pathToIdMap);

        return `export default ${JSON.stringify(page)}`;
      }
    },

    // handleHotUpdate(ctx) {},
  };
}
