import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { DataSourceService } from '../services/data-sources/data-source.service';
import { DataSource } from '../models/data-source.model';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { AuthService } from '../core/auth/auth.service';
import { DsFormComponent } from './ds-form/ds-form.component';

@Component({
  selector: 'app-data-sources',
  templateUrl: './data-sources.component.html',
  styleUrls: ['./data-sources.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, NgbModule, DsFormComponent],
  providers: [DataSourceService],
  encapsulation: ViewEncapsulation.None
})
export class DataSourcesComponent implements OnInit {
  dataSources: DataSource[] = [];
  columns: (keyof DataSource)[] = ['name', 'ip', 'description', 'last_seen'];
  editingSourceId: number | null = null;
  editingData: Partial<DataSource> = {};
  showForm = false;
  alertMessage = '';
  showAlert = false;
  alertType: 'success' | 'error' | null = null;
  searchQuery = '';
  searchTimer: any;
  isRefreshing = false;
  page = 1;
  limit = 10;
  total = 0;

  sortField: keyof DataSource | null = 'last_seen';
  sortDirection: 'asc' | 'desc' = 'desc';
  sortingEnabled: boolean = false;

  constructor(
    private dataSourceService: DataSourceService,
    private authService: AuthService
  ) {}

  get isAdmin(): boolean {
    return this.authService.isAdmin;
  }
  ngOnInit(): void {
    this.updateDataSources();
    this.loadDataSources();
  }

  fetchDataSources(): void {
    this.isRefreshing = true;
    this.dataSourceService.getDataSources(this.searchQuery, this.page, this.limit, this.sortField, this.sortDirection).subscribe({
      next: (response) => {
        this.dataSources = response.data;
        this.total = response.total;
        this.isRefreshing = false;
      },
      error: (err) => {
        this.showAlertMessage('Failed to load data sources', 'error');
        this.isRefreshing = false;
      }
    });
  }

  loadDataSources(): void {
    this.fetchDataSources();
  }

  onSearchInput(): void {
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => {
      this.onSearch();
    }, 500);
  }

  onSearch(): void {
    this.page = 1;
    this.fetchDataSources();
  }

  setSort(field: keyof DataSource): void {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'desc';
    }
    this.page = 1;
    this.fetchDataSources();
  }

  toggleSorting(): void {
    this.sortingEnabled = !this.sortingEnabled;
    if (!this.sortingEnabled) {
      this.sortField = null;
      this.sortDirection = 'desc';
      this.page = 1;
      this.fetchDataSources();
    }
  }

  // ds creation popover
  toggleDsForm(): void {
    this.showForm = !this.showForm;
  }

  saveNewDs(newDataSource: Omit<DataSource, 'id' | 'last_seen'>): void {
    this.dataSourceService.addDataSource(newDataSource).subscribe({
      next: () => {
        this.loadDataSources();
        this.showForm = false;
        this.showAlertMessage('Data source created successfully!', 'success');
      },
      error: (err) => {
        this.showAlertMessage('Failed to create data source', 'error');
        console.error('Error creating data source:', err);
      }
    });
  }

  cancelAdd(): void {
    this.showForm = false;
  }

  updateDataSources(): void {
    this.dataSourceService.updateDataSources().subscribe({
      error: (err) => console.error('Error in updating data sources:', err)
    });
  }

  confirmDelete(source: DataSource): void {
    if (confirm(`Are you sure you want to delete ${source.name}?`)) {
      this.dataSourceService.deleteDataSource(source.id).subscribe({
        next: () => {
          this.loadDataSources();
          this.showAlertMessage('Data source deleted successfully!', 'success');
        },
        error: (err) => {
          this.showAlertMessage('Failed to delete data source', 'error');
          console.error('Error deleting data source:', err);
        }
      });
    }
  }

  startEdit(source: DataSource): void {
    this.editingSourceId = source.id;
    this.editingData = { ...source };
  }

  cancelEdit(): void {
    this.editingSourceId = null;
    this.editingData = {};
  }

  saveEdit(): void {
    if (this.editingSourceId) {
      const originalSource = this.dataSources.find(ds => ds.id === this.editingSourceId);
      if (!originalSource) return;

      const updatedSource: DataSource = {
        ...originalSource,
        ...this.editingData,
        id: this.editingSourceId
      };

      this.dataSourceService.updateDataSource(updatedSource).subscribe({
        next: () => {
          const index = this.dataSources.findIndex(ds => ds.id === this.editingSourceId);
          if (index !== -1) {
            this.dataSources[index] = updatedSource;
          }
          this.showAlertMessage('Data source updated successfully!', 'success');
          this.cancelEdit();
        },
        error: (err) => {
          this.showAlertMessage('Failed to update data source', 'error');
          console.error('Update failed:', err);
        }
      });
    }
  }

  // pagination
  onPageChange(newPage: number): void {
    if (newPage < 1) return;
    this.page = newPage;
    this.fetchDataSources();
  }

  onLimitChange(newLimit: number): void {
    this.limit = newLimit;
    this.page = 1;
    this.fetchDataSources();
  }

  private showAlertMessage(message: string, type: 'success' | 'error'): void {
    this.alertMessage = message;
    this.alertType = type;
    this.showAlert = true;
    setTimeout(() => {
      this.showAlert = false;
      this.alertType = null;
    }, 3000);
  }
}
