export interface PanierDto {
  id?: number;
  nom: string;
  coefficientTotal: number;
 semestreId?: number;
  parcourId?: number;
  matiereIds?: number[];
}