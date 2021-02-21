export type Prompt = QAPrompt | ClozeDeletionPrompt;

export type QAPrompt = {
  type: 'qa';
  question: string;
  answer: string;
};

export type ClozeDeletionPrompt = {
  type: 'cloze';
  content: string;
};

export type PageId = number;

export type Page = {
  id: PageId;
  path: string;
  title: string;
  backlinks: PageId[];
};

export type Pages = Record<string, Page>;

export type FullPage = Page & {
  content: string;
  prompts: Prompt[];
};

export type FullPages = Record<string, FullPage>;

export type PagePathToIdMap = Record<Page['path'], Page['id']>;
