import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { catchError, EMPTY, Observable, throwError } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class PostService {
  private baseUrl = 'http://localhost:3000';

  constructor(
    private http: HttpClient,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) { }

  getPublishedPosts(): Observable<any> {
    return this.http.get(`${this.baseUrl}/posts`);
  }
  getPublishedPostsTrending(): Observable<any> {
    return this.http.get(`${this.baseUrl}/posts/trending`);
  }
  getPostsByCategory(categoryId: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/posts?categoryId=${categoryId}`);
  }
  searchPosts(query: string) {
    return this.http.get<any>(`${this.baseUrl}/posts?search=${encodeURIComponent(query)}`);
  }
  getPostDetail(postId: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/posts/${postId}`);
  }
  likePost(postId: number, count: number = 1): Observable<any> {
    if (!isPlatformBrowser(this.platformId)) {
      console.error("This feature is only available in the browser.");
      return EMPTY;
    }
    let params = new HttpParams();
    if (Number.isFinite(count) && count !== 1) {
      params = params.set('count', String(count));
    }
    return this.http.put(`${this.baseUrl}/posts/${postId}/like`, null, {
      withCredentials: true,
      params,
    }).pipe(
      catchError(error => {
        if (error.status === 401) {
          this.router.navigate(['/auth/login']);
        }
        return throwError(() => error);
      })
    )
  }
}
