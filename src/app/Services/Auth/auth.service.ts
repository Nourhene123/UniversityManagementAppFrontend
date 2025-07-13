
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { TokenService } from '../token.service';
import { UserResponse } from 'src/app/models/UserResponse';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:8080/api/utilisateurs';

  constructor(private http: HttpClient, private tokenService: TokenService) {}

login(credentials: { email: string; password: string; staySignedIn: boolean }): Observable<UserResponse> {
    return this.http.post<UserResponse>(`${this.apiUrl}/login`, {
      email: credentials.email,
      password: credentials.password,
      staySignedIn: credentials.staySignedIn
    }).pipe(
      tap((response: UserResponse) => {
        console.log('Storing token and user:', JSON.stringify(response, null, 2));
        this.tokenService.token = response.token;
        this.tokenService.user = response;
      })
    );
  }

  register(user: { email: string; password: string; nom: string; prenom: string; departement: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, user);
  }

  getCurrentUser(): Observable<UserResponse> {
    return this.http.get<UserResponse>(`${this.apiUrl}/me`, {
      headers: { Authorization: `Bearer ${this.tokenService.token}` }
    });
  }

  isLoggedIn(): boolean {
    return !!this.tokenService.token;
  }

  logout(): void {
    this.tokenService.token = null;
    this.tokenService.user = null;
  }
}