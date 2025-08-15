import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  DashboardData,
  DashboardService,
  DashboardUser,
  DashboardPost,
} from '../../core/services/dashboard.service';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
  standalone: true,
  imports: [CommonModule, RouterModule],
})
export class DashboardComponent implements OnInit {
  loading = false;
  error = '';
  totals = { users: 0, posts: 0, categories: 0, languages: 0 };
  latestUsers: DashboardUser[] = [];
  latestPosts: DashboardPost[] = [];
  private apiBase = 'http://localhost:3000';

  constructor(private dashboardService: DashboardService) {}

  ngOnInit(): void {
    this.fetch();
  }

  fetch(): void {
    this.loading = true;
    this.error = '';
    this.dashboardService.getDashboard().subscribe({
      next: (data: DashboardData) => {
        this.totals = data.totals;
        this.latestUsers = data.latestUsers || [];
        this.latestPosts = data.latestPosts || [];
        this.loading = false;
      },
      error: (err) => {
        this.error = err?.error?.message || 'Failed to load dashboard data';
        this.loading = false;
      },
    });
  }

  fullName(u: DashboardUser): string {
    const fn = [u.firstname, u.lastname].filter(Boolean).join(' ').trim();
    return fn || u.username;
  }

  avatarUrl(avatar?: string | null): string {
    const fallback = '/assets/img/logo.png';
    if (!avatar) return fallback;
    // If already absolute
    if (/^https?:\/\//i.test(avatar)) return avatar;
    // Normalize leading slash
    const path = avatar.startsWith('/') ? avatar : `/${avatar}`;
    return `${this.apiBase}${path}`;
  }
}
