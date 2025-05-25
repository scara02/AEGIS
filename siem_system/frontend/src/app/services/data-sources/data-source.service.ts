import { HttpClient, HttpHeaders } from '@angular/common/http';
import {map, Observable} from 'rxjs';
import { DataSource } from '../../models/data-source.model';
import { Injectable } from '@angular/core';

@Injectable()
export class DataSourceService {
  private apiUrl = 'http://127.0.0.1:8000/api/datasources';

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('access_token');
    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    });
  }

  getDataSources(searchQuery: string = '', page: number = 1, limit: number = 10, sortField: string | null = null, sortDirection: 'asc' | 'desc' = 'desc'): Observable<{ data: DataSource[], total: number }> {
    const params = new URLSearchParams({
      search: searchQuery,
      page: page.toString(),
      limit: limit.toString(),
      ...(sortField && { sort_field: sortField }),
      ...(sortField && { sort_direction: sortDirection })
    });
    return this.http.get<{ data: DataSource[], total: number }>(`${this.apiUrl}?${params.toString()}`).pipe(
      map(response => ({
        data: response.data.map(ds => ({
          ...ds,
          last_seen: new Date(ds.last_seen)
        })),
        total: response.total
      }))
    );
  }

  addDataSource(data: Omit<DataSource, 'id' | 'last_seen'>): Observable<DataSource> {
    return this.http.post<DataSource>(this.apiUrl, data, { headers: this.getAuthHeaders() });
  }

  updateDataSource(data: Partial<DataSource>): Observable<DataSource> {
    return this.http.put<DataSource>(`${this.apiUrl}/${data.id}`, data, { headers: this.getAuthHeaders() });
  }

  deleteDataSource(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`, { headers: this.getAuthHeaders() });
  }

  updateDataSources(): Observable<DataSource[]> {
    return this.http.post<DataSource[]>(`${this.apiUrl}/update-datasources`, { headers: this.getAuthHeaders() });
  }
}
