import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LanguageService {
  private baseUrl = 'http://localhost:3000';

  constructor(private http: HttpClient) { }

  getLanguages(): Observable<any> {
    return this.http.get(`${this.baseUrl}/languages?status=1`);
  }
}
