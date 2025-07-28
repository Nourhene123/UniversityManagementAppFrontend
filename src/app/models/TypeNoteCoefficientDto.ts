import { TypeNote } from './NoteDto';

export interface TypeNoteCoefficientDto {
  id?: number;
  typeNote: TypeNote;
  coefficient: number;
  matiereId: number;
}