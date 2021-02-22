import { NoteLogData, NoteBase, NoteData } from '../types/shared';

export type NoteLog = {
  commit: string;
  modified: string;
  author: string;
  data?: NoteLogData;
};

export type Note = NoteBase &
  NoteData & {
    lastModified: string;
    created: string;
    logs?: NoteLog[];
  };

export type Notes = Record<string, Note>;

export type NotePathToIdMap = Record<Note['path'], Note['id']>;

export type Config = {
  root: string;
  directory?: string;
  logs?: boolean;
};

export type UserConfig = {
  /** A path, relative to the `root` configured in Vite, to the directory containing your notes. By default we use the `root` directory. */
  directory?: string;
  /** If your project is using `git` then this option generates a log of changes for each note. It is disabled by default since it causes longer development & build times. */
  gitLogs?: boolean;
};

export * from '../types/shared';
