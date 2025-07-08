import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { EtudiantDto } from 'src/app/models/EtudiantDto';

@Injectable({
  providedIn: 'root'
})
export class EtudiantService {
  private apiUrl = 'http://localhost:8080/api/utilisateurs'; 

  constructor(private http: HttpClient) {}

getEtudiantCount(): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/countByRole/Etudiant`);
  }

  getAllEtudiants(): Observable<EtudiantDto[]> {
    return this.http.get<EtudiantDto[]>(`${this.apiUrl}/all`); }

  getEtudiantById(id: number): Observable<EtudiantDto> {
    return this.http.get<EtudiantDto>(`${this.apiUrl}/${id}`);
  }

  createEtudiant(etudiant: EtudiantDto): Observable<EtudiantDto> {
    return this.http.post<EtudiantDto>(`${this.apiUrl}/register`, etudiant); 
  }

  updateEtudiant(id: number, etudiant: EtudiantDto): Observable<EtudiantDto> {
    return this.http.put<EtudiantDto>(`${this.apiUrl}/${id}`, etudiant);
  }

  deleteEtudiant(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
  
