import { dbClient, DatabaseClient } from '../client/DatabaseClient';
import { IncidentNote } from '../../incidents/entities/NotesEntities';
import { DatabaseError } from '../../core/errors/DatabaseError';

export class NotesRepository {
  private db: DatabaseClient;

  constructor() {
    this.db = dbClient;
  }

  public async createNote(note: Partial<IncidentNote> & { id: string, incidentId: string }): Promise<IncidentNote> {
    const text = `
      INSERT INTO incident_notes (id, incident_id, author, markdown)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;
    const rows = await this.db.query(text, [note.id, note.incidentId, note.author, note.markdown]);
    return this.mapToEntity(rows[0]);
  }

  public async getNote(id: string): Promise<IncidentNote | null> {
    const text = `SELECT * FROM incident_notes WHERE id = $1`;
    const rows = await this.db.query(text, [id]);
    return rows.length ? this.mapToEntity(rows[0]) : null;
  }

  public async getNotesForIncident(incidentId: string): Promise<IncidentNote[]> {
    const text = `SELECT * FROM incident_notes WHERE incident_id = $1 ORDER BY created_at DESC`;
    const rows = await this.db.query(text, [incidentId]);
    return rows.map(r => this.mapToEntity(r));
  }

  public async updateNote(id: string, markdown: string): Promise<IncidentNote> {
    const text = `
      UPDATE incident_notes 
      SET markdown = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING *;
    `;
    const rows = await this.db.query(text, [markdown, id]);
    if (!rows.length) {
      throw new DatabaseError(`Note not found: ${id}`);
    }
    return this.mapToEntity(rows[0]);
  }

  public async deleteNote(id: string): Promise<void> {
    const text = `DELETE FROM incident_notes WHERE id = $1`;
    await this.db.query(text, [id]);
  }

  private mapToEntity(r: any): IncidentNote {
    return {
      id: r.id,
      incidentId: r.incident_id,
      author: r.author,
      markdown: r.markdown,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    };
  }
}

export const notesRepository = new NotesRepository();
