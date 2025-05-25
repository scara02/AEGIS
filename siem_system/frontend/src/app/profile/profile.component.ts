import {Component, OnInit} from '@angular/core';
import { UserService } from '../services/user/user.service';
import {FormsModule} from '@angular/forms';
import { User } from '../models/user.model';
import {CommonModule} from '@angular/common';
import {PasswordModalComponent} from './password-modal/password-modal.component';

@Component({
  selector: 'app-profile',
  imports: [ FormsModule, CommonModule, PasswordModalComponent ],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css'],
  standalone: true
})
export class ProfileComponent implements OnInit {
  user: Partial<User> & {
    username?: string;
    full_name?: string;
    email?: string;
    initials?: string;
    avatar_color?: string;
    avatar?: string;
    avatar_type?: string
  } = {
    username: '',
    full_name: '',
    email: '',
    initials: '',
    avatar_color: '',
    avatar_type: ''
  };

  originalUser: Partial<User> = {};
  hasChanges = false;

  avatarType: string | undefined = '';
  private previousAvatarType = this.avatarType;
  textColor = '#ffffff';

  showPasswordModal = false;

  showSuccessMessage = false;
  successMessage = '';

  constructor(private userService: UserService) {
  }

  ngOnInit(): void {
    this.loadUser();
  }

  loadUser(): void {
    this.userService.getCurrentUser().subscribe({
      next: (user) => {
        this.originalUser = {...user};
        this.user = user;
        this.updateTextColor();
        this.hasChanges = false;
        this.avatarType = user.avatar_type;
      },
      error: (err) => console.error('Failed to load user:', err)
    });
  }

  checkForChanges(): void {
    const normalize = (value: any) => value === null || value === undefined ? '' : value;
    const typeChanged = this.avatarType !== this.previousAvatarType;

    this.hasChanges = (
      normalize(this.user.full_name) !== normalize(this.originalUser.full_name) ||
      normalize(this.user.email) !== normalize(this.originalUser.email) ||
      typeChanged ||
      (this.avatarType === 'image' && normalize(this.user.avatar) !== normalize(this.originalUser.avatar)) ||
      (this.avatarType === 'initials' && (
        normalize(this.user.initials) !== normalize(this.originalUser.initials) ||
        normalize(this.user.avatar_color) !== normalize(this.originalUser.avatar_color)
      ))
    );
  }

  randomizeColor(): void {
    const randomColor = '#' + Math.floor(Math.random() * 16777215).toString(16);
    this.user.avatar_color = randomColor;
    this.updateTextColor();
    this.checkForChanges();
  }

  updateTextColor(): void {
    const hexColor = this.user?.avatar_color || '#4B49AC';
    const hex = hexColor.replace('#', '');

    const validHex = hex.padEnd(6, '0').substr(0, 6);
    const r = parseInt(validHex.substr(0, 2), 16);
    const g = parseInt(validHex.substr(2, 2), 16);
    const b = parseInt(validHex.substr(4, 2), 16);

    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    this.textColor = brightness > 128 ? '#000000' : '#ffffff';
  }

  handleFileInput(event: any): void {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.user.avatar = e.target.result;
        this.checkForChanges();
      };
      reader.readAsDataURL(file);
    }
  }

  updateProfile(): void {
    const updateData = {
      full_name: this.user.full_name,
      email: this.user.email,
      avatar: this.user.avatar,
      avatar_color: this.user.avatar_color,
      initials: this.user.initials,
      avatar_type: this.avatarType
    };

    this.userService.updateCurrentUser(updateData).subscribe({
      next: (updatedUser) => {
        this.user = updatedUser;
        this.originalUser = {...updatedUser};
        this.hasChanges = false;

        this.successMessage = 'Changes saved successfully!';
        this.showSuccessMessage = true;
        setTimeout(() => this.showSuccessMessage = false, 3000);
      },
      error: (err) => console.error('Update failed:', err)
    });
    this.previousAvatarType = this.avatarType;
  }

  updateInitials() {
    if (this.user) {
      const rawValue = this.user.initials || '';
      this.user.initials = rawValue
        .toUpperCase()
        .replace(/[^A-Z]/g, '')
        .slice(0, 2);
    }
  }

  onPasswordUpdated() {
    this.showPasswordModal = false;

    this.successMessage = 'Password updated successfully!';
    this.showSuccessMessage = true;
    setTimeout(() => this.showSuccessMessage = false, 3000);
  }
}
