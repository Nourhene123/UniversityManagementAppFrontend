import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { ClasseDto } from '../../models/ClasseDto';
import { EtudiantDto } from '../../models/EtudiantDto';
import { ClasseWithMatieresDto } from '../../models/ClasseWithMatieresDto';

@Injectable({
  providedIn: 'root'
})
export class ClasseService {
  private apiUrl = 'http://localhost:8080/api/classes';

  constructor(private http: HttpClient) {}

  // Helper method to get headers with JWT token
  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token'); // Adjust based on your auth storage
    return new HttpHeaders({
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json'
    });
  }

  getAllClasses(): Observable<ClasseDto[]> {
    return this.http.get<ClasseDto[]>(this.apiUrl, { headers: this.getHeaders() }).pipe(
      catchError(this.handleError)
    );
  }

  getClasseById(id: number): Observable<ClasseDto> {
    return this.http.get<ClasseDto>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() }).pipe(
      catchError(this.handleError)
    );
  }

  createClasse(classe: ClasseDto): Observable<ClasseDto> {
    return this.http.post<ClasseDto>(this.apiUrl, classe, { headers: this.getHeaders() }).pipe(
      catchError(this.handleError)
    );
  }

  updateClasse(id: number, classe: ClasseDto): Observable<ClasseDto> {
    return this.http.put<ClasseDto>(`${this.apiUrl}/${id}`, classe, { headers: this.getHeaders() }).pipe(
      catchError(this.handleError)
    );
  }

  deleteClasse(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() }).pipe(
      catchError(this.handleError)
    );
  }

getEtudiantsByClasseId(id: number): Observable<EtudiantDto[]> {
  return this.http.get<EtudiantDto[]>(`${this.apiUrl}/${id}/etudiants`, { headers: this.getHeaders() }).pipe(
    tap(data => console.log(`Students for class ${id}:`, data)),
    catchError(this.handleError)
  );
}

  assignStudentsToClasse(id: number, etudiantIds: number[]): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${id}/etudiants`, etudiantIds, { headers: this.getHeaders() }).pipe(
      catchError(this.handleError)
    );
  }

  getClassesByParcour(parcourId: number): Observable<ClasseDto[]> {
    return this.http.get<ClasseDto[]>(`${this.apiUrl}/parcour/${parcourId}`, { headers: this.getHeaders() }).pipe(
      catchError(this.handleError)
    );
  }

  getClassesByEnseignantId(enseignantId: number): Observable<ClasseWithMatieresDto[]> {
    return this.http.get<ClasseWithMatieresDto[]>(`${this.apiUrl}/enseignant/${enseignantId}`, { headers: this.getHeaders() }).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An unknown error occurred!';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
      if (error.error && error.error.message) {
        errorMessage = error.error.message;
      }
    }
    return throwError(() => new Error(errorMessage));
  }
}