import { Component, Injectable, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { UserService } from '../services/user/user.service';
import { HealthService } from '../services/health/health.service';
import { User } from '../models/user.model';
import { Observable, interval } from 'rxjs';
import { switchMap } from 'rxjs/operators';

interface HealthStatus {
  influxdb: boolean;
  postgresql: boolean;
}

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
  standalone: true,
  imports: [CommonModule, RouterModule],
})
@Injectable({ providedIn: 'root' })
export class HeaderComponent implements OnInit {
  user?: User;
  textColor = '#ffffff';
  healthStatus: HealthStatus = { influxdb: false, postgresql: false };

  constructor(
    private router: Router,
    private userService: UserService,
    private healthService: HealthService
  ) {}

  ngOnInit(): void {
    this.loadUser();
    this.checkHealthStatus();
    interval(30000) // check health every 30 secs
      .pipe(switchMap(() => this.getHealthStatus()))
      .subscribe({
        next: (status) => (this.healthStatus = status),
        error: (err) => console.error('Health check failed:', err),
      });
  }

  loadUser(): void {
    this.userService.getCurrentUser().subscribe({
      next: (user) => {
        this.user = user;
        this.updateTextColor();
      },
      error: (err) => console.error('Failed to load user:', err),
    });
  }

  navigateToProfile(): void {
    this.router.navigate(['/profile']);
  }

  private getHealthStatus(): Observable<HealthStatus> {
    return this.healthService.getDbHealth();
  }

  private checkHealthStatus(): void {
    this.getHealthStatus().subscribe({
      next: (status) => (this.healthStatus = status),
      error: (err) => console.error('Initial health check failed:', err),
    });
  }

  private updateTextColor(): void {
    if (!this.user?.avatar_color) return;

    const hexColor = this.user.avatar_color.replace('#', '');
    const r = parseInt(hexColor.substr(0, 2), 16);
    const g = parseInt(hexColor.substr(2, 2), 16);
    const b = parseInt(hexColor.substr(4, 2), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    this.textColor = brightness > 128 ? '#000000' : '#ffffff';
  }
}
