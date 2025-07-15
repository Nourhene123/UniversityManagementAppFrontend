
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { TokenService } from '../token.service';
import { UserResponse } from 'src/app/models/UserResponse';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  getEmail(): string {
    throw new Error('Method not implemented.');
  }
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

 getCurrentUser(): Observable<UserResponse | null> {
    const user = this.tokenService.user;
    if (user && user.token) {
      console.log('AuthService: Returning user from TokenService:', JSON.stringify(user, null, 2));
      return of(user);
    }
    console.log('AuthService: Fetching user from backend');
    return this.http.get<UserResponse>(`${this.apiUrl}/current-user`, {
      headers: new HttpHeaders({ Authorization: `Bearer ${this.tokenService.token || ''}` })
    }).pipe(
      tap(user => {
        // Only assign token if it exists in TokenService
        if (this.tokenService.token) {
          user.token = this.tokenService.token;
        }
        this.tokenService.user = user;
        console.log('AuthService: Fetched user from backend:', JSON.stringify(user, null, 2));
      }),
      catchError(error => {
        console.error('AuthService: Error fetching current user:', error);
        return of(null);
      })
    );
  }

  isLoggedIn(): boolean {
    return !!this.tokenService.token;
  }



  logout(): void {
    this.tokenService.token = null;
    this.tokenService.user = null;
  }
}