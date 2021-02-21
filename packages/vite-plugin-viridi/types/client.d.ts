import { NoteLogData, NoteBase, NoteData } from './shared';

export type NoteLog = {
  commit: string;
  modified: Date;
  author: string;
  data: () => Promise<Readonly<NoteLogData>>;
};

export type Note = Readonly<NoteBase> &
  Readonly<{
    readonly backlinks: Note[];
    data: () => Promise<Readonly<NoteData>>;
    lastModified: Date;
    created: Date;
    logs?: Readonly<NoteLog>[];
  }>;

export type Notes = Readonly<Record<string, Note>>;

export * from './shared';
