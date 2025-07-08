
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, Observable, throwError } from 'rxjs';
import { SemestreDto } from 'src/app/models/SemestreDto';

@Injectable({
  providedIn: 'root'
})
export class SemestreService {
  
  private apiUrl = 'http://localhost:8080/api/semestres'; 

  constructor(private http: HttpClient) {}
  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token'); 
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    });
  }

  getAllSemestres(): Observable<SemestreDto[] | null> {
    return this.http.get<SemestreDto[]>(this.apiUrl);
  }

  getSemestreById(id: number): Observable<SemestreDto> {
    return this.http.get<SemestreDto>(`${this.apiUrl}/${id}`);
  }

 createSemestre(semestre: SemestreDto): Observable<SemestreDto> {
    return this.http.post<SemestreDto>(this.apiUrl, semestre, { headers: this.getHeaders() }).pipe(
      catchError(this.handleError)
    );
  }
  updateSemestre(semestre: SemestreDto): Observable<SemestreDto> {
    return this.http.put<SemestreDto>(`${this.apiUrl}/${semestre.id}`, semestre, { headers: this.getHeaders() }).pipe(
      catchError(this.handleError)
    );
  }

  deleteSemestre(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  private handleError(error: any): Observable<never> {
  
    console.error('An error occurred:', error);
    return throwError(() => error);
  }
}