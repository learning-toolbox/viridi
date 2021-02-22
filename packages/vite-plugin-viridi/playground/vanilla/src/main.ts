import notes, { Note } from '@viridi';

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
          ${Object.values(notes)
            .map((note) => `<li><a href="${note.path}">${note.title} (${note.id})</a></li>`)
            .join('\n')}
        </ul>    
      </nav>
      <h1>${note.title}</h1>
      <div>Created: ${note.created.toLocaleDateString('default', dateOptions)}</div>
      <div>Last Updated: ${note.lastModified.toLocaleDateString('default', dateOptions)}</div>
      ${content}
    `;
  }
}

(async () => {
  const note = Object.values(notes)[0];
  renderNote(note);

  if (note.logs) {
    for (const log of note.logs) {
      console.log(await log.data());
    }
  }
})();
