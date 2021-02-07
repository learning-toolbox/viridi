/**
 * @typedef {object} Page
 * @property {string} path
 * @property {string} title
 * @property {string} subtitle
 * @property {string[]} backlinks
 */

/** @typedef {Record<string, Page>} Pages */

/** @typedef {Page & { content: string }} FullPage */

/** @typedef {Record<string, FullPage>} FullPages */

/** @typedef {(page: FullPage, pages: Pages) => void} RouteListener */
