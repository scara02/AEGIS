import { Component, OnInit } from '@angular/core';
import { UserService } from '../services/user/user.service';
import { User } from '../models/user.model';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserFormComponent } from './user-form/user-form.component';
import { UserPasswordModalComponent } from './user-password-modal/user-password-modal.component';

interface FormFieldConfig {
  key: Exclude<keyof User, 'id'>;
  label: string;
  type: 'text' | 'select' | 'password';
  required: boolean;
  options?: string[];
}

@Component({
  selector: 'app-user',
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.css'],
  imports: [CommonModule, FormsModule, UserFormComponent, UserPasswordModalComponent],
  standalone: true
})
export class UserListComponent implements OnInit {
  users: User[] = [];
  columns: (keyof User)[] = ['id', 'username', 'role', 'full_name', 'email', 'avatar_type', 'avatar', 'avatar_color', 'initials'];
  currentUser: User = this.createEmptyUser();
  originalUser: User | null = null;
  editingUserId: number | null = null;
  passwordConfirm = '';
  showPasswordModal = false;

  formFields: FormFieldConfig[] = [
    { key: 'username', label: 'Username', type: 'text', required: true },
    { key: 'role', label: 'Role', type: 'select', required: true, options: ['user', 'admin'] },
    { key: 'email', label: 'Email', type: 'text', required: true },
    { key: 'full_name', label: 'Full Name', type: 'text', required: false }
  ];

  showUserForm = false;

  alertMessage = '';
  showAlert = false;
  alertType: 'success' | 'error' | null = null;

  searchQuery = '';
  searchTimer: any;
  isRefreshing = false;

  page = 1;
  limit = 10;
  total = 0;

  sortField: keyof User | null = 'username';
  sortDirection: 'asc' | 'desc' = 'asc';
  sortingEnabled: boolean = false;

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  private createEmptyUser(): User {
    return {
      id: 0,
      username: '',
      role: 'user',
      full_name: '',
      email: '',
      avatar_type: '',
      avatar: '',
      avatar_color: '',
      initials: ''
    };
  }

  fetchUsers(): void {
    this.isRefreshing = true;
    this.userService.getUsers(
      this.searchQuery, this.page, this.limit,
      this.sortField, this.sortDirection
    ).subscribe({
      next: (response) => {
        this.users = response.data;
        this.total = response.total;
        this.isRefreshing = false;
      },
      error: (err) => {
        this.showError('Failed to load users');
        this.isRefreshing = false;
      }
    });
  }

  loadUsers(): void {
    this.fetchUsers();
  }

  onSearchInput(): void {
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => {
      this.onSearch();
    }, 500);
  }

  onSearch(): void {
    this.page = 1;
    this.fetchUsers();
  }

  // sort things
  setSort(field: keyof User): void {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'asc';
    }
    this.page = 1;
    this.fetchUsers();
  }

  toggleSorting(): void {
    this.sortingEnabled = !this.sortingEnabled;
    if (!this.sortingEnabled) {
      this.sortField = null;
      this.sortDirection = 'asc';
      this.page = 1;
      this.fetchUsers();
    }
  }

  // user creation popover
  toggleUserForm(): void {
    this.showUserForm = !this.showUserForm;
  }

  saveNewUser(newUser: Omit<User, 'id'>): void {
    this.userService.addUser(newUser).subscribe({
      next: () => {
        this.loadUsers();
        this.showUserForm = false;
        this.showSuccess('User created successfully');
      },
      error: (err) => this.showError('Failed to create user')
    });
  }

  cancelAdd(): void {
    this.showUserForm = false;
  }

  //edit user functions
  startEdit(user: User): void {
    this.editingUserId = user.id;
    this.currentUser = { ...user };
    this.originalUser = { ...user };
  }

  cancelEdit(): void {
    this.editingUserId = null;
    this.currentUser = this.createEmptyUser();
    this.originalUser = null;
  }

  saveUser(): void {
    if (this.editingUserId && this.originalUser) {
      const originalUser = this.users.find(user => user.id === this.editingUserId);
      if (!originalUser) {
        this.showError('User not found');
        return;
      }

      const updatedUser: User = {
        ...originalUser,
        ...this.currentUser,
        id: this.editingUserId
      };

      this.userService.updateUser(this.editingUserId, updatedUser).subscribe({
        next: () => {
          const index = this.users.findIndex(user => user.id === this.editingUserId);
          if (index !== -1) {
            this.users[index] = updatedUser;
          }
          this.showSuccess('User updated successfully');
          this.cancelEdit();
        },
        error: (err) => {
          this.showError('Failed to update user');
          console.error('Update failed:', err);
        }
      });
    } else {
      this.showError('No user data to update');
    }
  }

  startPasswordChange(user: User): void {
    this.currentUser = { ...user };
    this.showPasswordModal = true;
  }

  onPasswordUpdated(): void {
    this.showPasswordModal = false;
    this.currentUser = this.createEmptyUser();
    this.showSuccess('Password updated successfully');
  }

  // delete user
  confirmDelete(user: User): void {
    if (confirm(`Delete user ${user.username}?`)) {
      this.userService.deleteUser(user.id).subscribe({
        next: () => {
          this.loadUsers();
          this.showSuccess('User deleted successfully');
        },
        error: (err) => this.showError('Failed to delete user')
      });
    }
  }

  isEditable(col: keyof User): boolean {
    return this.formFields.some(f => f.key === col);
  }

  onPageChange(newPage: number): void {
    if (newPage < 1) return;
    this.page = newPage;
    this.fetchUsers();
  }

  onLimitChange(newLimit: number): void {
    this.limit = newLimit;
    this.page = 1;
    this.fetchUsers();
  }

  private showSuccess(message: string): void {
    this.alertMessage = message;
    this.alertType = 'success';
    this.showAlert = true;
    setTimeout(() => this.showAlert = false, 3000);
  }

  private showError(message: string): void {
    this.alertMessage = message;
    this.alertType = 'error';
    this.showAlert = true;
    setTimeout(() => this.showAlert = false, 3000);
  }
}
