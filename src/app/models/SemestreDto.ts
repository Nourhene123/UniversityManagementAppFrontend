import { MatiereDto } from "./MatiereDto";

export interface SemestreDto {
    id?: number; 
    nom: string;
    panierIds: number[];
matieres?: MatiereDto[];}