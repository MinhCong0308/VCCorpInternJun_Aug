import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { PostAdminService } from '../../core/services/post-admin.service';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-view-post',
  standalone: true,
  imports: [CommonModule, RouterModule, DatePipe],
  templateUrl: './view-post.component.html',
  styleUrls: ['./view-post.component.css']
})
export class ViewPostComponent implements OnInit {
  loading = false;
  error = '';
  post: any = null;
  safeContent: SafeHtml | null = null;

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

  fetch(postid: number) {
    this.loading = true;
    this.error = '';
    this.service.getPostDetail(postid).subscribe({
      next: (data) => {
        this.post = data || null;
        // Content từ editor trả về HTML: tin cậy từ backend admin => dùng Sanitizer
        this.safeContent = this.sanitizer.bypassSecurityTrustHtml(this.post?.content || '');
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
}
