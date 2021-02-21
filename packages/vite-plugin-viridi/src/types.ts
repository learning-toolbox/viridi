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

// TODO
export type LogOptions = {};

export type Config = {
  root: string;
  directory?: string;
  logs?: LogOptions;
};

export type UserConfig = {
  directory?: string;
  gitLogs?: boolean | LogOptions;
};

export * from '../types/shared';
