
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PanierDto } from 'src/app/models/PanierDto';

@Injectable({
  providedIn: 'root'
})
export class PanierService {
  updatePanier(panier: PanierDto) {
    throw new Error('Method not implemented.');
  }
  private apiUrl = 'http://localhost:8080/api/paniers'; 

  constructor(private http: HttpClient) {}

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
}