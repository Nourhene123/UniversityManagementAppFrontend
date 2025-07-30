import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, Observable, tap } from 'rxjs';
import { MatiereDto } from 'src/app/models/MatiereDto';
import { MatiereAverageDto } from 'src/app/models/MatiereAverageDto';

@Injectable({
  providedIn: 'root'
})
export class MatiereService {
  private apiUrl = 'http://localhost:8080/api/matieres'; 

  constructor(private http: HttpClient) {}
   private getHeaders(): HttpHeaders {
      const token = localStorage.getItem('token'); 
      return new HttpHeaders({
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      });
    }

  getAllMatieres(): Observable<MatiereDto[]> {
    return this.http.get<MatiereDto[]>(this.apiUrl);
  }

  getMatiereById(id: number): Observable<MatiereDto> {
    return this.http.get<MatiereDto>(`${this.apiUrl}/${id}`);
  }
  updateMatiere(matiere: MatiereDto): Observable<MatiereDto> {
    return this.http.put<MatiereDto>(`${this.apiUrl}/${matiere.id}`, matiere);
  }
  createMatiere(matiere: MatiereDto): Observable<MatiereDto> {
    return this.http.post<MatiereDto>(this.apiUrl, matiere, { headers: this.getHeaders() });
  }

  getMatiereAverages(matiereId: number): Observable<MatiereAverageDto[]> {
    console.log(`Requesting averages for matiereId: ${matiereId}`);
    return this.http.get<MatiereAverageDto[]>(`${this.apiUrl}/averages/${matiereId}`).pipe(
      tap(averages => console.log(`Received averages:`, averages)),
      catchError(error => {
        console.error(`Error fetching averages for matiereId ${matiereId}:`, error);
        throw error;
      })
    );
  }
  deleteMatiere(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
    getMatieresByEnseignant(): Observable<MatiereDto[]> {
    return this.http.get<MatiereDto[]>(`${this.apiUrl}/enseignant/matieres`, { headers: this.getHeaders() });
  }



}