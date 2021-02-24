import fs from 'fs';
import glob from 'fast-glob';
import { Config } from './config';
import { getFileLogs, getLatestCommit } from './git';
import { MarkdownProcessor } from './markdown';
import { Notes, NotePathToIdMap, NoteTitleToIdMap } from './types';
import {
  cyrb53Hash,
  extractTitleFromPath,
  normalizeFilePath,
  normalizeURL,
  resolveNote,
} from './utils';

export type RenderNote = ReturnType<typeof createNoteRenderer>;

export function createNoteRenderer(config: Config, markdownProcessor: MarkdownProcessor) {
  return async (
    path: string,
    markdown: string,
    notes: Notes,
    pathToIdMap: NotePathToIdMap,
    titleToIdMap: NoteTitleToIdMap
  ) => {
    const note = resolveNote(path, config.root, pathToIdMap, notes);

    const { linkIds, prompts, content, frontmatter } = markdownProcessor.processContent(
      markdown,
      notes,
      titleToIdMap
    );
    note.content = content;
    note.prompts = prompts;
    note.linkIds = linkIds;
    note.frontmatter = frontmatter;

    if (
      frontmatter != null &&
      typeof frontmatter === 'object' &&
      typeof frontmatter.title === 'string'
    ) {
      delete titleToIdMap[note.title];
      note.title = frontmatter.title;
      titleToIdMap[note.title.trim().toLowerCase()] = note.id;
    }

    for (const id of linkIds) {
      const linkedNote = notes[id];
      if (!linkedNote?.backlinkIds.includes(id)) {
        linkedNote.backlinkIds.push(note.id);
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

export async function parseNotes(
  { root, directory, extractPrompts }: Config,
  markdownProcessor: MarkdownProcessor,
  renderNote: RenderNote
) {
  const notes: Notes = {};
  // uses normalized paths
  const pathToIdMap: NotePathToIdMap = {};
  const titleToIdMap: NoteTitleToIdMap = {};
  const notesPaths = glob.sync(`${root}/${directory ? directory + '/' : ''}**/*.md`, {
    ignore: ['node_modules/**/*'],
  });

  const noteContents: Record<string, string> = Object.fromEntries(
    await Promise.all(
      notesPaths.map(async (filePath) => {
        const content = await fs.promises.readFile(filePath, { encoding: 'utf8' });
        return [filePath, content];
      })
    )
  );

  for (const path of notesPaths) {
    const normalizedPath = normalizeFilePath(root, path);
    const id = cyrb53Hash(path);

    const url = normalizeURL(root, path);
    pathToIdMap[normalizedPath] = id;

    // Override title if it is defined on the frontmatter, otherwise extract it from the URL
    let title: string;
    const content = noteContents[path];
    const frontmatter = markdownProcessor.processFrontmatter(content);
    if (
      frontmatter != null &&
      typeof frontmatter === 'object' &&
      typeof frontmatter.title === 'string'
    ) {
      title = frontmatter.title;
    } else {
      title = extractTitleFromPath(url);
    }

    titleToIdMap[title.trim().toLowerCase()] = id;

    const { birthtimeMs } = fs.statSync(path);

    // Create an empty note
    notes[id] = {
      id,
      path,
      url,
      title,
      lastModified: '',
      rank: 0,
      created: new Date(Math.round(birthtimeMs)).toString(),
      frontmatter: {},
      content: '',
      prompts: extractPrompts ? [] : undefined,
      linkIds: [],
      backlinkIds: [],
    };
  }

  await Promise.all(
    notesPaths.map(async (filePath) => {
      const content = noteContents[filePath];
      await renderNote(filePath, content, notes, pathToIdMap, titleToIdMap);
    })
  );

  return { notes, pathToIdMap, titleToIdMap };
}
