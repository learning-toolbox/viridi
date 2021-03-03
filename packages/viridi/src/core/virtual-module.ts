import chalk from 'chalk';
import { Config } from './config';
import { rankNotes } from './page-rank';
import { Note, Notes } from './types';

export function createVirtualNotesModule(config: Config, notes: Notes): string {
  rankNotes(notes);

  return `const notesMap = {
${Object.values(notes)
  .map((note) => {
    const {
      id,
      title,
      path,
      backlinkIds,
      linkIds,
      url,
      lastModified,
      created,
      rank,
      frontmatter,
    } = note;

    if (backlinkIds.length === 0) {
      console.log(
        chalk.blue.bold('[viridi] ') + chalk.blue(`Note '${note.path}' has no backlinks.`)
      );
    }

    return `  ${id}: {
    id: ${id},
    title: '${title}',
    url: '${url}',
    rank: ${rank},
    frontmatter: ${JSON.stringify(frontmatter)},
    linkIds: ${JSON.stringify(linkIds)},
    get links() {
      return this.linkIds.map(id => notesMap[id]);
    },     
    backlinkIds: ${JSON.stringify(backlinkIds)},
    get backlinks() {
      return this.backlinkIds.map(id => notesMap[id]);
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

export const notes = Object.values(notesMap).sort((a, b) => b.rank - a.rank);

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
}

const isBrowser = window !== undefined;
const isNetworkAvailable = navigator.connection && !navigator.connection.saveData && !['slow-2g', '2g'].includes(navigator.connection.effectiveType);
const isIntersectionObserver = window.IntersectionObserver !== undefined;

const rIC = window.requestIdleCallback || setTimeout;
const hasFetched = new Set();
let observer = null;
export function prefetch() {
  if (!isBrowser || !isNetworkAvailable || !isIntersectionObserver) {
    return;
  }

  if (observer !== null) {
    observer.disconnect();
  }

  observer = new IntersectionObserver((entries, ob) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const link = entry.target;
        const id = parseInt(link.getAttribute('data-note-id'));
        ob.unobserve(link);
        if (!hasFetched.has(id)) {
          hasFetched.add(id);
          const note = getNoteFromID(id);
          // TODO: use <link rel="prefetch"> for more optimized prefetch once we can extract the hash from the build output
          // The browser will cache the JS module initially imported so that the next time it is imported it is already parsed 
          note.data();
        }
      }
    })
  })

  rIC(() => {
    document.querySelectorAll('[data-note-id]').forEach((link) => {
      const id = parseInt(link.getAttribute('data-note-id'));
      
      if (!hasFetched.has(id)) {
        observer.observe(link);
      }
    })
  })  
}
`;
}

function createLogs({ logs, path }: Note): string {
  if (!logs) {
    return 'undefined';
  }
  return `[
    ${logs
      .map(
        ({ commit, modified, author, frontmatter }) => `{
      commit: '${commit}',
      author: '${author}',
      frontmatter: ${JSON.stringify(frontmatter)},
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
