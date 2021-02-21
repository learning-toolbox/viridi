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
  url: string;
  title: string;
  backlinkIds: PageId[];
};

export type Pages = Record<string, Page>;

export type PageData = {
  content: string;
  prompts: Prompt[];
};

export type HistoryData = {
  content: string;
};
