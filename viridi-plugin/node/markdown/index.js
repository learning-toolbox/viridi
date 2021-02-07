/** @typedef {(path: string, content: string) => FullPage} RenderPage */

/**
 * @return {RenderPage}
 */
export function createPageRenderer() {
  return (path, content) => {
    return {
      path,
      title: '',
      subtitle: '',
      content: '',
      backlinks: [],
    };
  };
}
