import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PanierDto } from 'src/app/models/PanierDto';

@Injectable({
  providedIn: 'root'
})
export class PanierService {
  private apiUrl = 'http://localhost:8080/api/paniers';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    });
  }

  getAllPaniers(): Observable<PanierDto[]> {
    return this.http.get<PanierDto[]>(this.apiUrl, { headers: this.getHeaders() });
  }

  getPanierById(id: number): Observable<PanierDto> {
    return this.http.get<PanierDto>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
  }

  createPanier(panier: PanierDto): Observable<PanierDto> {
    return this.http.post<PanierDto>(this.apiUrl, panier, { headers: this.getHeaders() });
  }

  updatePanier(parcour: PanierDto): Observable<PanierDto> {
    if (!parcour.id) {
      throw new Error('Parcour ID is required for update');
    }
    return this.http.put<PanierDto>(`${this.apiUrl}/${parcour.id}`, parcour, { headers: this.getHeaders() });
  }

  deletePanier(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() });
  }

  getPaniersByTeacher(): Observable<PanierDto[]> {
    const url = `${this.apiUrl}/teacher`;
    return this.http.get<PanierDto[]>(url, { headers: this.getHeaders() });
  }
}

export { PanierDto };
