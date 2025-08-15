import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Injectable } from '@angular/core';

// Interface cho một Category
export interface Category {
  categoryid: number;
  categoryname: string;
  createdAt: string;
  updatedAt: string;
  totalPost?: number | string;
}

// Generic API response is defined by ApiResponse<T>

// Interface cho API Response
export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
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

  constructor(private http: HttpClient) {}

  /**
   * Lấy danh sách tất cả categories không phân trang
   */
  getCategories(): Observable<Category[]> {
    return this.http
      .get<ApiResponse<Category[]>>(`${this.baseUrl}/categories/list-all`)
      .pipe(map((response) => response.data));
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
      // Backend expects `search` query for full-text search
      params = params.set('search', keyword.trim());
    }

    return this.http
      .get<ApiResponse<PaginatedCategoryResponse>>(
        `${this.baseUrl}/categories`,
        {
          headers: this.getHeaders(),
          params: params,
        }
      )
      .pipe(map((response) => response.data));
  }

  /**
   * Tạo mới category (yêu cầu quyền admin)
   */
  createCategory(data: { categoryname: string }): Observable<Category> {
    return this.http
      .post<ApiResponse<Category>>(`${this.baseUrl}/categories`, data, {
        headers: this.getHeaders(),
        withCredentials: true,
      })
      .pipe(
        map((response) => {
          if (response.success && response.data) {
            return response.data;
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
      .put<ApiResponse<Category>>(`${this.baseUrl}/categories/${id}`, data, {
        headers: this.getHeaders(),
        withCredentials: true,
      })
      .pipe(
        map((response) => {
          if (response.success && response.data) {
            return response.data;
          }
          throw new Error('Update category failed');
        })
      );
  }

  /**
   * Xóa category (yêu cầu quyền admin)
   */
  deleteCategory(id: number): Observable<{ message: string }> {
    return this.http
      .delete<ApiResponse<{ message: string }>>(
        `${this.baseUrl}/categories/${id}`,
        {
          headers: this.getHeaders(),
          withCredentials: true,
        }
      )
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
    return new HttpHeaders({ 'Content-Type': 'application/json' });
  }
}
