import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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
    return this.http.post<ParcourDto>(this.apiUrl, parcour);
  }

  deleteParcour(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
