/**
 * @typedef {object} Router
 * @property {(path: string) => Promise<void>} go
 * @property {(listener: RouteListener) => void} onRouteChange
 */

/** @type {Pages} */
let pages = /* pages */;

/** @type {RouteListener[]} */
const routeListeners = [];

/**
 * @param {string} path
 */
async function go(path) {
  const pageFilePath = pathToFile(path);
  console.log(pageFilePath)

  /** @type {{__pageData: FullPage}} */
  let {__pageData: page} = await import(/*@vite-ignore*/ pageFilePath);

  routeListeners.forEach((listener) => listener(page, pages));
}

/**
 * @param {RouteListener} listener
 */
function onRouteChange(listener) {
  routeListeners.push(listener);

  // Initialize the current page if this is the first listener
  if (routeListeners.length === 1) {
    go(location.href)
  }
}

/**
 * @param {string} path 
 * @returns {string}
 */
function pathToFile(path) {
  let pagePath = path.replace(/\.html$/, '')
  if (pagePath.endsWith('/')) {
    pagePath += 'index'
  }

  // @ts-ignore
  if (import.meta.env.DEV) {
    // always force re-fetch content in dev
    pagePath += `.md?t=${Date.now()}`
  }
  return pagePath
}

/**
 * @type {Router}
 */
export const router = Object.freeze({
  go,
  onRouteChange,
});
