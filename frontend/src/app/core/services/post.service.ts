import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, Observable, throwError } from 'rxjs';
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
  likePost(postId: number): Observable<any> {
    if (!isPlatformBrowser(this.platformId)) {
      return new Observable(observer => {
        observer.complete();
      });
    }
    const token = localStorage.getItem('accessToken') || '';
    if (!token) {
      this.router.navigate(['/login']);
      return throwError(() => new Error('No token available'));
    }
    
    return this.http.put(`${this.baseUrl}/posts/${postId}/like`, {}, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }).pipe(
      catchError(error => {
        if (error.status === 401) {
          this.router.navigate(['/login']);
        }
        return throwError(() => error);
      })
    )
  }
}
