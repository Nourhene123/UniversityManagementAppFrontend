import { NoteDto } from "./NoteDto";

export interface MatiereDto {
  id?: number; 
  nom: string;
  volumeHoraire: number;
  coefficient: number;
  panierId?: number;
  enseignantId?: number;
  notes?: NoteDto[]; 
}

