import fs from 'fs';
import glob from 'fast-glob';
import { Node } from 'unist';
import unified from 'unified';
import remarkParse from 'remark-parse';
import html from 'remark-html';
import { wikiLinkPlugin } from 'remark-wiki-link';
import { Notes, NoteID, NotePathToIdMap, Prompt } from './types';
import {
  cyrb53Hash,
  extractTitleFromPath,
  normalizeFilePath,
  normalizeURL,
  resolveNote,
} from './utils';
import { getFileLogs, getLatestCommit } from './git';
import { Config } from './config';

export type RenderNote = (
  path: string,
  content: string,
  notes: Notes,
  pathToIdMap: Record<string, number>
) => Promise<void>;

export function createNoteRenderer(config: Config): RenderNote {
  const md = unified()
    .use(remarkParse)
    .use(wikiLinkPlugin, {
      hrefTemplate: (permalink: string) => `/${permalink}`,
    })
    .use(html, { sanitize: true });
  return async (path, content, notes, pathToIdMap) => {
    const parseTree = md.parse(content);
    const { links, prompts } = parseMarkdownTree(parseTree, pathToIdMap);

    const note = resolveNote(path, config.root, pathToIdMap, notes);
    note.content = md.stringify(parseTree);
    note.prompts = prompts;
    note.linkedIds = links;

    for (const link of links) {
      const linkedNote = notes[link];
      if (!linkedNote?.backlinkIds.includes(link)) {
        linkedNote.backlinkIds.push(link);
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

// TODO
function parseMarkdownTree(
  node: Node,
  pathToIdMap: NotePathToIdMap
): { links: NoteID[]; prompts: Prompt[] } {
  return {
    links: [],
    prompts: [],
  };
}

export async function parseNotes({ root, directory, prompts }: Config, renderNote: RenderNote) {
  const notes: Notes = {};
  // uses normalized paths
  const pathToIdMap: NotePathToIdMap = {};
  const notesPaths = glob.sync(`${root}/${directory ? directory + '/' : ''}**/*.md`, {
    ignore: ['node_modules/**/*'],
  });
  for (const path of notesPaths) {
    const normalizedPath = normalizeFilePath(root, path);
    const id = cyrb53Hash(path);
    const url = normalizeURL(root, path);
    pathToIdMap[normalizedPath] = id;
    const stats = fs.statSync(path);

    // Create an empty note
    notes[id] = {
      id,
      path: normalizedPath,
      url,
      lastModified: '',
      created: new Date(Math.round(stats.birthtimeMs)).toString(),
      title: extractTitleFromPath(url),
      content: '',
      frontmatter: {},
      prompts: prompts ? [] : undefined,
      linkedIds: [],
      backlinkIds: [],
    };
  }

  await Promise.all(
    notesPaths.map(async (filePath) => {
      const content = await fs.promises.readFile(filePath, { encoding: 'utf8' });
      await renderNote(filePath, content, notes, pathToIdMap);
    })
  );

  return { notes, pathToIdMap };
}
