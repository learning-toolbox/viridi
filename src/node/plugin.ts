import fs from 'fs';
import path from 'path';
import glob from 'fast-glob';
import { Plugin } from 'vite';
import { createPageRenderer, RenderPage } from './markdown';
import { FullPages } from '/@types/shared';

const viridiFileID = '@viridi';
const routerPath = path.resolve('./dist/client/router.js');

export type UserConfig = {
  root: string;
};

export function viridiPlugin(config: Partial<UserConfig> = {}): Plugin {
  const renderPage = createPageRenderer();
  const pages = parseMarkdownFiles(renderPage);

  return {
    name: 'vite-plugin-viridi',
    config() {
      return {
        alias: [
          {
            find: 'viridi',
            replacement: '@viridi',
          },
        ],
      };
    },

    resolveId(id) {
      if (id === viridiFileID) {
        return viridiFileID;
      }
    },

    load(id) {
      if (id === viridiFileID) {
        let router = fs
          .readFileSync(routerPath, { encoding: 'utf8' })
          .replace('{/* inject pages */}', JSON.stringify(pages));

        return router;
      }
    },

    transform(content, id) {
      if (id.endsWith('.md')) {
        const fullPage = {
          ...pages[id],
          content,
        };
        return `export const __pageData = ${JSON.stringify(fullPage)}`;
      }
    },
  };
}

/**
 * @param {import('./markdown').RenderPage} renderPage
 * @returns {FullPages}
 */
function parseMarkdownFiles(renderPage: RenderPage): FullPages {
  return glob
    .sync(`./**/*.md`, { ignore: ['node_modules/**/*'] })
    .map((filePath) => {
      const content = fs.readFileSync(filePath, { encoding: 'utf8' });
      return renderPage(filePath, content);
    })
    .reduce((acc, page) => {
      acc[page.path] = page;
      return acc;
    }, {} as FullPages);
}
