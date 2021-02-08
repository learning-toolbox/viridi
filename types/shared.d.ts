export type Page = {
  path: string;
  title: string;
  backlinks: string[];
};

export type Pages = Record<string, Page>;

export type FullPage = Page & {
  content: string;
};

export type FullPages = Record<string, FullPage>;
