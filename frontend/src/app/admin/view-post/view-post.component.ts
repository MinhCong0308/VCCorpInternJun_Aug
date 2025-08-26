import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { PostAdminService } from '../../core/services/post-admin.service';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

declare const $: any; // jQuery for AdminLTE modal & tooltip

@Component({
  selector: 'app-view-post',
  standalone: true,
  imports: [CommonModule, RouterModule, DatePipe],
  templateUrl: './view-post.component.html',
  styleUrls: ['./view-post.component.css'],
})
export class ViewPostComponent implements OnInit, AfterViewInit {
  loading = false;
  error = '';
  post: any = null;
  safeContent: SafeHtml | null = null;
  confirmModal: {
    action: 'approve' | 'reject' | null;
    title: string;
    message: string;
    btnClass: string;
  } = {
    action: null,
    title: '',
    message: '',
    btnClass: 'btn-primary',
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private service: PostAdminService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('postid');
    const postid = Number(idParam);
    if (!postid) {
      this.error = 'Invalid post id';
      return;
    }
    this.fetch(postid);
  }

  ngAfterViewInit(): void {
    if (typeof $ === 'function') {
      $('[data-toggle="tooltip"]').tooltip();
    }
  }

  fetch(postid: number) {
    this.loading = true;
    this.error = '';
    this.service.getPostDetail(postid).subscribe({
      next: (data) => {
        this.post = data || null;
        // Content từ editor trả về HTML: tin cậy từ backend admin => dùng Sanitizer
        this.safeContent = this.sanitizer.bypassSecurityTrustHtml(
          this.post?.content || ''
        );
        this.loading = false;
      },
      error: (err) => {
        this.error = err?.error?.message || 'Failed to load post';
        this.loading = false;
      },
    });
  }

  authorName(): string {
    const u = this.post?.User;
    const fn = [u?.firstname, u?.lastname].filter(Boolean).join(' ').trim();
    return fn || 'Unknown';
  }

  langName(): string {
    return this.post?.Language?.languagename || 'Unknown';
  }

  flagUrl(path?: string): string {
    if (!path) return '/assets/img/logo.png';
    if (/^https?:\/\//i.test(path)) return path;
    const fixed = path.startsWith('/') ? path : `/${path}`;
    return `http://localhost:3000${fixed}`;
  }

  statusBadge(): { text: string; cls: string } {
    const s = Number(this.post?.status);
    if (s === 2) return { text: 'Published', cls: 'badge badge-success' };
    if (s === 1) return { text: 'Pending', cls: 'badge badge-warning' };
    if (s === 0) return { text: 'Draft', cls: 'badge badge-secondary' };
    return { text: 'Unknown', cls: 'badge badge-light' };
  }

  backToList() {
    this.router.navigate(['/admin/posts']);
  }

  openConfirm(action: 'approve' | 'reject') {
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

  confirmAction() {
    if (!this.confirmModal.action || !this.post?.postid) return;
    const id = this.post.postid;
    if (this.confirmModal.action === 'approve') {
      this.service.approvePost(id).subscribe({
        next: (res) => {
          this.post.status = res.status;
          this.closeModal();
        },
        error: () => this.closeModal(),
      });
    } else {
      this.service.rejectPost(id).subscribe({
        next: (res) => {
          this.post.status = res.status;
          this.closeModal();
        },
        error: () => this.closeModal(),
      });
    }
  }

  private closeModal() {
    if (typeof $ === 'function') {
      $('#confirmActionModal').modal('hide');
    }
    setTimeout(() => {
      this.confirmModal = {
        action: null,
        title: '',
        message: '',
        btnClass: 'btn-primary',
      };
    }, 300);
  }
}
