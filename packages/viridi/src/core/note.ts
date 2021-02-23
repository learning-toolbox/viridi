import fs from 'fs';
import glob from 'fast-glob';
import { Config } from './config';
import { getFileLogs, getLatestCommit } from './git';
import { RenderMarkdown } from './markdown';
import { Notes, NotePathToIdMap, NoteTitleToIdMap } from './types/node';
import {
  cyrb53Hash,
  extractTitleFromPath,
  normalizeFilePath,
  normalizeURL,
  resolveNote,
} from './utils';

export type RenderNote = ReturnType<typeof createNoteRenderer>;

export function createNoteRenderer(config: Config, renderMarkdown: RenderMarkdown) {
  return async (
    path: string,
    markdown: string,
    notes: Notes,
    pathToIdMap: NotePathToIdMap,
    titleToIdMap: NoteTitleToIdMap
  ) => {
    const note = resolveNote(path, config.root, pathToIdMap, notes);

    const { linkIds, prompts, content } = renderMarkdown(markdown, titleToIdMap);
    note.content = content;
    note.prompts = prompts;
    note.linkIds = linkIds;

    for (const id of linkIds) {
      const linkedNote = notes[id];
      if (!linkedNote?.backlinkIds.includes(id)) {
        linkedNote.backlinkIds.push(id);
      }
    }

    if (config.gitLogs && note.logs === undefined) {
      note.logs = await getFileLogs(path);
    }

    const latestCommit = await getLatestCommit(path);
    if (note.lastModified === '') {
      if (latestCommit !== null) {
        note.lastModified = latestCommit.modified;
      } else {
        const stats = fs.statSync(path);
        note.lastModified = new Date(Math.round(stats.birthtimeMs)).toString();
      }
    } else {
      const stats = fs.statSync(path);
      note.lastModified = new Date(Math.round(stats.birthtimeMs)).toString();

      // If the file has been modified since the last commit show the last commit in history
      if (
        config.gitLogs &&
        latestCommit !== null &&
        note.logs?.[0]?.commit !== latestCommit.commit
      ) {
        note.logs?.unshift(latestCommit);
      }
    }
  };
}

export async function parseNotes({ root, directory, prompts }: Config, renderNote: RenderNote) {
  const notes: Notes = {};
  // uses normalized paths
  const pathToIdMap: NotePathToIdMap = {};
  const titleToIdMap: NoteTitleToIdMap = {};
  const notesPaths = glob.sync(`${root}/${directory ? directory + '/' : ''}**/*.md`, {
    ignore: ['node_modules/**/*'],
  });
  for (const path of notesPaths) {
    const normalizedPath = normalizeFilePath(root, path);
    const id = cyrb53Hash(path);

    const url = normalizeURL(root, path);
    pathToIdMap[normalizedPath] = id;

    const title = extractTitleFromPath(url);
    titleToIdMap[title] = id;

    const stats = fs.statSync(path);

    // Create an empty note
    notes[id] = {
      id,
      path: normalizedPath,
      url,
      lastModified: '',
      created: new Date(Math.round(stats.birthtimeMs)).toString(),
      title,
      content: '',
      frontmatter: {},
      prompts: prompts ? [] : undefined,
      linkIds: [],
      backlinkIds: [],
    };
  }

  await Promise.all(
    notesPaths.map(async (filePath) => {
      const content = await fs.promises.readFile(filePath, { encoding: 'utf8' });
      await renderNote(filePath, content, notes, pathToIdMap, titleToIdMap);
    })
  );

  return { notes, pathToIdMap, titleToIdMap };
}
