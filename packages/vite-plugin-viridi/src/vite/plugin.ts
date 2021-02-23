import fs from 'fs';
import { Plugin } from 'vite';
import { resolveConfig, UserConfig, Config } from './config';
import { getFileLogData } from './git';
import { createNoteRenderer, parseNotes, RenderNote } from './markdown';
import { Notes, NotePathToIdMap, Note } from './types';
import { resolveNote } from './utils';

const viridiFileID = '@viridi';

const virtualMarkdownRE = /^(.+\.md)\?(\w+)$/;

export function viridiVitePlugin(userConfig?: UserConfig): Plugin {
  let config: Config;
  let notes: Notes;
  let pathToIdMap: NotePathToIdMap;
  let renderNote: RenderNote;

  return {
    name: 'vite-plugin-viridi',

    configResolved(resolvedConfig) {
      config = resolveConfig(userConfig, resolvedConfig.root);
      renderNote = createNoteRenderer(config);
    },

    resolveId(id) {
      if (id === viridiFileID) {
        return viridiFileID;
      }
    },

    async load(id) {
      if (id === viridiFileID) {
        if (notes === undefined || pathToIdMap === undefined) {
          ({ notes, pathToIdMap } = await parseNotes(config, renderNote));
        }

        return createNotesModule(config, notes);
      }

      // TODO: refactor this logic
      if (config.gitLogs !== undefined) {
        const [_, path, commit] = virtualMarkdownRE.exec(id) || [];
        if (path !== undefined && commit !== undefined) {
          const note = resolveNote(path, config.root, pathToIdMap, notes);
          const log = note.logs?.find((log) => log.commit === commit);
          try {
            if (log !== undefined) {
              if (log.data === undefined) {
                const markdown = await getFileLogData(note.path, commit);
                // TODO: render markdown
                log.data = { content: markdown };
              }
              return `export default Object.freeze(${JSON.stringify(log.data)});`;
            } else {
              throw undefined;
            }
          } catch (error) {
            throw new Error(`Commit '${commit}' not found for note '${id}'.`);
          }
        }
      }
    },

    async transform(content, id) {
      if (id.endsWith('.md')) {
        if (notes === undefined || pathToIdMap === undefined) {
          throw new Error(
            `It *appears* that you are trying to directly import a markdown file. Viridi handles that for you.`
          );
        }

        const note = resolveNote(id, config.root, pathToIdMap, notes);

        note.content = '';
        note.prompts = [];
        for (const backlinkId of note.backlinkIds) {
          const linkedNote = notes[backlinkId];
          linkedNote.backlinkIds.splice(linkedNote.backlinkIds.indexOf(note.id), 1);
        }

        await renderNote(id, content, notes, pathToIdMap);

        return `export default Object.freeze(${JSON.stringify({
          content: note.content,
          prompts: note.prompts,
        })});`;
      }
    },

    // TODO: look into better HMR
    // handleHotUpdate(ctx) {},
  };
}

// Use glob import to dynamically import all data for each note.
function createNotesModule({ directory, gitLogs }: Config, notes: Notes): string {
  return `
const notesData = import.meta.glob('${directory ? '/' + directory : ''}/**/*.md');

const notes = {
${Object.values(notes)
  .map((note) => {
    const { id, title, path, backlinkIds, url, lastModified, created } = note;
    return `  ${id}: Object.freeze({
    id: ${id},
    title: '${title}',
    path: '${path}',
    url: '${url}',      
    backlinkIds: ${JSON.stringify(backlinkIds)},
    get backlinks() {
      return this.backlinkIds.map(id => notes[id]);
    },
    get lastModified() {
      return new Date('${lastModified}');
    },
    get created() {
      return new Date('${created}');
    },
    async data() {
      const { default: data } = await notesData[this.path]();
      return data;
    },
    logs: ${gitLogs ? createLogs(note) : undefined},
  }),`;
  })
  .join('\n')}
};

export default Object.freeze(notes);`;
}

function createLogs(note: Note): string {
  if (!note.logs) {
    return 'undefined';
  }
  return `[${note.logs
    .map(
      ({ commit, modified, author }) => `Object.freeze({
      commit: '${commit}',
      authur: '${author}',
      get modified() {
        return new Date('${modified}');
      },
      async data() {
        const {default: data} = await import('${note.path}?${commit}');
        return data
      },
    }),`
    )
    .join('\n')}]`;
}
