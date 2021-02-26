import { Plugin } from 'vite';
import {
  createMarkdownProcessor,
  createNoteRenderer,
  createVirtualNotesModule,
  getFileLogData,
  parseNotes,
  resolveConfig,
  resolveNote,
  Config,
  Notes,
  NotePathToIdMap,
  RenderNote,
  UserConfig,
  NoteTitleToIdMap,
  MarkdownProcessor,
} from '../core';

const viridiFileID = '@viridi';

const virtualMarkdownRE = /^(.+\.md)\?(\w+)$/;

export function viridiVitePlugin(userConfig: UserConfig): Plugin {
  let config: Config;
  let notes: Notes;
  let pathToIdMap: NotePathToIdMap;
  let titleToIdMap: NoteTitleToIdMap;
  let markdownProcessor: MarkdownProcessor;
  let renderNote: RenderNote;

  return {
    name: 'vite-plugin-viridi',

    configResolved(resolvedConfig) {
      config = resolveConfig(resolvedConfig.root, userConfig);
      markdownProcessor = createMarkdownProcessor(config);
      renderNote = createNoteRenderer(config, markdownProcessor);
    },

    resolveId(id) {
      if (id === viridiFileID) {
        return viridiFileID;
      }
    },

    async load(id) {
      if (id === viridiFileID) {
        if (notes === undefined || pathToIdMap === undefined) {
          ({ notes, pathToIdMap, titleToIdMap } = await parseNotes(
            config,
            markdownProcessor,
            renderNote
          ));
        }

        return createVirtualNotesModule(config, notes);
      }

      // TODO: refactor this logic
      if (config.gitLogs) {
        const [_, path, commit] = virtualMarkdownRE.exec(id) || [];
        if (path !== undefined && commit !== undefined) {
          const note = resolveNote(path, config.root, pathToIdMap, notes);
          const log = note.logs?.find((log) => log.commit === commit);
          try {
            if (log !== undefined) {
              if (log.data === undefined) {
                const markdown = await getFileLogData(note.path, commit);
                const { frontmatter, ...data } = markdownProcessor.processContent(
                  markdown,
                  note,
                  notes,
                  titleToIdMap,
                  commit
                );
                log.data = data;
                log.frontmatter = frontmatter;
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

        await renderNote(id, content, notes, pathToIdMap, titleToIdMap);

        return `export default Object.freeze(${JSON.stringify({
          content: note.content,
          prompts: note.prompts,
        })});`;
      }
    },
  };
}
