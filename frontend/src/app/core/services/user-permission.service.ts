import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

export interface UserPermissions {
  can_write_post: boolean;
  can_like_post: boolean;
  can_write_comment: boolean;
  can_edit_comment: boolean;
}

@Injectable({ providedIn: 'root' })
export class UserPermissionService {
  private baseUrl = 'http://localhost:3000';

  constructor(private http: HttpClient) {}

  getUserPermissions(userid: number): Observable<UserPermissions> {
    return this.http
      .get<any>(`${this.baseUrl}/user-permissions/${userid}`, { withCredentials: true })
      .pipe(map((res) => res));
  }

  updateUserPermissions(userid: number, permissions: UserPermissions): Observable<UserPermissions> {
    return this.http
      .put<any>(`${this.baseUrl}/user-permissions/${userid}`, permissions, { withCredentials: true })
      .pipe(map((res) => res));
  }
}
