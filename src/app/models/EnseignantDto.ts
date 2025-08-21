export interface EnseignantDto {

  id?: number;
  tempId?: number;
  nom: string;
  prenom: string;
  email: string;
  password?: string;
  role: string;
  departement?: string; 
}