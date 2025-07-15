import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { MatiereDto } from 'src/app/models/MatiereDto';

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

  deleteMatiere(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
    getMatieresByEnseignant(): Observable<MatiereDto[]> {
    return this.http.get<MatiereDto[]>(`${this.apiUrl}/enseignant/matieres`, { headers: this.getHeaders() });
  }



}