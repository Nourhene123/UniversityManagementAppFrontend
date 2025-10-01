import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, Observable, throwError } from 'rxjs';
import { EtudiantDto } from 'src/app/models/EtudiantDto';
import { UserResponse } from 'src/app/models/UserResponse';

export interface EtudiantWithNote {
  etudiant: EtudiantDto;
  notes: any[];
}

@Injectable({
  providedIn: 'root'
})
export class EtudiantService {
  getCourseProgress(userId: Observable<UserResponse | null>) {
    throw new Error('Method not implemented.');
  }
  private apiUrl = 'http://localhost:8080/api/utilisateurs'; 

  constructor(private http: HttpClient) {}

getEtudiantCount(): Observable<number> {
  return this.http.get<number>(`${this.apiUrl}/count/by-role/Etudiant`);
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
  getStudentCountByParcour(): Observable<{ parcourNom: string, studentCount: number }[]> {
    return this.http.get<{ parcourNom: string, studentCount: number }[]>(`${this.apiUrl}/count/by-parcour`);
  }

  deleteEtudiant(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

assignParcourToEtudiants(etudiantIds: number[], parcourId: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/assign-parcour`, { etudiantIds, parcourId });
  }

   private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    });
  }

  getEtudiantsByParcour(parcourId: number): Observable<EtudiantDto[]> {
    return this.http.get<EtudiantDto[]>(`http://localhost:8080/api/etudiants/parcours/${parcourId}`, { headers: this.getHeaders() })
      .pipe(
        catchError(err => {
          console.error(`Error fetching students for parcour ${parcourId}:`, err);
          if (err.status === 403) {
            localStorage.removeItem('token'); // Clear invalid token
            return throwError(() => new Error('Session expired. Please log in again.'));
          }
          return throwError(() => new Error(`Failed to fetch students for parcour ${parcourId}`));
        })
      );
  }

  private handleError(err: any): Observable<never> {
    console.error('EtudiantService error:', err);
    return throwError(() => new Error(err.message || 'Server error'));
  }
}