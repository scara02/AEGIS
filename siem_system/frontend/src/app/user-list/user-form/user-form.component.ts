import { Component, EventEmitter, Output, ViewEncapsulation } from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormBuilder, Validators, ValidationErrors } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NgSelectModule } from '@ng-select/ng-select';
import { User } from '../../models/user.model';

interface FormFieldConfig {
  key: Exclude<keyof User, 'id'>;
  label: string;
  type: 'text' | 'select' | 'password';
  required: boolean;
  options?: string[];
}

@Component({
  selector: 'app-user-form',
  templateUrl: './user-form.component.html',
  styleUrls: ['./user-form.component.css'],
  imports: [CommonModule, ReactiveFormsModule, NgSelectModule],
  standalone: true,
  encapsulation: ViewEncapsulation.None
})
export class UserFormComponent {
  userForm: FormGroup;
  errorMessage = '';

  formFields: FormFieldConfig[] = [
    { key: 'username', label: 'Username', type: 'text', required: true },
    { key: 'role', label: 'Role', type: 'select', required: true, options: ['user', 'admin'] },
    { key: 'email', label: 'Email', type: 'text', required: false },
    { key: 'full_name', label: 'Full Name', type: 'text', required: false },
    { key: 'password', label: 'Password', type: 'password', required: true }
  ];

  @Output() save = new EventEmitter<Omit<User, 'id'>>();
  @Output() cancel = new EventEmitter<void>();

  constructor(private fb: FormBuilder) {
    this.userForm = this.fb.group({
      username: ['', Validators.required],
      role: ['', Validators.required],
      email: [''],
      full_name: [''],
      password: ['', Validators.required],
      passwordConfirm: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(form: FormGroup): ValidationErrors | null {
    const password = form.get('password')?.value;
    const passwordConfirm = form.get('passwordConfirm')?.value;
    return password === passwordConfirm ? null : { mismatch: true };
  }

  onSave(): void {
    if (this.userForm.invalid) {
      this.errorMessage = 'Please fill out all required fields';
      this.userForm.markAllAsTouched();
      return;
    }
    this.errorMessage = '';
    const formValue = this.userForm.value;
    const newUser: Omit<User, 'id'> = {
      username: formValue.username,
      role: formValue.role,
      email: formValue.email,
      full_name: formValue.full_name,
      password: formValue.password
    };
    this.save.emit(newUser);
  }

  onCancel(): void {
    this.cancel.emit();
  }

  getErrorMessage(field: FormFieldConfig | { key: string; label: string }): string {
    const control = this.userForm.get(field.key);
    if (control?.touched && control?.invalid) {
      if (control.errors?.['required']) {
        return `${field.label} is required`;
      }
    }
    if (field.key === 'passwordConfirm' && this.userForm.errors?.['mismatch'] && control?.touched) {
      return 'Passwords do not match';
    }
    return '';
  }
}
