import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ClasseDto } from '../../models/ClasseDto';
import { EtudiantDto } from '../../models/EtudiantDto';

@Injectable({
  providedIn: 'root'
})
export class ClasseService {
  getClassesByEnseignantId(enseignantId: number) {
    throw new Error('Method not implemented.');
  }
  private apiUrl = 'http://localhost:8080/api/classes';

  constructor(private http: HttpClient) {}

  getAllClasses(): Observable<ClasseDto[]> {
    return this.http.get<ClasseDto[]>(this.apiUrl).pipe(
      catchError(this.handleError)
    );
  }

  getClasseById(id: number): Observable<ClasseDto> {
    return this.http.get<ClasseDto>(`${this.apiUrl}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  createClasse(classe: ClasseDto): Observable<ClasseDto> {
    return this.http.post<ClasseDto>(this.apiUrl, classe).pipe(
      catchError(this.handleError)
    );
  }

  updateClasse(id: number, classe: ClasseDto): Observable<ClasseDto> {
    return this.http.put<ClasseDto>(`${this.apiUrl}/${id}`, classe).pipe(
      catchError(this.handleError)
    );
  }

  deleteClasse(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  getEtudiantsByClasseId(id: number): Observable<EtudiantDto[]> {
    return this.http.get<EtudiantDto[]>(`${this.apiUrl}/${id}/etudiants`).pipe(
      catchError(this.handleError)
    );
  }

  assignStudentsToClasse(id: number, etudiantIds: number[]): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${id}/etudiants`, etudiantIds).pipe(
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