import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:8080/api/utilisateurs';

  constructor(private http: HttpClient) {}

  login(credentials: { email: string; password: string; staySignedIn: boolean }): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, { email: credentials.email, password: credentials.password }).pipe(
      tap((response: any) => {
        if (response.token) {
          localStorage.setItem('token', response.token);
        }
      })
    );
  }

  register(user: { email: string; password: string; nom: string; prenom: string; departement: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, user);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  logout(): void {
    localStorage.removeItem('token');
  }

  getCurrentUser(): Observable<any> {
    return this.http.get(`${this.apiUrl}/me`, {
      headers: { Authorization: `Bearer ${this.getToken()}` }
    });
  }
}