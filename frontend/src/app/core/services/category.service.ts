import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

// Interface cho một Category
export interface Category {
  categoryid: number;
  categoryname: string;
  createdAt: string;
  updatedAt: string;
  totalPost: string;
}

// Interface cho API Response
export interface ApiResponse {
  success: boolean;
  data: PaginatedCategoryResponse;
  status: number;
  message: string;
}

// Interface cho cấu trúc dữ liệu trả về từ API khi có phân trang
export interface PaginatedCategoryResponse {
  categories: Category[];
  total: number;
  page: number;
  totalPages: number;
}

@Injectable({
  providedIn: 'root',
})
export class CategoryService {
  private baseUrl = 'http://localhost:3000';
  private readonly ITEMS_PER_PAGE = 5;

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  /**
   * Lấy danh sách tất cả categories không phân trang
   */
  getCategories(): Observable<Category[]> {
    return this.http
      .get<ApiResponse>(`${this.baseUrl}/categories/list-all`, {
        headers: this.getHeaders(),
      })
      .pipe(map((response) => response.data.categories));
  }

  /**
   * Lấy danh sách categories có phân trang và tìm kiếm
   */
  getAllCategories(
    keyword = '',
    page = 1
  ): Observable<PaginatedCategoryResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', this.ITEMS_PER_PAGE.toString());

    if (keyword && keyword.trim()) {
      params = params.set('keyword', keyword.trim());
    }

    return this.http
      .get<ApiResponse>(`${this.baseUrl}/categories`, {
        headers: this.getHeaders(),
        params: params,
      })
      .pipe(map((response) => response.data));
  }

  /**
   * Tạo mới category (yêu cầu quyền admin)
   */
  createCategory(data: { categoryname: string }): Observable<Category> {
    return this.http
      .post<ApiResponse>(`${this.baseUrl}/categories`, data, {
        headers: this.getHeaders(),
      })
      .pipe(
        map((response) => {
          if (
            response.success &&
            response.data.categories &&
            response.data.categories.length > 0
          ) {
            return response.data.categories[0];
          }
          throw new Error('Create category failed');
        })
      );
  }

  /**
   * Cập nhật category (yêu cầu quyền admin)
   */
  updateCategory(
    id: number,
    data: { categoryname: string }
  ): Observable<Category> {
    return this.http
      .put<ApiResponse>(`${this.baseUrl}/categories/${id}`, data, {
        headers: this.getHeaders(),
      })
      .pipe(
        map((response) => {
          if (
            response.success &&
            response.data.categories &&
            response.data.categories.length > 0
          ) {
            return response.data.categories[0];
          }
          throw new Error('Update category failed');
        })
      );
  }

  /**
   * Xóa category (yêu cầu quyền admin)
   */
  deleteCategory(id: number): Observable<any> {
    return this.http
      .delete<ApiResponse>(`${this.baseUrl}/categories/${id}`, {
        headers: this.getHeaders(),
      })
      .pipe(
        map((response) => {
          if (response.success) {
            return response.data;
          }
          throw new Error('Delete category failed');
        })
      );
  }

  /**
   * Lấy headers với Authorization token nếu có
   */
  private getHeaders(): HttpHeaders {
    let token: string | null = null;
    if (isPlatformBrowser(this.platformId)) {
      try {
        token = localStorage.getItem('accessToken');
      } catch (_) {
        token = null;
      }
    }
    const headersConfig: { [key: string]: string } = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headersConfig['Authorization'] = `Bearer ${token}`;
    }
    return new HttpHeaders(headersConfig);
  }
}
