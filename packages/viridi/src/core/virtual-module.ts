import { Config } from './config';
import { Note, Notes } from './types/node';

export function createVirtualNotesModule(config: Config, notes: Notes): string {
  return `const notes = {
${Object.values(notes)
  .map((note) => {
    const { id, title, path, backlinkIds, linkIds, url, lastModified, created } = note;
    return `  ${id}: Object.freeze({
    id: ${id},
    title: '${title}',
    url: '${url}',
    linkIds: Object.freeze(${JSON.stringify(linkIds)}),
    get links() {
      return this.linkIds.map(id => notes[id]);
    },     
    backlinkIds: Object.freeze(${JSON.stringify(backlinkIds)}),
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
  }),`;
  })
  .join('\n')}
};

export default Object.freeze(notes);`;
}

function createLogs({ logs, path }: Note): string {
  if (!logs) {
    return 'undefined';
  }
  return `Object.freeze([
    ${logs
      .map(
        ({ commit, modified, author }) => `Object.freeze({
          commit: '${commit}',
          author: '${author}',
          get modified() {
            return new Date('${modified}');
          },
          async data() {
            const {default: data} = await import('${path}?${commit}');
            return data
          },
        }),`
      )
      .join('\n')}
  ])`;
}
