import { Page, PageData } from './shared';

export type FullPage = Page &
  PageData & {
    lastUpdated: number;
    created: number;
  };

export type FullPages = Record<string, FullPage>;

export type PagePathToIdMap = Record<Page['path'], Page['id']>;

export * from './shared';
