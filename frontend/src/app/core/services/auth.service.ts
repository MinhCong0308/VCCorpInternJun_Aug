import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import {
  catchError,
  map,
  Observable,
  throwError,
  of,
  tap,
  shareReplay,
  timer,
  switchMap,
  timeout,
} from 'rxjs';
import { isPlatformBrowser } from '@angular/common';
import { Sign } from 'crypto';

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
interface AdminLogInData {
  user: User;
  accessToken: string;
  refreshToken: string;
}
interface AdminLogInWrapper {
  success: boolean;
  data: AdminLogInData;
  status: number;
  message: string;
}
interface SignUpInput {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}
interface SignUpWrapper {
  success: boolean;
  data: string;
  status: number;
  message: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private sessionCheck$: Observable<boolean> | null = null;
  private platformId = inject(PLATFORM_ID);

  constructor(private http: HttpClient) {}
  baseUrl = 'http://localhost:3000/auth';

  login(email: string, password: string): Observable<LogInWrapper> {
    const url = `${this.baseUrl}/login`;
    return this.http
      .post<LogInWrapper>(url, { email, password }, { withCredentials: true })
      .pipe(
        tap(() => {
          this.clearSessionCache();
          console.log('Login successful - cleared session cache');
        }),
        catchError((error) => {
          console.error('Login error:', error.message || error);
          if (error.status === 401) {
            return of({
              success: false,
              data: { userid: 0, email: '', username: '', role: '' },
              status: error.status,
              message: 'Username or password is not correct',
            });
          }
          return of({
            success: false,
            data: { userid: 0, email: '', username: '', role: '' },
            status: error.status,
            message: error.message || 'Login failed!',
          });
        })
      );
  }

  // Admin login hits /auth/admin/login and returns user + tokens (cookies are also set)
  adminLogin(email: string, password: string): Observable<AdminLogInWrapper> {
    const url = `${this.baseUrl}/admin/login`;
    return this.http
      .post<AdminLogInWrapper>(
        url,
        { email, password },
        { withCredentials: true }
      )
      .pipe(
        tap(() => {
          this.clearSessionCache();
          console.log('Admin login successful - cleared session cache');
        }),
        catchError((error) => {
          console.error('Admin login error:', error?.message || error);
          if (error.status === 401) {
            return of({
              success: false,
              data: {
                user: { userid: 0, email: '', username: '', role: '' },
                accessToken: '',
                refreshToken: '',
              },
              status: error.status,
              message: 'Username or password is not correct',
            });
          }
          return of({
            success: false,
            data: {
              user: { userid: 0, email: '', username: '', role: '' },
              accessToken: '',
              refreshToken: '',
            },
            status: error.status,
            message: error.message || 'Login failed!',
          });
        })
      );
  }

  checkSession(): Observable<boolean> {
    if (!isPlatformBrowser(this.platformId)) {
      console.log('AUTH SERVICE: Server-side - returning true');
      return of(true);
    }

    if (this.sessionCheck$) {
      console.log('AUTH SERVICE: Using cached session check');
      return this.sessionCheck$;
    }

    console.log('AUTH SERVICE: Making new session check request');

    this.sessionCheck$ = this.http
      .get<{ success: boolean }>(`${this.baseUrl}/me`, {
        withCredentials: true,
      })
      .pipe(
        // timeout(2000), // Very short timeout
        map((response) => {
          console.log(
            'AUTH SERVICE: Session check response:',
            response.success
          );
          return response.success;
        }),
        catchError((error) => {
          console.log(
            'AUTH SERVICE: Session check failed:',
            error.status,
            error.message
          );
          return of(false);
        }),
        shareReplay(1),
        tap((result) => {
          console.log(
            'AUTH SERVICE: Session check completed with result:',
            result
          );
          setTimeout(() => {
            console.log('AUTH SERVICE: Clearing session cache');
            this.sessionCheck$ = null;
          }, 200);
        })
      );
    return this.sessionCheck$;
  }
  private makeSessionRequest(attempt: number): Observable<boolean> {
    console.log(`Session check attempt ${attempt} - making HTTP request`);
    return this.http
      .get<{ success: boolean }>(`${this.baseUrl}/me`, {
        withCredentials: true,
      })
      .pipe(
        timeout(5000),
        map((response) => {
          console.log(
            `Session check attempt ${attempt} HTTP response:`,
            response
          );
          return response.success;
        }),
        catchError((error) => {
          console.log(
            `Session check attempt ${attempt} failed:`,
            error.name,
            error.status,
            error.message
          );
          const shouldRetry =
            attempt < 2 &&
            (error.name === 'TimeoutError' ||
              error.status === 0 ||
              error.code === 'NETWORK_ERROR' ||
              error.message?.toLowerCase().includes('timeout') ||
              error.message?.toLowerCase().includes('network'));

          if (shouldRetry) {
            console.log(
              `Will retry session check... (attempt ${attempt + 1}/2)`
            );
            return timer(600).pipe(
              switchMap(() => this.makeSessionRequest(attempt + 1))
            );
          }

          console.log(
            'Session check failed - no more retries, returning false'
          );
          return of(false);
        })
      );
  }

  clearSessionCache(): void {
    console.log('Manually clearing session cache');
    this.sessionCheck$ = null;
  }

  signup(formData: SignUpInput): Observable<SignUpWrapper> {
    const url = `${this.baseUrl}/signup`;
    // const headers = new HttpHeaders().set('skip-interceptor', 'true');
    return this.http
      .post<SignUpWrapper>(url, formData, { withCredentials: true })
      .pipe(
        tap(() => {
          this.clearSessionCache(); 
          console.log('Signup successful - cleared session cache');
        }),
        catchError((error) => {
          console.error('Signup error:', error);
          return of({
            success: false,
            data: '',
            status: error.status,
            message: error.message,
          });
        })
      );
  }

  logout(): Observable<void> {
    const url = `${this.baseUrl}/logout`;
    return this.http.post<void>(url, {}, { withCredentials: true }).pipe(
      tap(() => {
        this.clearSessionCache(); // ✅ Use the method
        console.log('Logout successful - cleared session cache');
      }),
      catchError((error) => {
        console.error('Logout error:', error);
        this.clearSessionCache(); // ✅ Use the method
        console.log('Logout failed - cleared session cache anyway');
        return throwError(() => new Error('Logout failed'));
      })
    );
  }
  verifyResetPassword(email: string): Observable<{success: boolean; message: string}> {
    console.log('Verifying reset password for email:', email);
    const url = `${this.baseUrl}/verify-reset-password`;
     return this.http
      .post<{success: boolean; message: string}>(url, {email: email}, { withCredentials: true })
      .pipe(
        tap(() => {
          this.clearSessionCache(); 
          console.log('Sent OTP for reset password - cleared session cache');
        }),
        catchError((error) => {
          console.error('Verify reset password error:', error);
          return of({
            success: false,
            message: error.message,
          });
        })
      );
  }
  resetPassword(email: string, newPassword: string, newPasswordConfirm: string): Observable<{success: boolean; message: string}> {
    const url = `${this.baseUrl}/reset-password`;
      return this.http.post<{success: boolean; message: string}>(url, {
        email: email,
        newPassword: newPassword,
        newPasswordConfirm: newPasswordConfirm
      }, { withCredentials: true });
  }
  // Fetch current session user via cookie-based auth
  me() {
    return this.http.get<{ success: boolean; data?: any }>(
      `${this.baseUrl}/me`,
      {
        withCredentials: true,
      }
    );
  }
}
