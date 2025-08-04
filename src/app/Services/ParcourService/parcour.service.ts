import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, Observable, throwError } from 'rxjs';
import { ParcourDto } from 'src/app/models/ParcourDto';
import { EtudiantDto } from 'src/app/models/EtudiantDto';
import { ParcourWithStudents } from 'src/app/models/ParcourWithStudents';

@Injectable({
  providedIn: 'root'
})
export class ParcourService {
  private apiUrl = 'http://localhost:8080/api/parcours';

  constructor(private http: HttpClient) { }

  getAllParcours(): Observable<ParcourDto[]> {
    return this.http.get<ParcourDto[]>(this.apiUrl);
  }  getStudentsGroupedByParcour(): Observable<ParcourWithStudents[]> {
    return this.http.get<ParcourWithStudents[]>(`${this.apiUrl}/count/by-parcour`, { headers: this.getHeaders() }).pipe(
      catchError(err => {
        console.error('Error fetching students grouped by parcour:', err);
        return throwError(() => new Error('Failed to fetch students grouped by parcour'));
      })
    );
  }


  getParcourById(id: number): Observable<ParcourDto> {
    return this.http.get<ParcourDto>(`${this.apiUrl}/${id}`);
  }

 createParcour(parcour: ParcourDto): Observable<ParcourDto> {
  const headers = { 
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('token')}` };
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
  getEtudiantsByParcourId(id: number): Observable<EtudiantDto[]> {
    return this.http.get<EtudiantDto[]>(`${this.apiUrl}/${id}/etudiants`, { headers: this.getHeaders() });
  }
assignManyEtudiantsToParcour(etudiantIds: number[], parcourId: number) {
  const url = `${this.apiUrl}/${parcourId}/assign-etudiants`;
  const headers = new HttpHeaders({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
  });

  return this.http.post<{ success: EtudiantDto[]; failed: EtudiantDto[] }>(
    url, etudiantIds, { headers }
  );
}



   getParcoursByMatiereId(matiereId: number): Observable<ParcourDto[]> {
    return this.http.get<ParcourDto[]>(`${this.apiUrl}/matiere/${matiereId}`, { headers: this.getHeaders() });
  }




}