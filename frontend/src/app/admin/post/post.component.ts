import { CommonModule } from '@angular/common';
import { Component, OnInit, AfterViewInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import {
  PostAdminService,
  AdminPostSummary,
  PaginatedPostResponse,
} from '../../core/services/post-admin.service';

declare const $: any;

@Component({
  selector: 'app-admin-post',
  templateUrl: './post.component.html',
  styleUrls: ['./post.component.css'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
})
export class PostComponent implements OnInit, AfterViewInit {
  filterForm: FormGroup;
  posts: AdminPostSummary[] = [];
  keyword = '';
  categoryId: number | '' = '';
  errorMsg = '';
  currentPage = 1;
  totalPages = 0;
  totalItems = 0;

  categories: { categoryid: number; categoryname: string }[] = [];

  // Confirmation modal state
  confirmModal: {
    action: 'approve' | 'reject' | null;
    post: AdminPostSummary | null;
    title: string;
    message: string;
    btnClass: string;
  } = {
    action: null,
    post: null,
    title: '',
    message: '',
    btnClass: 'btn-primary',
  };

  constructor(private fb: FormBuilder, private service: PostAdminService) {
    this.filterForm = this.fb.group({
      keyword: [''],
      categoryId: [''],
    });
  }

  ngOnInit(): void {
    this.loadCategories();
    this.loadPosts();
  }

  ngAfterViewInit(): void {
    if (typeof $ === 'function') {
      $('[data-toggle="tooltip"]').tooltip();
    }
  }

  loadCategories(): void {
    this.service.getAllCategories().subscribe({
      next: (cats) => (this.categories = cats || []),
      error: () => (this.categories = []),
    });
  }

  loadPosts(page: number = 1): void {
    // Use component state as source of truth to avoid empty-string overriding
    const kw = (this.keyword || '').trim();
    const cat = this.categoryId;
    this.service.getPosts({ keyword: kw, categoryId: cat, page }).subscribe({
      next: (res: PaginatedPostResponse) => {
        this.posts = res.posts;
        this.currentPage = res.page;
        this.totalPages = res.totalPages;
        this.totalItems = res.total;
        this.errorMsg = '';
      },
      error: (err) => {
        this.errorMsg = err?.error?.message || 'Failed to load posts.';
      },
    });
  }

  onSearch(event?: Event, value?: string): void {
    if (event) event.preventDefault();
    if (typeof value === 'string') {
      this.keyword = value;
      this.filterForm.get('keyword')?.setValue(value);
    }
    this.currentPage = 1;
    this.loadPosts(1);
  }

  onCategoryChange(val: string | Event): void {
    const v =
      typeof val === 'string'
        ? val
        : String((val.target as HTMLSelectElement).value || '');
    this.categoryId = v ? Number(v) : '';
    this.currentPage = 1;
    this.loadPosts(1);
  }

  // status filter removed per requirements

  onPageChange(page: number): void {
    if (page >= 1 && page <= this.totalPages) this.loadPosts(page);
  }

  getPagesArray(): number[] {
    return Array(this.totalPages)
      .fill(0)
      .map((_, i) => i + 1);
  }

  authorName(p: AdminPostSummary): string {
    const fn = p.User?.firstname || '';
    const ln = p.User?.lastname || '';
    return `${fn} ${ln}`.trim();
  }

  languageName(p: AdminPostSummary): string {
    return p.Language?.languagename || '';
  }

  statusBadge(p: AdminPostSummary): { text: string; cls: string } {
    switch (p.status) {
      case 1:
        return { text: 'Pending', cls: 'bg-warning' };
      case 2:
        return { text: 'Approved', cls: 'bg-success' };
      case 3:
        return { text: 'Rejected', cls: 'bg-danger' };
      default:
        return { text: 'Unknown', cls: 'bg-secondary' };
    }
  }

  onApprove(p: AdminPostSummary): void {
    this.service.approvePost(p.postid).subscribe({
      next: () => this.loadPosts(this.currentPage),
      error: (err) =>
        (this.errorMsg = err?.error?.message || 'Failed to approve post.'),
    });
  }

  onReject(p: AdminPostSummary): void {
    this.service.rejectPost(p.postid).subscribe({
      next: () => this.loadPosts(this.currentPage),
      error: (err) =>
        (this.errorMsg = err?.error?.message || 'Failed to reject post.'),
    });
  }

  openConfirm(post: AdminPostSummary, action: 'approve' | 'reject'): void {
    this.confirmModal.post = post;
    this.confirmModal.action = action;
    if (action === 'approve') {
      this.confirmModal.title = 'Confirm Publish';
      this.confirmModal.message = 'Are you sure you want to publish this post?';
      this.confirmModal.btnClass = 'btn-success';
    } else {
      this.confirmModal.title = 'Confirm Reject';
      this.confirmModal.message = 'Are you sure you want to reject this post?';
      this.confirmModal.btnClass = 'btn-danger';
    }
    if (typeof $ === 'function') {
      $('#confirmActionModal').modal('show');
    }
  }

  confirmAction(): void {
    const { action, post } = this.confirmModal;
    if (!action || !post) return;
    if (action === 'approve') {
      this.onApprove(post);
    } else if (action === 'reject') {
      this.onReject(post);
    }
    if (typeof $ === 'function') {
      $('#confirmActionModal').modal('hide');
    }
    // Reset small delay to avoid flicker
    setTimeout(() => {
      this.confirmModal = {
        action: null,
        post: null,
        title: '',
        message: '',
        btnClass: 'btn-primary',
      };
    }, 300);
  }
}
