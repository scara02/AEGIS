import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

interface HealthStatus {
  influxdb: boolean;
  postgresql: boolean;
}

@Injectable({ providedIn: 'root' })
export class HealthService {
  private apiUrl = '/api/health';

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('access_token') || '';
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  getDbHealth(): Observable<HealthStatus> {
    return this.http.get<HealthStatus>(this.apiUrl, { headers: this.getAuthHeaders() }).pipe(
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
}
