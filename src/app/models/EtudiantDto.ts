import { NoteDto } from "./NoteDto";

export interface EtudiantDto {
  parcourId: number | null;

  id?: number;
  nom: string;
  prenom: string;
  email: string;
  password: string;
  role: string;
  numeroInscription: string;
   note?: NoteDto ;
}

export { NoteDto };
