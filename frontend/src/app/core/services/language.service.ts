import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';

export interface Language {
  languageid: number;
  languagename: string;
  locale_code: string;
  is_default: boolean;
  flag_image: string;
  status: number;
  createdAt: string;
  updatedAt: string;
}
export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  status: number;
  message: string;
}

export interface PaginatedLanguageResponse {
  languages: Language[];
  total: number;
  page: number;
  totalPages: number;
}
@Injectable({
  providedIn: 'root',
})
export class LanguageService {
  private baseUrl = 'http://localhost:3000';
  private readonly ITEMS_PER_PAGE = 5;

  constructor(private http: HttpClient) {}

  getLanguages(): Observable<any> {
    return this.http.get(`${this.baseUrl}/languages?status=1`);
  }

  // Admin: list languages with pagination and search
  getAllLanguagesAdmin(
    keyword = '',
    page = 1,
    statusFilter: number | '' = ''
  ): Observable<PaginatedLanguageResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', this.ITEMS_PER_PAGE.toString());
    if (keyword && keyword.trim()) {
      params = params.set('search', keyword.trim());
    }
    if (statusFilter === 0 || statusFilter === 1) {
      params = params.set('status', String(statusFilter));
    }
    return this.http
      .get<ApiResponse<PaginatedLanguageResponse>>(
        `${this.baseUrl}/languages`,
        { params }
      )
      .pipe(map((res) => res.data));
  }

  // Admin: create language (multipart)
  createLanguage(formData: FormData): Observable<Language> {
    return this.http
      .post<ApiResponse<Language>>(`${this.baseUrl}/languages`, formData, {
        withCredentials: true,
      })
      .pipe(map((res) => res.data));
  }

  // Admin: update language (multipart)
  updateLanguage(id: number, formData: FormData): Observable<Language> {
    return this.http
      .put<ApiResponse<Language>>(`${this.baseUrl}/languages/${id}`, formData, {
        withCredentials: true,
      })
      .pipe(map((res) => res.data));
  }

  // Admin: disable language
  disableLanguage(id: number): Observable<Language> {
    return this.http
      .put<ApiResponse<Language>>(
        `${this.baseUrl}/languages/${id}/disable`,
        {},
        { withCredentials: true }
      )
      .pipe(map((res) => res.data));
  }

  // Admin: enable language
  enableLanguage(id: number): Observable<Language> {
    return this.http
      .put<ApiResponse<Language>>(
        `${this.baseUrl}/languages/${id}/enable`,
        {},
        { withCredentials: true }
      )
      .pipe(map((res) => res.data));
  }
}
