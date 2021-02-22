import { NoteBase, NoteData } from '../types/shared';

export type NoteLog = {
  commit: string;
  modified: string;
  author: string;
  data?: NoteData;
};

export type Note = NoteBase &
  NoteData & {
    lastModified: string;
    created: string;
    logs?: NoteLog[];
  };

export type Notes = Record<string, Note>;

export type NotePathToIdMap = Record<Note['path'], Note['id']>;

export * from '../types/shared';
