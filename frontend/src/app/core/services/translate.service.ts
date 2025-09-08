import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
// using variable stored in .env

@Injectable({
  providedIn: 'root'
})
export class TranslatePostService {
  private baseUrl = "http://localhost:3000/post-owner/translate";
  constructor(private http: HttpClient) { }
  translate(text: string, sourceLanguage: string, targetLanguage: string): Observable<any> {
    return this.http.post<any>(this.baseUrl, { text: text, sourceLanguage: sourceLanguage, targetLanguage: targetLanguage }, {withCredentials: true});
  }
}
