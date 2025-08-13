import { HttpInterceptorFn,  HttpErrorResponse, HttpRequest, HttpHandlerFn, HttpBackend, HttpClient} from '@angular/common/http';
import { inject } from '@angular/core';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, filter, switchMap, take, tap } from 'rxjs';
import { Router } from '@angular/router';
const API_BASE = 'http://localhost:3000'; // or environment.apiBase

let isRefreshing = false;
const refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);


export const tokenInterceptor: HttpInterceptorFn = (req, next) => {
  const http = inject(HttpClient);
  const router = inject(Router);
  if (req.url.includes('/auth/refresh')) {
    return next(req);
  }
  function refreshCall(): Observable<any> {
    if(isRefreshing) {
      return refreshTokenSubject.pipe(
        filter(token => token != null),
        take(1),
        switchMap(() => next(req))
      );
    } else {
      isRefreshing = true;
      refreshTokenSubject.next(null);
      // console.log("Refreshing token");
      return http.post(`${API_BASE}/auth/refresh`, {}, { withCredentials: true }).pipe(
        tap((response: any) => {
          // console.log('Token refreshed:', response);
          isRefreshing = false;
          refreshTokenSubject.next(response);
        }),
        catchError((error) => {
          // console.error('Error refreshing token:', error);
          isRefreshing = false;
          refreshTokenSubject.next(null);
          router.navigate(['auth/login']);
          return throwError(() => error);
        })
      );
    }
  }
  return next(req).pipe(
    catchError((error) => {
      if (error instanceof HttpErrorResponse && error.status === 401) {
        // console.log("Token expired");
        return refreshCall().pipe(
          switchMap(() => {
            return next(req);
          }),
          catchError((refreshError) => {
            // console.log("Refresh failed", refreshError);
            return throwError(() => refreshError);
          })
        );
      }
      return throwError(() => error);
    })
  );
};
