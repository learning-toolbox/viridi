declare module '@viridi' {
  import { FullPages } from '@viridi/vite-plugin/types/client';
  const pages: FullPages;
  export default pages;
  export * from '@viridi/vite-plugin/types/client';
}
