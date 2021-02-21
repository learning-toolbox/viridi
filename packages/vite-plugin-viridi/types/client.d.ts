import { HistoryData, Page, PageData } from './shared';

export type History = {
  commit: string;
  modified: Date;
  author: string;
  data: () => Promise<Readonly<HistoryData>>;
};

export type FullPage = Readonly<Page> &
  Readonly<{
    readonly backlinks: FullPage[];
    data: () => Promise<Readonly<PageData>>;
    lastModified: Date;
    created: Date;
    history?: Readonly<History>[];
  }>;

export type FullPages = Readonly<Record<string, FullPage>>;

export * from './shared';
