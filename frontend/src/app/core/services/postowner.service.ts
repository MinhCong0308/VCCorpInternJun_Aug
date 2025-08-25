import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, map, Observable, throwError, of } from 'rxjs';


export interface Post {
  postid: number;
  title: string;
  content: string;
  languageid: number;
  tags: string[];
  status: string;
  createdAt: string;
}
export interface PagedPosts {
  items: Post[];
  total: number;
  page: number;
  limit: number;
}
@Injectable({
  providedIn: 'root' // for all components
})
export class PostBlogOwnerService {
  private baseUrl = 'http://localhost:3000/post-owner';
  constructor(private http: HttpClient) {}
  getAllPosts(): Observable<Post[]> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    return this.http.get<{data: {posts: Post[]}}>(`${this.baseUrl}/get-all-posts`, { headers, withCredentials: true })
      .pipe(map(response => response.data.posts), catchError(error => {
        console.error('Error fetching posts:', error);
        return throwError(() => new Error(error.message || 'Fetch posts error'));
      }));
  }
  getAllPostsPaging(page = 1, limit = 10): Observable<PagedPosts> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.get<{ data: PagedPosts }>(
      `${this.baseUrl}/get-all-posts-paging`,
      { headers, withCredentials: true, params: { page, limit } as any }
    ).pipe(
      map(res => res.data),
      catchError(error => {
        console.error('Error fetching posts:', error);
        return throwError(() => new Error(error.message || 'Fetch posts error'));
      })
    );
  }
  deletePost(postid: number): Observable<{ success: boolean; message?: string }> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    return this.http.delete<{ success: boolean; message?: string }>(
      `${this.baseUrl}/delete-post/${postid}`,
      { headers, withCredentials: true }
    );
  }
  getSpecificPost(postid: number): Observable<Post> {
    return this.http.get<{data: {post: Post}}>(
      `${this.baseUrl}/get-specific-post/${postid}`,
      { withCredentials: true }
    ).pipe(
      map(response => {
        // console.log('Fetched post:', response.data.post);
        return response.data.post;
      }),
      catchError(error => {
        console.error('Error fetching post:', error);
        return throwError(() => new Error(error.message || 'Fetch post error'));
      })
    );
  }
  getTranslationPost(postid: number): Observable<Post[]> {
    return this.http.get<{data: {translations: Post[]}}>(
      `${this.baseUrl}/get-translation-for-post/${postid}`,
      { withCredentials: true }
    ).pipe(
      map(response => response.data.translations),
      catchError(error => {
        console.error('Error fetching translation posts:', error);
        return throwError(() => new Error(error.message || 'Fetch translation posts error'));
      })
    );
  }
  requestForAppealPost(postid: number): Observable<any> { 
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    return this.http.post<any>(
      `${this.baseUrl}/appeal/${postid}`,
      {},
      { headers, withCredentials: true }
    );
  }
}
