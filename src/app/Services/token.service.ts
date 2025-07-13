
import { Injectable } from '@angular/core';
import { UserResponse } from '../models/UserResponse';

@Injectable({
  providedIn: 'root'
})
export class TokenService {
  private _token: string | null = null;
  private _user: UserResponse | null = null;

  set token(token: string | null) {
    this._token = token;
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }

  get token(): string | null {
    return this._token || localStorage.getItem('token');
  }

  set user(user: UserResponse | null) {
    this._user = user;
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  }

  get user(): UserResponse | null {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }
}