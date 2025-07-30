import { MatiereDto } from './MatiereDto';
import { SemestreDto } from './SemestreDto';
export interface ParcourDto {
  id?: number;
  nom: string;
  annee: string;
  libelle: string;
  etudiantIds?: number[];
  panierIds?: number[];
  
  matieres?: MatiereDto[];
  semesters?: SemestreDto[];
}
