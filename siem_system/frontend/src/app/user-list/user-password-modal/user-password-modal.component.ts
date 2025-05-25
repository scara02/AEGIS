import {Component, EventEmitter, Input, Output} from '@angular/core';
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {UserService} from '../../services/user/user.service';
import {CommonModule} from '@angular/common';

@Component({
  selector: 'app-user-password-modal',
  imports: [ ReactiveFormsModule, FormsModule, CommonModule ],
  templateUrl: './user-password-modal.component.html',
  styleUrl: './user-password-modal.component.css',
  standalone: true
})
export class UserPasswordModalComponent {
  @Input() userId: number = -1;
  @Output() closed = new EventEmitter<void>();
  @Output() passwordUpdated = new EventEmitter<void>();

  passwordForm: FormGroup;
  errorMessage: string | null = null;
  isLoading = false;

  get passwordsMatch(): boolean {
    return this.passwordForm.get('newPassword')?.value ===
           this.passwordForm.get('confirmPassword')?.value;
  }

  constructor(
    private fb: FormBuilder,
    private userService: UserService
  ) {
    this.passwordForm = this.fb.group({
      newPassword: ['', [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/)
      ]],
      confirmPassword: ['', Validators.required]
    }, {validators: this.passwordMatchValidator});
  }

  private passwordMatchValidator(form: FormGroup) {
    const newPassword = form.get('newPassword')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;
    return newPassword === confirmPassword ? null : {mismatch: true};
  }
  onSubmit() {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;

    const {newPassword, confirmPassword} = this.passwordForm.value;

    this.userService.updateUserPassword(this.userId, newPassword)
      .subscribe({
        next: () => {
          this.passwordUpdated.emit();
          this.close();
        },
        error: (err) => {
          this.errorMessage = this.parseErrorMessage(err);
          this.isLoading = false;
        }
      });
  }

  private parseErrorMessage(error: any): string {
    if (error.message) {
      return error.message;
    }
    return 'Failed to update password - please try again later';
  }

  close() {
    this.closed.emit();
    this.passwordForm.reset();
    this.isLoading = false;
  }
}
