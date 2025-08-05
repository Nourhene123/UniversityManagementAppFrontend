import { EtudiantDto } from './EtudiantDto';
import { MatiereDto } from './MatiereDto';
import { SemestreDto } from './SemestreDto';
export interface ParcourDto {
  id?: number;
  nom: string;
  annee: string;
  libelle: string;
  panierIds?: number[];
  
  matieres?: MatiereDto[];
  semesters?: SemestreDto[];
}
export interface ParcourDtoWithEtudiants extends ParcourDto {
  etudiants: EtudiantDto[];
}
