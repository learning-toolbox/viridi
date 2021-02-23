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

export type NoteID = number;

export type NoteBase = {
  /** The unique ID of the note. This is actually the hash of the file path. */
  id: NoteID;
  /** The URL for the note */
  url: string;
  /** The title of the note. It is extracted from the file name of the note.  */
  title: string;
  /** The frontmatter extracted from parsing the markdown file. */
  frontmatter: Record<string, any>;
  /** A list of note IDs that this note links to. */
  linkIds: NoteID[];
  /** A list of note IDs that link to this note. */
  backlinkIds: NoteID[];
};

export type NoteData = {
  /** The HTML content of the note compiled from markdown. */
  content: string;
  /** A list of questions/answer and cloze-deletion prompts extracted from the markdown. */
  prompts?: Prompt[];
};
