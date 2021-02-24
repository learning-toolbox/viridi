import { notes, getNoteByID, Note } from '@viridi';

const dateOptions = {
  year: 'numeric',
  month: 'short',
  day: '2-digit',
} as const;

const app = document.querySelector('#app');

async function renderNote(note: Note) {
  if (app) {
    const { content } = await note.data();
    app.innerHTML = `
      <nav>
        <ul>
          ${notes
            .map((note) => `<li><a href="${note.url}">${note.title} (${note.id})</a></li>`)
            .join('\n')}
        </ul>    
      </nav>
      <h1>${note.title}</h1>
      <div>Created: ${note.created.toLocaleDateString('default', dateOptions)}</div>
      <div>Last Updated: ${note.lastModified.toLocaleDateString('default', dateOptions)}</div>
      ${content}

      <h2>Backlinks</h2>
      <ul>
        ${note.backlinks
          .map((note) => `<li><a href="${note.url}">${note.title} (${note.id})</a></li>`)
          .join('\n')}
      </ul>
    `;
  }
}

(async () => {
  const note = notes[1];
  renderNote(note);

  if (note.logs) {
    for (const log of note.logs) {
      console.log(await log.data());
    }
  }
})();
