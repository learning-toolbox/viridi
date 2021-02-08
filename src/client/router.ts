import { Pages, FullPage } from '/@types/shared';

export type RouteListener = (page: FullPage, pages: Pages) => void;

export type Router = {
  go(path: string): Promise<void>;
  onRouteChange(listener: RouteListener): void;
};

let pages: Pages = {
  /* inject pages */
};

const routeListeners: RouteListener[] = [];

const go: Router['go'] = async (path) => {
  const pageFilePath = pathToFile(path);
  console.log(pageFilePath);

  /** @type {{__pageData: FullPage}} */
  let { __pageData: page } = await import(/*@vite-ignore*/ pageFilePath);

  routeListeners.forEach((listener) => listener(page, pages));
};

/**
 * @param {RouteListener} listener
 */
const onRouteChange: Router['onRouteChange'] = (listener) => {
  routeListeners.push(listener);

  // Initialize the current page if this is the first listener
  if (routeListeners.length === 1) {
    go(location.href);
  }
};

function pathToFile(path: string): string {
  let pagePath = path.replace(/\.html$/, '');
  if (pagePath.endsWith('/')) {
    pagePath += 'index';
  }

  // @ts-ignore
  if (import.meta.env.DEV) {
    // always force re-fetch content in dev
    pagePath += `.md?t=${Date.now()}`;
  }
  return pagePath;
}

export const router: Router = Object.freeze({
  go,
  onRouteChange,
});
