import fs from 'fs';
import path from 'path';
import glob from 'fast-glob';
import { createPageRenderer } from './markdown';

const viridiFileID = 'viridi';
const routerPath = path.resolve('./viridi-plugin/client/router.js');

/**
 * @typedef {object} ViridiConfig
 * @property {string=} root
 */

/**
 * @param {ViridiConfig=} config
 * @return {import('vite').Plugin}
 */
export function viridiPlugin(config) {
  const renderPage = createPageRenderer();
  const pages = parseMarkdownFiles(renderPage);

  return {
    name: 'vite-plugin-viridi',
    resolveId(id) {
      if (id === viridiFileID) {
        return viridiFileID;
      }
    },
    load(id) {
      if (id === viridiFileID) {
        let router = fs
          .readFileSync(routerPath, { encoding: 'utf8' })
          .replace('/* pages */', JSON.stringify(pages));

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
function parseMarkdownFiles(renderPage) {
  return glob
    .sync(`./**/*.md`, { ignore: ['node_modules/**/*'] })
    .map((filePath) => {
      const content = fs.readFileSync(filePath, { encoding: 'utf8' });
      return renderPage(filePath, content);
    })
    .reduce((acc, page) => {
      acc[page.path] = page;
      return acc;
    }, {});
}
