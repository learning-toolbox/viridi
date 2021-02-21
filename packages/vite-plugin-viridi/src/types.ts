import { Page, PageData } from '../types/shared';

export type FullPage = Page &
  PageData & {
    lastUpdated: number;
    created: number;
  };

export type FullPages = Record<string, FullPage>;

export type PagePathToIdMap = Record<Page['path'], Page['id']>;

export type Config = {
  root: string;
  directory: string;
  history: boolean;
};

export type UserConfig = Partial<Omit<Config, 'root'>>;

export * from '../types/shared';
