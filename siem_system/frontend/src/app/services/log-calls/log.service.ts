import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

interface ApiResponse {
  data: Array<Record<string, any>>;
}

@Injectable({
  providedIn: 'root'
})
export class LogService {
  private baseUrl = 'http://127.0.0.1:8000/api';

  constructor(private http: HttpClient) {
  }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('access_token') || '';
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  getLogs(
    limit: number,
    page: number,
    measurement: string,
    filters: any[],
    searchQuery?: string,
    sortField?: string | null,
    sortDirection?: 'asc' | 'desc'):
    Observable<ApiResponse> {
    const params = new URLSearchParams({
      limit: limit.toString(),
      page: page.toString(),
      measurement,
      q: searchQuery || ''
    });

    if (sortField) {
      params.append('sort_field', sortField);
      params.append('sort_direction', sortDirection || 'desc');
    }


    if (filters.length > 0) {
      params.append('filters', JSON.stringify(filters));
    }
    return this.http.get<ApiResponse>(`${this.baseUrl}/logs?${params.toString()}`, {
      headers: this.getAuthHeaders()
    });
  }

  getMeasurements(): Observable<string[]> {
    return this.http.get<string[]>(`${this.baseUrl}/measurements`, {
      headers: this.getAuthHeaders()
    });
  }

  getFields(measurement: string): Observable<string[]> {
    const params = new URLSearchParams({measurement});
    return this.http.get<string[]>(`${this.baseUrl}/fields?${params.toString()}`, {
      headers: this.getAuthHeaders()
    });
  }

  getValues(measurement: string, field: string): Observable<string[]> {
    const params = new URLSearchParams({measurement, field});
    return this.http.get<string[]>(`${this.baseUrl}/values?${params.toString()}`, {
      headers: this.getAuthHeaders()
    });
  }

  getFieldType(measurement: string, field: string): Observable<string> {
    const params = new URLSearchParams({measurement, field});
    return this.http.get<string>(`${this.baseUrl}/field-type?${params.toString()}`, {
      headers: this.getAuthHeaders()
    });
  }
}
