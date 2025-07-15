export type TypeNote = 'Devoir' | 'Examen' | 'Tp';

export interface NoteDto {
  id?: number;
  valeur?: number;
  typeNote?: TypeNote;
  matiereId?: number;
  semestreId?: number;
  etudiantId?: number;
}