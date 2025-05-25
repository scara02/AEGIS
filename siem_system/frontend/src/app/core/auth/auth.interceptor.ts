import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const accessToken = localStorage.getItem('access_token');

  if (accessToken && isTokenExpired(accessToken)) {
    console.warn('Token expired! Logging out...');
    localStorage.removeItem('access_token');
    router.navigate(['/login']);
    return throwError(() => new Error('Token expired'));
  }

  const authReq = accessToken
    ? req.clone({ setHeaders: { Authorization: `Bearer ${accessToken}` } })
    : req;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        console.warn('Unauthorized! Redirecting to login...');
        localStorage.removeItem('access_token');
        router.navigate(['/login']);
      }
      return throwError(() => error);
    })
  );
};

function isTokenExpired(token: string): boolean {
  const exp = getTokenExpiration(token);
  return exp !== null && Date.now() >= exp;
}

function getTokenExpiration(token: string): number | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp ? payload.exp * 1000 : null;
  } catch (error) {
    return null;
  }
}
