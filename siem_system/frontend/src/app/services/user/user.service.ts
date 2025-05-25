import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { User } from '../../models/user.model';
import { catchError } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class UserService {
  private apiUrl = `http://127.0.0.1:8000/api/users`;

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('access_token') || '';
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  getUsers(searchQuery: string = '', page: number = 1, limit: number = 10, sortField: string | null = null, sortDirection: 'asc' | 'desc' = 'asc'): Observable<{ data: User[], total: number }> {
    const params = new URLSearchParams({
      search: searchQuery,
      page: page.toString(),
      limit: limit.toString(),
      ...(sortField && { sort_field: sortField }),
      ...(sortField && { sort_direction: sortDirection })
    });
    return this.http.get<{ data: User[], total: number }>(`${this.apiUrl}?${params.toString()}`, { headers: this.getAuthHeaders() });
  }

  addUser(user: Omit<User, 'id'>): Observable<User> {
    return this.http.post<User>(this.apiUrl, user, { headers: this.getAuthHeaders() });
  }

  updateUser(userId: number, userData: Partial<User>): Observable<User> {
    return this.http.put<User>(
      `${this.apiUrl}/${userId}`,
      userData,
      { headers: this.getAuthHeaders() }
    );
  }

  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/${id}`,
      { headers: this.getAuthHeaders() }
    );
  }

  getCurrentUser(): Observable<User> {
    return this.http.get<User>(
      `${this.apiUrl}/me`,
      { headers: this.getAuthHeaders() }
    );
  }

  updateCurrentUser(userData: Partial<User>): Observable<User> {
    return this.http.put<User>(
      `${this.apiUrl}/me`,
      userData,
      { headers: this.getAuthHeaders() }
    );
  }

  updatePassword(currentPassword: string, newPassword: string, confirmPassword: string): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/update-password`,
      {
        current_password: currentPassword,
        new_password: newPassword,
        confirm_password: confirmPassword
      },
      { headers: this.getAuthHeaders() }
    ).pipe(
      catchError(error => {
        let errorMessage = 'An unknown error occurred!';

        if (error.status === 0) {
          errorMessage = 'Connection refused - check if server is running';
        } else if (error.error?.detail) {
          errorMessage = error.error.detail;
        }

        return throwError(() => new Error(errorMessage));
      })
    );
  }

  updateUserPassword(userId: number, newPassword: string): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${userId}/password`, { new_password: newPassword });
  }
}
