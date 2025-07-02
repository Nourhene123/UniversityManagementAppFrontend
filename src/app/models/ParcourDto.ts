export interface ParcourDto {
  id: number;
  nom: string;
  annee: string;
  libelle: string;
  etudiantId?: number;
  panierIds?: number[];
}