import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { NoteDto, TypeNote } from 'src/app/models/NoteDto';
import { MatiereAverageDto } from 'src/app/models/MatiereAverageDto';
import { TypeNoteCoefficientDto } from 'src/app/models/TypeNoteCoefficientDto';

@Injectable({
  providedIn: 'root'
})
export class NoteService {
  private apiUrl = 'http://localhost:8080/api/notes';
 
  private coefficientApiUrl = 'http://localhost:8080/api/type-note-coefficients';

  constructor(private http: HttpClient) {}
   private getHeaders(): HttpHeaders {
      const token = localStorage.getItem('token'); 
      return new HttpHeaders({
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      });
    }
  getNoteTypes(): Observable<TypeNote[]> {
    return this.http.get<TypeNote[]>(`${this.apiUrl}/types`, { headers: this.getHeaders() });
  }

  getNotesByType(typeNote: TypeNote | ''): Observable<NoteDto[]> {
    let params = new HttpParams().set('typeNote', typeNote);
    return this.http.get<NoteDto[]>(`${this.apiUrl}/by-type`, { headers: this.getHeaders(), params });
  }

  createNote(note: NoteDto): Observable<NoteDto> {
    return this.http.post<NoteDto>(this.apiUrl, note, { headers: this.getHeaders() });
  }

  updateNote(id: number, note: NoteDto): Observable<NoteDto> {
    const url = `${this.apiUrl}/${id}`;
    return this.http.put<NoteDto>(url, note, { headers: this.getHeaders() });
  }getCoefficientsByMatiere(matiereId: number): Observable<TypeNoteCoefficientDto[]> {
    return this.http.get<TypeNoteCoefficientDto[]>(`${this.coefficientApiUrl}/matiere/${matiereId}`, { headers: this.getHeaders() });
  }

  createCoefficient(coefficient: TypeNoteCoefficientDto): Observable<TypeNoteCoefficientDto> {
    return this.http.post<TypeNoteCoefficientDto>(this.coefficientApiUrl, coefficient, { headers: this.getHeaders() });
  }

  updateCoefficient(id: number, coefficient: TypeNoteCoefficientDto): Observable<TypeNoteCoefficientDto> {
    return this.http.put<TypeNoteCoefficientDto>(`${this.coefficientApiUrl}/${id}`, coefficient, { headers: this.getHeaders() });
  }

  deleteCoefficient(id: number): Observable<void> {
    return this.http.delete<void>(`${this.coefficientApiUrl}/${id}`, { headers: this.getHeaders() });
  }

  getMatiereAverages(matiereId?: number, etudiantId?: number): Observable<MatiereAverageDto[]> {
    let params = new HttpParams();
    if (matiereId) params = params.set('matiereId', matiereId.toString());
    if (etudiantId) params = params.set('etudiantId', etudiantId.toString());
    return this.http.get<MatiereAverageDto[]>(`${this.apiUrl}/averages`, { headers: this.getHeaders(), params });
  }
}