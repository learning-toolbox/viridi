import fs from 'fs';
import path from 'path';
import glob from 'fast-glob';

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
  // TODO: parse all Markdown files
  const files = glob.sync(`./**/*.md`, {
    ignore: ['node_modules/**/*'],
  });

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
