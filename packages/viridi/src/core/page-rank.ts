import * as graph from 'pagerank.js';
import { Notes, NoteID } from './types';

export function rankNotes(notes: Notes) {
  for (const note of Object.values(notes)) {
    for (const id of note.backlinkIds) {
      graph.link(id, note.id, 1.0);
    }
  }

  graph.rank(0.85, 0.000001, function (noteId: NoteID, rank: number) {
    notes[noteId].rank = rank;
  });

  // Re-sort links and backlinks
  for (const note of Object.values(notes)) {
    note.linkIds.map((id) => notes[id]).sort((a, b) => b.rank - a.rank);
    note.backlinkIds.map((id) => notes[id]).sort((a, b) => b.rank - a.rank);
  }
}
