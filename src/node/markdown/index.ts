import { FullPage } from '/@types/shared';

export type RenderPage = (path: string, content: string) => FullPage;

export function createPageRenderer(): RenderPage {
  return (path, content) => {
    return {
      path,
      title: '',
      content: '',
      backlinks: [],
    };
  };
}
