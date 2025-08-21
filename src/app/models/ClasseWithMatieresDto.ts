import { MatiereDto } from "./MatiereDto";

export interface ClasseWithMatieresDto {
  id: number;
  nom: string;
  section: string;
  parcourId: number;
  etudiantIds: number[];
  matieres: MatiereDto[];
}