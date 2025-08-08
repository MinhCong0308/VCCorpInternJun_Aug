import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';


export interface Post {
  postid: number;
  title: string;
  content: string;
  languageid: number;
  tags: string[];
  createdAt: string;
}
@Injectable({
  providedIn: 'root' // for all components
})
export class PostService {
  private baseUrl = 'http://localhost:3000/post-owner';
  constructor(private http: HttpClient) {}
  async getAllPosts(): Promise<Post[]> {
    const response = await fetch(`${this.baseUrl}/get-all-posts`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include'
    });
    const responseData = await response.json();
    if(!response.ok) {
      throw new Error(responseData.message || 'Failed to fetch posts');
    }
    if (responseData.data?.posts && Array.isArray(responseData.data.posts)) {
        return responseData.data.posts;
      } else {
        return [];
      }
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
}
