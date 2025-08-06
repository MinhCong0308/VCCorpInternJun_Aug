import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AccountService {
  private baseUrl = 'http://localhost:3000';

  constructor(private http: HttpClient) { }

  getProfile(): Observable<any> {
    // Có thể làm thêm intercetor để tự động gắn token thay vì thêm thủ công cho mọi request
    const token = localStorage.getItem('accessToken') || '';
    return this.http.get(`${this.baseUrl}/account/profile`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
  }
}
