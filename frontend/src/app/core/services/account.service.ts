import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AccountService {
  private baseUrl = 'http://localhost:3000';

  constructor(
    private http: HttpClient,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) { }

  getProfile(): Observable<any> {
    // Don't make the API call on server side
    if (!isPlatformBrowser(this.platformId)) {
      return new Observable(observer => {
        // Just complete the observable without emitting any value
        observer.complete();
      });
    }

    // We're in browser environment now
    const token = localStorage.getItem('accessToken') || '';
    if (!token) {
      this.router.navigate(['/login']);
      return throwError(() => new Error('No token available'));
    }

    return this.http.get(`${this.baseUrl}/account/profile`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }).pipe(
      catchError(error => {
        if (error.status === 401) {
          this.router.navigate(['/login']);
        }
        return throwError(() => error);
      })
    );
  }
}
