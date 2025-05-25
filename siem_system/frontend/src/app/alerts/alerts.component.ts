import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { AlertService } from '../services/alerts/alert.service';
import { Alert } from '../models/alert.model';
import { JsonPrettyPipe} from '../log-explorer/pipe-row/json-pretty.pipe';

@Component({
  selector: 'app-alerts',
  templateUrl: './alerts.component.html',
  styleUrls: ['./alerts.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, NgbModule, JsonPrettyPipe],
  providers: [AlertService],
  encapsulation: ViewEncapsulation.None,
})
export class AlertsComponent implements OnInit {
  alerts: Alert[] = [];
  columns: (keyof Alert)[] = ['id', 'event_ids', 'prediction', 'source', 'status', 'timestamp'];
  searchQuery = '';
  searchTimer: any;
  isRefreshing = false;
  page = 1;
  limit = 10;
  total = 0;
  sortField: keyof Alert | null = 'timestamp';
  sortDirection: 'asc' | 'desc' = 'desc';
  sortingEnabled = false;
  alertMessage = '';
  showAlert = false;
  alertType: 'success' | 'error' | null = null;
  activeTab: 'table' | 'json' = 'table';

  constructor(private alertService: AlertService) {}

  ngOnInit(): void {
    this.loadAlerts();
  }

  fetchAlerts(): void {
    this.isRefreshing = true;
    this.alertService
      .getAlerts(this.searchQuery, this.page, this.limit, this.sortField, this.sortDirection)
      .subscribe({
        next: (response) => {
          this.alerts = response.data;
          this.total = response.total;
          this.isRefreshing = false;
        },
        error: (err) => {
          this.showAlertMessage('Failed to load alerts', 'error');
          this.isRefreshing = false;
        },
      });
  }

  loadAlerts(): void {
    this.fetchAlerts();
  }

  onSearchInput(): void {
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => {
      this.onSearch();
    }, 500);
  }

  onSearch(): void {
    this.page = 1;
    this.fetchAlerts();
  }

  setSort(field: keyof Alert): void {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'desc';
    }
    this.page = 1;
    this.fetchAlerts();
  }

  toggleSorting(): void {
    this.sortingEnabled = !this.sortingEnabled;
    if (!this.sortingEnabled) {
      this.sortField = null;
      this.sortDirection = 'desc';
      this.page = 1;
      this.fetchAlerts();
    }
  }

  onPageChange(newPage: number): void {
    if (newPage < 1) return;
    this.page = newPage;
    this.fetchAlerts();
  }

  onLimitChange(newLimit: number): void {
    this.limit = newLimit;
    this.page = 1;
    this.fetchAlerts();
  }

  toggleExpanded(index: number): void {
    this.alerts[index].isExpanded = !this.alerts[index].isExpanded;
  }

  updateStatus(alert: Alert, status: string): void {
    this.alertService.updateAlertStatus(alert.id, status).subscribe({
      next: (updatedAlert) => {
        alert.status = updatedAlert.status;
        this.showAlertMessage(`Status updated to ${status}`, 'success');
      },
      error: (err) => {
        this.showAlertMessage('Failed to update status', 'error');
      },
    });
  }

  getAlertKeys(alert: Alert): (keyof Alert)[] {
    return Object.keys(alert).filter(
      (key): key is keyof Alert => key !== 'isExpanded' && alert[key as keyof Alert] !== null && alert[key as keyof Alert] !== undefined
    );
  }

  getJsonViewAlert(alert: Alert): any {
    return {
      ...alert,
      timestamp: alert.timestamp ? new Date(alert.timestamp).toISOString() : null,
    };
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
