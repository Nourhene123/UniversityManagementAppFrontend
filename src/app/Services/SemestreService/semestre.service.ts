// src/app/services/semestre.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SemestreDto } from 'src/app/models/SemestreDto';

@Injectable({
  providedIn: 'root'
})
export class SemestreService {
  private apiUrl = 'http://localhost:8080/api/semestres'; 

  constructor(private http: HttpClient) {}

  getAllSemestres(): Observable<SemestreDto[] | null> {
    return this.http.get<SemestreDto[]>(this.apiUrl);
  }

  getSemestreById(id: number): Observable<SemestreDto> {
    return this.http.get<SemestreDto>(`${this.apiUrl}/${id}`);
  }

  createSemestre(semestre: SemestreDto): Observable<SemestreDto> {
    return this.http.post<SemestreDto>(this.apiUrl, semestre);
  }

  deleteSemestre(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}