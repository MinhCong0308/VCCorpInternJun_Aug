import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PostService {
  private baseUrl = 'http://localhost:3000';

  constructor(private http: HttpClient) { }

  getPublishedPosts(limit: number = 10, page: number = 1): Observable<any> {
    return this.http.get(`${this.baseUrl}/posts`);
  }
  getPublishedPostsTrending(limit: number = 10, page: number = 1): Observable<any> {
    return this.http.get(`${this.baseUrl}/posts/trending`);
  }
  getPostsByCategory(categoryId: number, limit: number = 10, page: number = 1): Observable<any> {
    return this.http.get(`${this.baseUrl}/posts?categoryId=${categoryId}`);
  }
  searchPosts(query: string) {
    return this.http.get<any>(`${this.baseUrl}/posts?search=${encodeURIComponent(query)}`);
  }
}
