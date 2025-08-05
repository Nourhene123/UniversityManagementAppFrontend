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
    return this.http.get<MatiereDto[]>(this.apiUrl, { headers: this.getHeaders() }).pipe(
      catchError(error => {
        console.error('Error fetching all matieres:', error);
        throw error;
      })
    );
  }

  getMatiereById(id: number): Observable<MatiereDto> {
    return this.http.get<MatiereDto>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() }).pipe(
      catchError(error => {
        console.error(`Error fetching matiere with id ${id}:`, error);
        throw error;
      })
    );
  }

  updateMatiere(matiere: MatiereDto): Observable<MatiereDto> {
    return this.http.put<MatiereDto>(`${this.apiUrl}/${matiere.id}`, matiere, { headers: this.getHeaders() }).pipe(
      catchError(error => {
        console.error(`Error updating matiere with id ${matiere.id}:`, error);
        throw error;
      })
    );
  }

  createMatiere(matiere: MatiereDto): Observable<MatiereDto> {
    return this.http.post<MatiereDto>(this.apiUrl, matiere, { headers: this.getHeaders() }).pipe(
      catchError(error => {
        console.error('Error creating matiere:', error);
        throw error;
      })
    );
  }

  getMatiereAverages(matiereId: number): Observable<MatiereAverageDto[]> {
    console.log(`Requesting averages for matiereId: ${matiereId}`);
    return this.http.get<MatiereAverageDto[]>(`${this.apiUrl}/averages/${matiereId}`, { headers: this.getHeaders() }).pipe(
      tap(averages => console.log(`Received averages:`, averages)),
      catchError(error => {
        console.error(`Error fetching averages for matiereId ${matiereId}:`, error);
        throw error;
      })
    );
  }

  deleteMatiere(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() }).pipe(
      catchError(error => {
        console.error(`Error deleting matiere with id ${id}:`, error);
        throw error;
      })
    );
  }

  getMatieresByEnseignant(): Observable<MatiereDto[]> {
    return this.http.get<MatiereDto[]>(`${this.apiUrl}/enseignant/matieres`, { headers: this.getHeaders() }).pipe(
      catchError(error => {
        console.error('Error fetching matieres for enseignant:', error);
        throw error;
      })
    );
  }
}