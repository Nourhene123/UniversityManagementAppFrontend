import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ParcourDto } from 'src/app/models/ParcourDto';

@Injectable({
  providedIn: 'root'
})
export class ParcourService {
  private apiUrl = 'http://localhost:8080/api/parcours';

  constructor(private http: HttpClient) { }

  getAllParcours(): Observable<ParcourDto[]> {
    return this.http.get<ParcourDto[]>(this.apiUrl);
  }

  getParcourById(id: number): Observable<ParcourDto> {
    return this.http.get<ParcourDto>(`${this.apiUrl}/${id}`);
  }

 createParcour(parcour: ParcourDto): Observable<ParcourDto> {
  const headers = { 
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('token')}` // Adjust based on your auth mechanism
  };
  return this.http.post<ParcourDto>(this.apiUrl, parcour, { headers });
}
private getHeaders(): HttpHeaders {
  return new HttpHeaders({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  });
}
  updateParcour(parcour: ParcourDto): Observable<ParcourDto> {
  if (!parcour.id) {
    throw new Error('Parcour ID is required for update');
  }
  return this.http.put<ParcourDto>(`${this.apiUrl}/${parcour.id}`, parcour, { headers: this.getHeaders() });
}

  deleteParcour(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}