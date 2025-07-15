import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { NoteDto, TypeNote } from 'src/app/models/NoteDto';

@Injectable({
  providedIn: 'root'
})
export class NoteService {
  private apiUrl = 'http://localhost:8080/api/notes';

  constructor(private http: HttpClient) {}

  

  // Update an existing note
  updateNote(note: NoteDto): Observable<NoteDto> {
    const url = `${this.apiUrl}/${note.id}`;
    return this.http.put<NoteDto>(url, note);
  }

  // Create a new note (if the ID is null or undefined)
  createNote(note: NoteDto): Observable<NoteDto> {
    return this.http.post<NoteDto>(this.apiUrl, note);
  }
   getNotesBySemestreAndType(semestreId: number, typeNote: TypeNote | ''): Observable<NoteDto[]> {
    let params = new HttpParams()
      .set('semestreId', semestreId.toString())
      .set('typeNote', typeNote);
    return this.http.get<NoteDto[]>(`${this.apiUrl}/by-semestre-and-type`, { params });
  }
  

}