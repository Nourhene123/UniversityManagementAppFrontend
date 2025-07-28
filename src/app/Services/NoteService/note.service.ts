import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { NoteDto, TypeNote } from 'src/app/models/NoteDto';

@Injectable({
  providedIn: 'root'
})
export class NoteService {
  private apiUrl = 'http://localhost:8080/api/notes';

  constructor(private http: HttpClient) {}

 private getHeaders(): HttpHeaders {
    const email = 'doggi@gmail.com';
    const password = 'your_password'; // Replace with actual password
    const auth = btoa(`${email}:${password}`);
    return new HttpHeaders({
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json'
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
  }
}