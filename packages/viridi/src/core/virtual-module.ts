import { Config } from './config';
import { Note, Notes } from './types/node';

export function createVirtualNotesModule(config: Config, notes: Notes): string {
  return `const notesMap = {
${Object.values(notes)
  .map((note) => {
    const { id, title, path, backlinkIds, linkIds, url, lastModified, created } = note;
    return `  ${id}: {
    id: ${id},
    title: '${title}',
    url: '${url}',
    linkIds: ${JSON.stringify(linkIds)},
    get links() {
      return this.linkIds.map(id => notes[id]);
    },     
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
      const { default: data } = await import('${path}');
      return data;
    },
    logs: ${config.gitLogs ? createLogs(note) : undefined},
  },`;
  })
  .join('\n')}
};

export const notes = Object.values(notesMap);

const urlToIdMap = notes.reduce((acc, note) => {
  acc[note.url] = note.id;
  return acc;
}, {});

export function getNoteFromID(id) {
  return notesMap[id];
}

export function getNoteFromURL(url) {
  const id = urlToIdMap[url];
  return notesMap[id];
}`;
}

function createLogs({ logs, path }: Note): string {
  if (!logs) {
    return 'undefined';
  }
  return `[
    ${logs
      .map(
        ({ commit, modified, author }) => `{
      commit: '${commit}',
      author: '${author}',
      get modified() {
        return new Date('${modified}');
      },
      async data() {
        const {default: data} = await import('${path}?${commit}');
        return data;
      },
    },`
      )
      .join('\n')}
  ]`;
}
