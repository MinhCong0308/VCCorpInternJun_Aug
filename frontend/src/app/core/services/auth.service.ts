import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, map, Observable, throwError, of, tap, shareReplay, timer, switchMap, retryWhen, take, delay } from 'rxjs';

export interface User {
  userid: number;
  email: string;
  username: string;
  role: string;
}
interface LogInWrapper {
  success: boolean;
  data: User;
  status: number;
  message: string; 
}
interface SignUpInput {
  firstname: string;
  lastname: string;
  username: string;
  email: string;
  password: string;
  confirm_password: string;
}
interface SignUpWrapper {
  success: boolean;
  data: string;
  status: number;
  message: string; 
}

@Injectable({
  providedIn: 'root'
})

export class AuthService {
  private sessionCheck$: Observable<boolean> | null = null;
  constructor(private http: HttpClient) { }
  baseUrl = "http://localhost:3000/auth";

  login(email: string, password: string): Observable<LogInWrapper> {
    const url = `${this.baseUrl}/login`;
    return this.http.post<LogInWrapper>(url, { email, password }, {withCredentials: true}).pipe(
      tap(() => {
        this.sessionCheck$ = null; // Reset session check on login
      }),
      catchError((error) => {
        console.error('Login error:', error);
        return of({ success: false, data: { userid: 0, email: '', username: '', role: '' }, status: error.status, message: error.message });
      })
    );
  }
  checkSession(): Observable<boolean> {
    if(!this.sessionCheck$) {
      this.sessionCheck$ = timer(50).pipe( // ✅ Small initial delay
        switchMap(() => 
          this.http.get<{ success: boolean }>(`${this.baseUrl}/me`, {withCredentials: true})
        ),
        retryWhen(errors => 
          errors.pipe(
            take(2), // ✅ Retry up to 2 times
            delay(200), // ✅ Wait 200ms between retries
            tap(() => console.log('Retrying session check due to cookie timing...'))
          )
        ),
        map((response) => {
          console.log("Check session response:", response.success);
          return response.success;
        }),
        catchError((error) => {
          console.log("Check session error after retries:", error);
          return of(false);
        }),
        shareReplay(1),
        tap(() => {
          setTimeout(() => {
            this.sessionCheck$ = null;
          }, 500);
        })
      );
    }
    return this.sessionCheck$;
  }
  signup(formData: SignUpInput): Observable<SignUpWrapper> {
    const url = `${this.baseUrl}/signup`;
    return this.http.post<SignUpWrapper>(url, formData, {withCredentials: true}).pipe(
      catchError((error) => {
        console.error('Signup error:', error);
        return of({ success: false, data: '', status: error.status, message: error.message });
      })
    );
  }
  logout(): Observable<void> {
    const url = `${this.baseUrl}/logout`;
    return this.http.post<void>(url, {}, {withCredentials: true}).pipe(
      catchError((error) => {
        console.error('Logout error:', error);
        return throwError(() => new Error('Logout failed'));
      })
    );
  }
}
