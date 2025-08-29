import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';

export interface AdminPostSummary {
  postid: number;
  title: string;
  content: string;
  status: number;
  createdAt: string;
  updatedAt: string;
  User?: { firstname: string; lastname: string };
  Language?: {
    languagename: string;
    locale_code?: string;
    flag_image?: string;
  };
  Categories?: { categoryid: number; categoryname: string }[];
}

export interface PaginatedPostResponse {
  posts: AdminPostSummary[];
  total: number;
  page: number;
  totalPages: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  status: number;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class PostAdminService {
  private baseUrl = 'http://localhost:3000';
  private readonly ITEMS_PER_PAGE = 5;

  constructor(private http: HttpClient) {}

  getPosts(params: {
    keyword?: string;
    categoryId?: number | '';
    page?: number;
    limit?: number;
  }): Observable<PaginatedPostResponse> {
    let qp = new HttpParams()
      .set('limit', this.ITEMS_PER_PAGE.toString())
      .set('page', String(params.page ?? 1));

    if (params.keyword && params.keyword.trim()) {
      qp = qp.set('search', params.keyword.trim());
    }
    if (params.categoryId !== undefined && params.categoryId !== '') {
      qp = qp.set('categoryId', String(params.categoryId));
    }

    return this.http
      .get<ApiResponse<PaginatedPostResponse>>(`${this.baseUrl}/post-admin`, {
        withCredentials: true,
        params: qp,
      })
      .pipe(map((res) => res.data));
  }

  getPostDetail(postId: number): Observable<any> {
    return this.http
      .get<ApiResponse<any>>(`${this.baseUrl}/post-admin/${postId}`, {
        withCredentials: true,
      })
      .pipe(map((res) => res.data));
  }

  approvePost(postId: number): Observable<AdminPostSummary> {
    return this.http
      .put<ApiResponse<AdminPostSummary>>(
        `${this.baseUrl}/post-admin/${postId}/approve`,
        {},
        { withCredentials: true }
      )
      .pipe(map((res) => res.data));
  }

  rejectPost(postId: number): Observable<AdminPostSummary> {
    return this.http
      .put<ApiResponse<AdminPostSummary>>(
        `${this.baseUrl}/post-admin/${postId}/reject`,
        {},
        { withCredentials: true }
      )
      .pipe(map((res) => res.data));
  }

  getAllCategories(): Observable<
    { categoryid: number; categoryname: string }[]
  > {
    return this.http
      .get<ApiResponse<{ categoryid: number; categoryname: string }[]>>(
        `${this.baseUrl}/categories/list-all`,
        { withCredentials: true }
      )
      .pipe(map((res) => res.data));
  }
}
