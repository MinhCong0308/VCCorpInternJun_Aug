import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';


export interface UserProfile {
  email: string;
  username: string;
  fullname: string;
  avatarUrl: string;
  bio: string;
}
@Injectable({
  providedIn: 'root'
})
export class ProfileService {

  constructor(private http: HttpClient) { }
  getUserProfile(): Observable<UserProfile> {
    return this.http.get<{ data: UserProfile }>('http://localhost:3000/account/profile', { withCredentials: true }).pipe(
      map(response => response.data)
    );
  }
  updateUsername(username: string) {
    return this.http.put<{ data: any }>(
      'http://localhost:3000/account/update-username',
      { username },
      { withCredentials: true }
    );
  }

  updateFullname(fullname: string) {
    return this.http.put<{ data: any }>(
      'http://localhost:3000/account/update-fullname',
      { fullname },
      { withCredentials: true }
    );
  }

  updateAvatar(avatarFile: File): Observable<{avatarUrl: string}> {
    const formData = new FormData();
    formData.append('avatar', avatarFile);
    return this.http.put<{data: {avatarUrl: string}}>('http://localhost:3000/account/update-avatar', formData, { withCredentials: true }).pipe(
      map(response => ({avatarUrl: response.data.avatarUrl}))
    );
  }
  deactivateAccount(): Observable<void> {
    return this.http.put<void>('http://localhost:3000/account/deactivate-account', {}, { withCredentials: true });
  }
}
