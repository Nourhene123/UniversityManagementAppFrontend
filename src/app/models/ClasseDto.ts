export interface ClasseDto {
  id?: number;
  nom: string;
  section: string;
  parcourId: number;
  matiereIds: number[];
  enseignantIds: number[];
  etudiantIds: number[];
}