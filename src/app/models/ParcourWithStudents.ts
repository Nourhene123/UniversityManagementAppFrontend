import { EtudiantDto } from './EtudiantDto';

export interface ParcourWithStudents {
  parcourId: number;
  parcourNom: string;
  studentCount: number;
  etudiants: EtudiantDto[];
}