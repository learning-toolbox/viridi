import { Page, PageData } from './shared';

export type FullPage = Page & {
  readonly backlinks: FullPage[];
  data: () => Promise<PageData>;
  lastUpdated: Date;
  created: Date;
};

export type FullPages = Record<string, FullPage>;

export * from './shared';
