export interface PanierDto {
  id?: number;
  nom: string;
  coefficientTotal: number;
  semestre: string;
  parcourId?: number;
  matiereIds?: number[];
}