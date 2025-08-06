// src/app/services/enseignant.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, Observable } from 'rxjs';
import { EnseignantDto } from 'src/app/models/EnseignantDto';

@Injectable({
  providedIn: 'root'
})
export class EnseignantService {
  private apiUrl = 'http://localhost:8080/api/utilisateurs'; 

constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    });
  }

  getEnseignantCount(): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/count/by-role/Enseignant`);
  }

 getAllEnseignants(): Observable<EnseignantDto[] | null> {
    return this.http.get<EnseignantDto[] | null>(this.apiUrl + '/all');
  }
  getUtilisateurByEmail(email: string): Observable<EnseignantDto> {
    return this.http.get<EnseignantDto>(`${this.apiUrl}/email/${email}`, { withCredentials: true });
  }
  getEnseignantById(id: number): Observable<EnseignantDto> {
    return this.http.get<EnseignantDto>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() }).pipe(
      catchError(error => {
        console.error(`Error fetching enseignant with id ${id}:`, error);
        throw error;
      })
    );
  }

  createEnseignant(enseignant: EnseignantDto): Observable<EnseignantDto> {
    return this.http.post<EnseignantDto>(`${this.apiUrl}/admin/register`, enseignant); 
  }

  updateEnseignant(id: number, enseignant: EnseignantDto): Observable<EnseignantDto> {
    return this.http.put<EnseignantDto>(`${this.apiUrl}/${id}`, enseignant);
  }

  deleteEnseignant(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}