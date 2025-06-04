import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { jwtDecode } from 'jwt-decode';

interface DecodedToken {
  role?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = '/auth/token';

  constructor(private http: HttpClient) {
  }

  login(username: string, password: string): Observable<{ access_token: string }> {
    return this.http.post<{ access_token: string }>(this.apiUrl, {username, password}).pipe(
      tap(response => {
        localStorage.setItem('access_token', response.access_token);
      })
    );
  }

  get isAdmin(): boolean {
    const token = localStorage.getItem('access_token');
    if (!token) return false;

    try {
      const decoded = jwtDecode<DecodedToken>(token);
      return decoded.role === 'admin';
    } catch {
      return false;
    }
  }
}
