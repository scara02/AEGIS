import { Routes } from '@angular/router';
import { LogExplorerComponent } from './log-explorer/log-explorer.component';
import {LoginComponent} from './login/login.component';
import {authGuard} from './guards/auth/auth.guard';
import {DataSourcesComponent} from './data-sources/data-sources.component';
import {UserListComponent} from './user-list/user-list.component';
import {ProfileComponent} from './profile/profile.component';
import {adminGuard} from './guards/admin/admin.guard';
import {AlertsComponent} from './alerts/alerts.component';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'logs', component: LogExplorerComponent, canActivate: [authGuard] },
  { path: 'datasources', component: DataSourcesComponent, canActivate: [authGuard] },
  { path: 'users', component: UserListComponent, canActivate: [authGuard, adminGuard] },
  { path: 'profile', component: ProfileComponent, canActivate: [authGuard] },
  { path: 'alerts', component: AlertsComponent, canActivate: [authGuard] }
];
