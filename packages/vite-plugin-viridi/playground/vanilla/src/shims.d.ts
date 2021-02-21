declare module '*.md' {
  import { FullPage } from '@viridi/vite-plugin';
  const page: FullPage;
  export default page;
}

declare module '@viridi' {
  import { Pages } from '@viridi/vite-plugin';
  const pages: Pages;
  export default pages;
}
