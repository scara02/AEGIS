import {Component, OnInit} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {CommonModule} from '@angular/common';
import {LogFieldsComponent} from './log-fields/log-fields.component';
import { FormsModule } from '@angular/forms';
import {JsonPrettyPipe} from './pipe-row/json-pretty.pipe';
import { LogService } from '../services/log-calls/log.service';
import {FilterPopoverComponent} from './log-filter/filter-popover/filter-popover.component';
import {NgbPopoverModule, NgbTooltipModule} from '@ng-bootstrap/ng-bootstrap';
import {TimeFilterComponent} from './log-filter/time-filter/time-filter.component';

interface LogEntry {
  [key: string]: any;
  isExpanded: boolean;
}

interface Operator {
  name: string;
  value: string;
}

@Component({
  selector: 'app-log-explorer',
  templateUrl: './log-explorer.component.html',
  styleUrls: ['./log-explorer.component.css'],
  standalone: true,
  imports: [CommonModule, LogFieldsComponent,
    FormsModule, JsonPrettyPipe, NgbTooltipModule,
    FilterPopoverComponent, NgbPopoverModule, TimeFilterComponent ],
})

export class LogExplorerComponent implements OnInit {
  logs: LogEntry[] = [];
  selectedFields: string[] = ['timestamp', 'message']; // default
  fields: string[] = [];
  measurements: string[] = [];
  selectedMeasurement: string = 'log.hdfs'; // default

  limit = 10; // default log rows per page
  page = 1;

  activeTab: 'table' | 'json' = 'table'

  fixedTimeFilter: any = null;
  removableFilters: any[] = [];
  operators: Operator[] = [];

  searchQuery = '';
  searchTimer: any;

  sortField: string | null = 'timestamp';
  sortDirection: 'asc' | 'desc' = 'desc';

  isRefreshing = false;

  constructor(private logService: LogService) {
  }

  ngOnInit(): void {
    this.setInitialTimeFilter();
    this.fetchMeasurements();
    this.fetchLogs();
  }

  onFieldsLoaded(fields: string[]): void {
    this.fields = fields;
  }

  onOperatorsLoaded(operators: Operator[]): void {
    this.operators = operators;
  }

  fetchLogs(): void {
    this.isRefreshing = true;

    const allFilters = [
      ...(this.fixedTimeFilter ? [this.fixedTimeFilter] : []),
      ...this.removableFilters
    ];

    this.logService.getLogs(
      this.limit,
      this.page,
      this.selectedMeasurement,
      allFilters,
      this.searchQuery,
      this.sortField,
      this.sortDirection
    ).subscribe({
      next: response => {
        this.logs = response.data.map(log => ({
          ...log,
          isExpanded: false
        }));
        this.isRefreshing = false;
      },
      error: err => console.error('Error fetching logs:', err)
    });
  }

  fetchMeasurements(): void {
    this.logService.getMeasurements()
      .subscribe({
        next: (response) => {
          this.measurements = response;
          if (!this.selectedMeasurement && response.length > 0) {
            this.selectedMeasurement = response[0];
          }
        },
        error: err => console.error('Error fetching measurements:', err)
      });
  }

  onMeasurementChange(): void {
    this.page = 1;
    this.fetchLogs();
  }

  onFieldsChange(fields: string[]): void {
    this.selectedFields = fields;
    this.page = 1; // reset page
    this.fetchLogs();
  }

  onPageChange(newPage: number): void {
    if (newPage < 1) return;
    this.page = newPage;
    this.fetchLogs();
  }

  onLimitChange(newLimit: number): void {
    this.limit = newLimit;
    this.page = 1;
    this.fetchLogs();
  }

  toggleExpanded(index: number): void {
    this.logs[index].isExpanded = !this.logs[index].isExpanded;
  }

  getLogKeys(log: LogEntry): string[] {
    const excludedFields = ['result', 'table', '_time', '_start', '_stop', '_measurement', 'isExpanded'];
    return Object.keys(log).filter(
      key => !excludedFields.includes(key) && log[key] !== null && log[key] !== undefined
    );
  }

  onFilterAdded(filter: any): void {
    this.removableFilters.push(filter);
    this.page = 1;
    this.fetchLogs();
  }

  getOperatorName(operatorValue: string): string {
    const operator = this.operators.find((op: Operator) => op.value === operatorValue);
    return operator ? operator.name : operatorValue;
  }

  isRangeOperator(operator: string): boolean {
    return ['between', 'nbetween'].includes(operator);
  }

  formatValue(filter: any): string {
    if (filter.operator === 'exists' || filter.operator === 'nexists') return '';
    return Array.isArray(filter.value) ? filter.value.join(', ') : filter.value;
  }

  removeFilter(index: number): void {
    this.removableFilters.splice(index, 1);
    this.page = 1;
    this.fetchLogs();
  }

  clearAllFilters(): void {
    this.removableFilters = [];
    this.page = 1;
    this.fetchLogs();
  }

  onSearch(): void {
    this.page = 1;
    this.fetchLogs();
  }

  onSearchInput(): void {
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => {
      this.onSearch();
    }, 500);
  }

  onTimeRangeSelected(range: { start: string; end: string }) {
    this.fixedTimeFilter = {
      field: 'timestamp',
      operator: 'between',
      valueFrom: range.start,
      valueTo: range.end
    };

    this.page = 1;
    this.fetchLogs();
  }

  private setInitialTimeFilter(): void {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 30);

    this.fixedTimeFilter = {
      field: 'timestamp',
      operator: 'between',
      valueFrom: start.toISOString(),
      valueTo: end.toISOString()
    };
  }

  getFilterTooltip(filter: any): string {
    if (filter.field === 'timestamp' && filter.operator === 'between') {
      const start = new Date(filter.valueFrom).toLocaleString();
      const end = new Date(filter.valueTo).toLocaleString();
      return `${filter.field} is between ${start} and ${end}`;
    }

    if (this.isRangeOperator(filter.operator)) {
      return `${filter.field} ${this.getOperatorName(filter.operator)} ${filter.valueFrom} to ${filter.valueTo}`;
    }

    return `${filter.field} ${this.getOperatorName(filter.operator)} ${filter.value || ''}`;
  }

  setSort(field: string): void {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'desc';
    }
    this.fetchLogs();
  }
}
