import { NoteBase, NoteData } from './shared';

export type Note = Readonly<
  NoteBase & {
    /** The Date that the note was created. */
    created: Date;
    /** The Date that the note was was last updated. */
    lastModified: Date;
    /** A list of references that the current note is linked to. */
    links: Note[];
    /** A list of references that link to the current note. */
    backlinks: Note[];
    /** A dynamic import that fetches actual data of the Note */
    data: () => Promise<Readonly<NoteData>>;
    /** A list of git logs that contain previous versions of the note. */
    logs?: Readonly<NoteLog>[];
  }
>;

export type Notes = Readonly<Record<string, Note>>;

export type NoteLog = {
  /** The Git commit hash of the log */
  commit: string;
  /** The Date of the log */
  modified: Date;
  /** The Git username of the log. */
  author: string;
  /** A dynamic import that fetches content of the note at the time of the log. */
  data: () => Promise<Readonly<NoteData>>;
};

export * from './shared';
