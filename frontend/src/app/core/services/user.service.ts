import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';

export interface AdminUser {
  userid: number;
  firstname: string;
  lastname: string;
  username: string;
  email: string;
  avatar: string;
  status: number;
  roleid: number;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  status: number;
  message: string;
}

export interface PaginatedUserResponse {
  user: AdminUser[];
  total: number;
  page: number;
  totalPages: number;
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private baseUrl = 'http://localhost:3000';
  private readonly ITEMS_PER_PAGE = 5;

  constructor(private http: HttpClient) {}

  getAllUsers(
    keyword = '',
    page = 1,
    status: '' | number = ''
  ): Observable<PaginatedUserResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', this.ITEMS_PER_PAGE.toString());
    if (keyword && keyword.trim())
      params = params.set('search', keyword.trim());
    if (status !== '' && status !== undefined && status !== null) {
      params = params.set('status', String(status));
    }
    return this.http
      .get<ApiResponse<PaginatedUserResponse>>(`${this.baseUrl}/users`, {
        withCredentials: true,
        params,
      })
      .pipe(map((res) => res.data));
  }

  disableUser(id: number): Observable<{ message: string }> {
    return this.http
      .put<ApiResponse<{ message: string }>>(
        `${this.baseUrl}/users/${id}/disable`,
        {},
        { withCredentials: true }
      )
      .pipe(map((res) => res.data));
  }

  enableUser(id: number): Observable<{ message: string }> {
    return this.http
      .put<ApiResponse<{ message: string }>>(
        `${this.baseUrl}/users/${id}/enable`,
        {},
        { withCredentials: true }
      )
      .pipe(map((res) => res.data));
  }

  changeUserRole(id: number, roleid: number): Observable<AdminUser> {
    return this.http
      .put<ApiResponse<AdminUser>>(
        `${this.baseUrl}/users/${id}/change-role`,
        { roleid },
        { withCredentials: true }
      )
      .pipe(map((res) => res.data));
  }

  createUser(payload: {
    firstname: string;
    lastname: string;
    username: string;
    email: string;
    password: string; // mapped to hashed_password server-side
    roleid: number;
    status?: number; // optional, default ACTIVE (1)
    avatar: File;
  }): Observable<AdminUser> {
    const form = new FormData();
    form.append('firstname', payload.firstname);
    form.append('lastname', payload.lastname);
    form.append('username', payload.username);
    form.append('email', payload.email);
    form.append('hashed_password', payload.password);
    form.append('roleid', String(payload.roleid));
    form.append('status', String(payload.status ?? 1));
    form.append('avatar', payload.avatar);

    return this.http
      .post<ApiResponse<AdminUser>>(`${this.baseUrl}/users`, form, {
        withCredentials: true,
      })
      .pipe(map((res) => res.data));
  }
}
