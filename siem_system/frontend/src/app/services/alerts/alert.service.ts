import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Alert } from '../../models/alert.model';

@Injectable({
  providedIn: 'root'
})
export class AlertService {
  private apiUrl = 'http://127.0.0.1:8000/api/alerts';

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('access_token');
    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    });
  }

  getAlerts(
    searchQuery: string = '',
    page: number = 1,
    limit: number = 10,
    sortField: string | null = null,
    sortDirection: 'asc' | 'desc' = 'desc'
  ): Observable<{ data: Alert[]; total: number }> {
    const params = new URLSearchParams({
      search: searchQuery,
      page: page.toString(),
      limit: limit.toString(),
      ...(sortField && { sort_field: sortField }),
      ...(sortField && { sort_direction: sortDirection }),
    });
    return this.http
      .get<{ data: Alert[]; total: number }>(`${this.apiUrl}?${params.toString()}`, {
        headers: this.getAuthHeaders(),
      })
      .pipe(
        map((response) => ({
          data: response.data.map((log) => ({
            ...log,
            timestamp: new Date(log.timestamp),
            isExpanded: false,
          })),
          total: response.total,
        }))
      );
  }

  updateAlertStatus(id: number, status: string): Observable<Alert> {
    return this.http.patch<Alert>(
      `${this.apiUrl}/${id}/status`,
      { status },
      { headers: this.getAuthHeaders() }
    );
  }
}
