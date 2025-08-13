import { HttpInterceptorFn,  HttpErrorResponse, HttpRequest, HttpHandlerFn, HttpBackend, HttpClient} from '@angular/common/http';
import { inject } from '@angular/core';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, filter, switchMap, take, tap } from 'rxjs';

const API_BASE = 'http://localhost:3000'; // or environment.apiBase

export const tokenInterceptor: HttpInterceptorFn = (req, next) => {
  const http = inject(HttpClient);
  function refreshCall(): Observable<any> {
    console.log("Refreshing token");
    return http.post(`${API_BASE}/auth/refresh`, {}, { withCredentials: true }).pipe(
      tap((response: any) => {
        // Handle the response, e.g., store the new token
        console.log('Token refreshed:', response);
      }),
      catchError((error) => {
        console.error('Error refreshing token:', error);
        return throwError(() => error);
      })
    );
  }
  
  return next(req).pipe(
    catchError((error) => {
      if (error instanceof HttpErrorResponse && error.status === 401) {
        console.log("Token expired");
        return refreshCall().pipe(
          switchMap(() => {
            console.log("Token refreshed");
            return next(req);
          }),
          catchError((refreshError) => {
            console.log("Refresh failed", refreshError);
            return throwError(() => refreshError);
          })
        );
      }
      return throwError(() => error);
    })
  );
};
