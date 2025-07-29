
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PanierDto } from 'src/app/models/PanierDto';

@Injectable({
  providedIn: 'root'
})
export class PanierService {
 
  private apiUrl = 'http://localhost:8080/api/paniers'; 
  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    });
  }

  constructor(private http: HttpClient) {}
  
 updatePanier(parcour: PanierDto): Observable<PanierDto> {
  if (!parcour.id) {
    throw new Error('Parcour ID is required for update');
  }
  return this.http.put<PanierDto>(`${this.apiUrl}/${parcour.id}`, parcour, { headers: this.getHeaders() });
}
  getAllPaniers(): Observable<PanierDto[]> {
    return this.http.get<PanierDto[]>(this.apiUrl);
  }

  getPanierById(id: number): Observable<PanierDto> {
    return this.http.get<PanierDto>(`${this.apiUrl}/${id}`);
  }

  createPanier(panier: PanierDto): Observable<PanierDto> {
    return this.http.post<PanierDto>(this.apiUrl, panier);
  }

  deletePanier(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
  getPaniersByTeacher(): Observable<PanierDto[]> {
  const url = `${this.apiUrl}/teacher`; 
  return this.http.get<PanierDto[]>(url, { headers: this.getHeaders() });
}

}