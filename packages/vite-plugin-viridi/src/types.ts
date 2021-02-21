import { HistoryData, Page, PageData } from '../types/shared';

export type History = {
  commit: string;
  modified: string;
  author: string;
  data?: HistoryData;
};

export type FullPage = Page &
  PageData & {
    lastModified: string;
    created: string;
    history?: History[];
  };

export type FullPages = Record<string, FullPage>;

export type PagePathToIdMap = Record<Page['path'], Page['id']>;

// TODO
export type HistoryOptions = {};

export type Config = {
  root: string;
  directory?: string;
  history?: HistoryOptions;
};

export type UserConfig = {
  directory?: string;
  gitHistory?: boolean | HistoryOptions;
};

export * from '../types/shared';
