import {Component, OnInit, Input, Output, EventEmitter, OnChanges, SimpleChanges} from '@angular/core';
import { CommonModule } from '@angular/common';
import { LogService } from '../../services/log-calls/log.service';

@Component({
  selector: 'app-log-fields',
  templateUrl: './log-fields.component.html',
  styleUrls: ['./log-fields.component.css'],
  standalone: true,
  imports: [CommonModule],
})
export class LogFieldsComponent implements OnInit, OnChanges {
  public readonly mandatoryFields = ['timestamp'];
  @Input() selectedFields: string[] = [...this.mandatoryFields, 'message']; // default fields
  @Output() selectedFieldsChange = new EventEmitter<string[]>();

  @Input() selectedMeasurement!: string;
  @Output() fieldsLoaded = new EventEmitter<string[]>();

  fields: string[] = [];
  //fields: string[] = ["user_id", "timestamp", "event_type", "source_ip", "destination_ip", "status_code", "user_agent", "http_method", "request_url", "response_time", "error_message", "session_id", "file_path", "query_string", "referrer_url"];

  filteredFields: string[] = [];
  searchTerm: string = '';
  loading: boolean = true;

  constructor(private logService: LogService) {
  }

  ngOnInit(): void {
    this.fetchFields();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selectedMeasurement'] && !changes['selectedMeasurement'].firstChange) {
      this.fetchFields();
    }
  }

  fetchFields(): void {
    this.loading = true;
    this.logService.getFields(this.selectedMeasurement).subscribe({
      next: (data) => {
        this.fields = data;
        this.fieldsLoaded.emit(this.fields);
        this.updateFilteredFields();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error fetching fields:', err);
        this.loading = false;
      },
    });
  }

  addField(field: string): void {
    if (!this.selectedFields.includes(field)) {
      this.selectedFields.push(field);
      this.selectedFieldsChange.emit(this.selectedFields);
      this.updateFilteredFields();
    }
  }

  removeField(field: string): void {
    if (this.mandatoryFields.includes(field)) return;

    this.selectedFields = this.selectedFields.filter((f) => f !== field);
    this.selectedFieldsChange.emit(this.selectedFields);
    this.updateFilteredFields();
  }

  onSearchChange(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    this.searchTerm = inputElement.value.toLowerCase();
    this.updateFilteredFields();
  }

  private updateFilteredFields(): void {
    this.filteredFields = this.fields
      .filter(field =>
        !this.selectedFields.includes(field) &&
        !this.mandatoryFields.includes(field)
      )
      .filter(field => field.toLowerCase().includes(this.searchTerm));
  }
}
