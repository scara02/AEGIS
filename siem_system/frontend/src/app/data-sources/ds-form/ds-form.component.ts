import { Component, EventEmitter, Output, ViewEncapsulation } from '@angular/core';
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import { CommonModule } from '@angular/common';
import {DataSource} from '../../models/data-source.model';

interface FormFieldConfig {
  key: Exclude<keyof DataSource, 'id' | 'last_seen'>;
  label: string;
  type: 'text' | 'select';
  required: boolean;
  options?: string[];
}

@Component({
  selector: 'app-ds-form',
  templateUrl: './ds-form.component.html',
  styleUrls: ['./ds-form.component.css'],
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  standalone: true,
  encapsulation: ViewEncapsulation.None
})
export class DsFormComponent {
  dsForm: FormGroup;
  errorMessage = '';

  formFields: FormFieldConfig[] = [
    { key: 'name', label: 'Name', type: 'text', required: true },
    { key: 'ip', label: 'IP Address', type: 'text', required: true },
    { key: 'description', label: 'Description', type: 'text', required: false }
  ];

  @Output() save = new EventEmitter<Omit<DataSource, 'id' | 'last_seen'>>();
  @Output() cancel = new EventEmitter<void>();

  constructor(private fb: FormBuilder) {
    this.dsForm = this.fb.group({
      name: ['', Validators.required],
      ip: ['', Validators.required],
      description: ['']
    });
  }
  onSave(): void {
    if (this.dsForm.invalid) {
      this.errorMessage = 'Please fill out all required fields';
      this.dsForm.markAllAsTouched();
      return;
    }
    this.errorMessage = '';
    const newDataSource: Omit<DataSource, 'id' | 'last_seen'> = this.dsForm.value;
    this.save.emit(newDataSource);
  }

  onCancel(): void {
    this.cancel.emit();
  }

  getErrorMessage(field: FormFieldConfig): string {
    const control = this.dsForm.get(field.key);
    if (control?.touched && control?.invalid) {
      if (control.errors?.['required']) {
        return `${field.label} is required`;
      }
    }
    return '';
  }
}
