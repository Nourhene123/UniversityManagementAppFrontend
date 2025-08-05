import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';
import { ClasseDto } from 'src/app/models/ClasseDto';
import { EtudiantDto } from 'src/app/models/EtudiantDto';

@Injectable({
  providedIn: 'root'
})
export class ClasseService {
  private apiUrl = `http://localhost:8080/api/classes`;

  constructor(private http: HttpClient) {}

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

  deleteClasse(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      catchError(this.handleError)
    );
  }


  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An unknown error occurred!';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
    }
    return throwError(() => new Error(errorMessage));
  }
   getEtudiantsByClasseId(classeId: number): Observable<EtudiantDto[]> {
    return this.http.get<EtudiantDto[]>(`${this.apiUrl}/${classeId}/etudiants`);
  }
  getClassesByEnseignantId(enseignantId: number): Observable<ClasseDto[]> {
  return this.http.get<ClasseDto[]>(`${this.apiUrl}/enseignant/${enseignantId}`).pipe(
    catchError(this.handleError)
  );
}
}