import {
  HttpInterceptorFn,
  HttpErrorResponse,
  HttpRequest,
  HttpHandlerFn,
  HttpBackend,
  HttpClient,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, filter, switchMap, take, tap, finalize } from 'rxjs';
import { Router } from '@angular/router';
const API_BASE = 'http://localhost:3000';

let isRefreshing = false;
const refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(
  null
);

export const tokenInterceptor: HttpInterceptorFn = (req, next) => {
  const http = inject(HttpClient);
  const router = inject(Router);

  if (req.url.includes('/auth/refresh') || req.url.includes('/auth/login')) {
    return next(req);
  }

  function refreshCall(): Observable<any> {
    if (isRefreshing) {
      return refreshTokenSubject.pipe(
        filter((token) => token != null),
        take(1),
        switchMap(() => next(req))
      );
    } else {
      isRefreshing = true;
      refreshTokenSubject.next(null);
      return http
        .post(`${API_BASE}/auth/refresh`, {}, { withCredentials: true })
        .pipe(
          tap((response: any) => {
            isRefreshing = false;
            refreshTokenSubject.next(response);
          }),
          catchError((error) => {
            isRefreshing = false;
            refreshTokenSubject.next(null);
            // Clear any stored tokens and redirect to login
            if (error.status === 401) {
              // console.log('Refresh token expired, redirecting to login');
              // router.navigate(['/auth/login']);
            }
            return throwError(() => error);
          }),
          finalize(() => {
            isRefreshing = false;
          })
        );
    }
  }

  return next(req).pipe(
    catchError((error) => {
      if (error instanceof HttpErrorResponse && error.status === 401) {
        return refreshCall().pipe(
          switchMap(() => {
            return next(req);
          }),
          catchError((refreshError) => {
            if (refreshError.status === 401) {
              return throwError(() => new Error('Authentication required'));
            }
            return throwError(() => refreshError);
          })
        );
      }
      return throwError(() => error);
    })
  );
};
