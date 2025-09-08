import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { EMPTY, map } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';

export interface User {
  userid: number;
  firstname: string;
  lastname: string;
  avatar: string | null;
}

export interface Comment {
  commentid: number;
  userid: number;
  postid: number;
  content: string;
  lft: number;
  rgt: number;
  createdAt: string;
  updatedAt: string;
  User: User;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  status: number;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class CommentService {
  private baseUrl = 'http://localhost:3000';

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) { }

  getCommentsByPostId(postId: number) {
    return this.http.get<ApiResponse<Comment[]>>(`${this.baseUrl}/comments?postId=${postId}`).pipe(map(res => res.data));
  }

  createComment(postId: number, userId: number, content: string, parentId?: number) {
    return this.http.post<ApiResponse<Comment>>(`${this.baseUrl}/comments`, {postId, userId, content, parentId}, {
      withCredentials: true,
    }).pipe(map(res => res.data));
  }

  updateComment(commentId: number, content: string) {
    return this.http
      .put<ApiResponse<Comment>>(
        `${this.baseUrl}/comments/${commentId}`, { content }, {withCredentials: true}
      ).pipe(map(res => res.data));
  }
}
