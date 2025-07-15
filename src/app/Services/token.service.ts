
import { Injectable } from '@angular/core';
import { UserResponse } from '../models/UserResponse';

@Injectable({
  providedIn: 'root'
})
export class TokenService {
 private _token: string | null = null;
  private _user: UserResponse | null = null;

  constructor() {
    // Initialize from localStorage
    this._token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    if (user) {
      try {
        this._user = JSON.parse(user);
        console.log('TokenService: Initialized user from localStorage:', JSON.stringify(this._user, null, 2));
      } catch (e) {
        console.error('TokenService: Error parsing user from localStorage:', e);
        this._user = null;
      }
    }
  }

  set token(token: string | null) {
    this._token = token;
    if (token) {
      localStorage.setItem('token', token);
      console.log('TokenService: Token stored:', token);
    } else {
      localStorage.removeItem('token');
      console.log('TokenService: Token removed');
    }
  }

  get token(): string | null {
    return this._token || localStorage.getItem('token');
  }

  set user(user: UserResponse | null) {
    this._user = user;
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
      console.log('TokenService: User stored:', JSON.stringify(user, null, 2));
    } else {
      localStorage.removeItem('user');
      console.log('TokenService: User removed');
    }
  }

  get user(): UserResponse | null {
    if (this._user) {
      return this._user;
    }
    const user = localStorage.getItem('user');
    if (user) {
      try {
        this._user = JSON.parse(user);
        console.log('TokenService: User retrieved from localStorage:', JSON.stringify(this._user, null, 2));
        return this._user;
      } catch (e) {
        console.error('TokenService: Error parsing user from localStorage:', e);
        return null;
      }
    }
    return null;
  }
}