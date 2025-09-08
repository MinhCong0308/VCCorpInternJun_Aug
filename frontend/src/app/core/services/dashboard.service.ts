import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

export interface DashboardTotals {
  users: number;
  posts: number;
  categories: number;
  languages: number;
  badwords: number;
}

export interface DashboardUser {
  userid: number;
  firstname?: string;
  lastname?: string;
  username: string;
  avatar?: string | null;
  createdAt: string;
}

export interface DashboardPostAuthor {
  userid: number;
  username: string;
}

export interface DashboardPost {
  postid: number;
  title: string;
  content?: string;
  createdAt: string;
  author?: DashboardPostAuthor | null;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  status: number;
  message: string;
}

export interface RawDashboardData {
  totals: DashboardTotals;
  latest_data: {
    users: DashboardUser[];
    posts: Array<
      Omit<DashboardPost, 'author'> & {
        User?: DashboardPostAuthor;
        user?: DashboardPostAuthor;
      }
    >;
  };
}

export interface DashboardData {
  totals: DashboardTotals;
  latestUsers: DashboardUser[];
  latestPosts: DashboardPost[];
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private baseUrl = 'http://localhost:3000';

  constructor(private http: HttpClient) {}

  getDashboard(): Observable<DashboardData> {
    return this.http
      .get<ApiResponse<RawDashboardData>>(`${this.baseUrl}/dashboard`, {
        withCredentials: true,
      })
      .pipe(
        map((res) => {
          const raw = res.data;
          const latestPosts: DashboardPost[] = (
            raw.latest_data?.posts || []
          ).map((p: any) => ({
            postid: p.postid,
            title: p.title,
            content: p.content,
            createdAt: p.createdAt,
            author: p.User || p.user || null,
          }));
          return {
            totals: raw.totals,
            latestUsers: raw.latest_data?.users || [],
            latestPosts,
          } as DashboardData;
        })
      );
  }
}
