import { Plugin } from 'vite';
import {
  createVirtualNotesModule,
  getFileLogData,
  resolveConfig,
  resolveNote,
  Config,
  Notes,
  NotePathToIdMap,
  UserConfig,
} from '../core';
import { createNoteRenderer, parseNotes, RenderNote } from './markdown';

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

        return createVirtualNotesModule(config, notes);
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
  };
}
