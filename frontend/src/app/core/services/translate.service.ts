import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
// using variable stored in .env

@Injectable({
  providedIn: 'root'
})
export class TranslateService {
  private apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
  private apiKey: string = 'xxxxxxxxx';
  constructor(private http: HttpClient) { }
  translate(text: string, sourceLanguage: string, targetLanguage: string): Observable<any> {
    const prompt = sourceLanguage === 'auto' ? `Translate the following text to ${targetLanguage}: ${text}. Just the translation, no explanations.` : `Translate the following text from ${sourceLanguage} to ${targetLanguage}: ${text}. Just the translation, no explanations.`;
    const payload = {
      contents: [
        {
          parts: [
            {text: prompt}
          ]
        }
      ]
    };
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'X-goog-api-key': this.apiKey
    });
    return this.http.post(this.apiUrl, payload, {headers});
  }
}
