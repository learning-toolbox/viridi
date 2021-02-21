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

export type NoteId = number;

export type NoteBase = {
  id: NoteId;
  path: string;
  url: string;
  title: string;
  backlinkIds: NoteId[];
};

export type NoteData = {
  content: string;
  prompts: Prompt[];
};

export type NoteLogData = {
  content: string;
};
