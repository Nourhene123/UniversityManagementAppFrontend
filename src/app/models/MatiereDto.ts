import { NoteDto } from "./NoteDto";

export interface MatiereDto {
  parcours: never[];
  id?: number; 
  nom: string;
  volumeHoraire: number;
  coefficient: number;
  panierId?: number;
  enseignantId?: number;
  notes?: NoteDto[]; 
}

