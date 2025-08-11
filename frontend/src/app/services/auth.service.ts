import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, map, Observable, throwError, of, tap } from 'rxjs';
import { response } from 'express';

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
  constructor(private http: HttpClient) { }
  baseUrl = "http://localhost:3000/auth";

  login(email: string, password: string): Observable<LogInWrapper> {
    const url = `${this.baseUrl}/login`;
    return this.http.post<LogInWrapper>(url, { email, password }, {withCredentials: true}).pipe(
      catchError((error) => {
        console.error('Login error:', error);
        return of({ success: false, data: { userid: 0, email: '', username: '', role: '' }, status: error.status, message: error.message });
      })
    );
  }
  checkSession(): Observable<boolean> {
    return this.http.get<{ success: boolean }>(`${this.baseUrl}/me`, {withCredentials: true}).pipe(
      map((response) => {
        return response.success;
      }),
      catchError(() => of(false))
    );
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
