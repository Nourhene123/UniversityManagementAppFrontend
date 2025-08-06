// src/app/models/ParcourDto.ts
import { EtudiantDto } from './EtudiantDto';
import { MatiereDto } from './MatiereDto';
import { SemestreDto } from './SemestreDto';
import { PanierDto } from './PanierDto';

export interface ParcourDto {
  id?: number;
  nom: string;
  annee: string;
  libelle: string;
  panierIds?: number[];
  paniers?: PanierDto[]; // to store fetched Panier details
}

export interface ParcourDtoWithEtudiants extends ParcourDto {
  etudiants: EtudiantDto[];
}