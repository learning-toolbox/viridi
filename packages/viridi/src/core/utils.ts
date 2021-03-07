import { Note, Notes, NotePathToIdMap } from './types';

// A hash function
export function cyrb53Hash(str: string, seed: number = 0): number {
  let h1 = 0xdeadbeef ^ seed;
  let h2 = 0x41c6ce57 ^ seed;
  for (let i = 0, ch; i < str.length; i++) {
    ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
}

export function normalizeFilePath(root: string, path: string): string {
  return path.replace(root, '');
}

export function normalizeURL(root: string, path: string): string {
  path = path.replace(root, '').replace('.md', '');

  // does this make sense?
  if (path.endsWith('/index')) {
    return path.slice(0, path.length - 6);
  }
  return path;
}

export function extractTitleFromPath(path: string): string {
  return path.slice(path.lastIndexOf('/') + 1);
}

export function resolveNote(
  path: string,
  root: string,
  pathToIdMap: NotePathToIdMap,
  notes: Notes
): Note {
  const normalizedPath = normalizeFilePath(root, path);
  const noteId = pathToIdMap[normalizedPath];
  const note = notes[noteId];

  if (note === undefined) {
    throw new Error(`Markdown file not found: '${path}'.`);
  }

  return note;
}
