import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';

export interface BadWord {
  wordid: number;
  word: string;
  locale?: string;
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

export interface PaginatedBadWordResponse {
  words: BadWord[];
  total: number;
  page: number;
  totalPages: number;
}

@Injectable({ providedIn: 'root' })
export class DictionaryService {
  private baseUrl = 'http://localhost:3000';
  private readonly ITEMS_PER_PAGE = 10;

  constructor(private http: HttpClient) {}

  getAll(
    keyword = '',
    page = 1,
    limit: number = this.ITEMS_PER_PAGE,
    status: '' | 0 | 1 = '',
    locale: string = ''
  ): Observable<PaginatedBadWordResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set(
        'limit',
        (limit && limit > 0 ? limit : this.ITEMS_PER_PAGE).toString()
      );
    if (keyword && keyword.trim())
      params = params.set('search', keyword.trim());
    if (status !== '') params = params.set('status', String(status));
    if (locale && locale.trim()) params = params.set('locale', locale.trim());
    return this.http
      .get<ApiResponse<PaginatedBadWordResponse>>(
        `${this.baseUrl}/dictionary`,
        {
          headers: this.getHeaders(),
          withCredentials: true,
          params,
        }
      )
      .pipe(map((resp) => resp.data));
  }

  getLocales(): Observable<string[]> {
    return this.http
      .get<ApiResponse<{ locales: string[] }>>(
        `${this.baseUrl}/dictionary/locales`,
        {
          headers: this.getHeaders(),
          withCredentials: true,
        }
      )
      .pipe(map((resp) => resp.data.locales || []));
  }

  create(data: {
    word: string;
    locale?: string;
    status?: number;
  }): Observable<BadWord> {
    return this.http
      .post<ApiResponse<BadWord>>(`${this.baseUrl}/dictionary`, data, {
        headers: this.getHeaders(),
        withCredentials: true,
      })
      .pipe(
        map((resp) => {
          if (resp.success && resp.data) return resp.data;
          throw new Error(resp.message || 'Create failed');
        })
      );
  }

  enable(wordid: number): Observable<BadWord> {
    return this.http
      .put<ApiResponse<BadWord>>(
        `${this.baseUrl}/dictionary/${wordid}/enable`,
        {},
        {
          headers: this.getHeaders(),
          withCredentials: true,
        }
      )
      .pipe(
        map((resp) => {
          if (resp.success && resp.data) return resp.data;
          throw new Error(resp.message || 'Enable failed');
        })
      );
  }

  disable(wordid: number): Observable<BadWord> {
    return this.http
      .put<ApiResponse<BadWord>>(
        `${this.baseUrl}/dictionary/${wordid}/disable`,
        {},
        {
          headers: this.getHeaders(),
          withCredentials: true,
        }
      )
      .pipe(
        map((resp) => {
          if (resp.success && resp.data) return resp.data;
          throw new Error(resp.message || 'Disable failed');
        })
      );
  }

  delete(wordid: number) {
    return this.http
      .delete<ApiResponse<{ message: string }>>(
        `${this.baseUrl}/dictionary/${wordid}`,
        {
          headers: this.getHeaders(),
          withCredentials: true,
        }
      )
      .pipe(
        map((resp) => {
          if (resp.success) return resp.data;
          throw new Error(resp.message || 'Delete failed');
        })
      );
  }

  // bulkDelete removed

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({ 'Content-Type': 'application/json' });
  }
}
