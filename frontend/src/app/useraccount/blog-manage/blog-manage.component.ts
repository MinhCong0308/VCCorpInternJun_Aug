import { Component, OnInit, ViewChild, ElementRef, Inject, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { PostBlogOwnerService, Post } from '../../core/services/postowner.service';
import { AuthService } from '../../core/services/auth.service';
import { ProfileService, UserProfile} from '../../core/services/profile.service';
import { PostService } from '../../core/services/post.service';
import { LanguageService, Language } from '../../core/services/language.service';
@Component({
  selector: 'app-blog-manage',
  templateUrl: './blog-manage.component.html',
  styleUrls: ['./blog-manage.component.css'],
  standalone: false
})
export class BlogManageComponent implements OnInit {
  posts: Post[] = [];
  userProfile: UserProfile | null = null;
  isInitializing = true;
  languages : Language[] | null = null;
  activeTab = 'home';
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  defaultLanguage: Language | null = null;

  constructor(private router: Router, @Inject(PLATFORM_ID) private platformId: Object, private postService: PostBlogOwnerService, private authService: AuthService, private profileService: ProfileService, private postOnlyService: PostService, private languageService: LanguageService) {
    this.posts = []; // Ensure posts is always initialized as an empty array
  }
  async ngOnInit(): Promise<void> {
    if(!isPlatformBrowser(this.platformId)) {
      this.isInitializing = false;
      return;
    }
    this.isInitializing = true;
    this.profileService.getUserProfile().subscribe({
      next: (profile) => {
        this.userProfile = profile;
        this.isInitializing = false;
        this.loadPosts();
        this.loadLanguages();
        this.defaultLanguage = this.languages?.find(lang => lang.is_default) || null;
        this.isInitializing = false;
      },
      error: (error) => {
        console.error('Error fetching user profile:', error);
        this.isInitializing = false;
        
        if (error.status === 401 || error.message === 'Authentication required') {
          this.errorMessage = 'Session expired. Please log in again.';
          setTimeout(() => {
            this.router.navigate(['/auth/login']);
          }, 1000);
        } else {
          this.errorMessage = 'Failed to load user profile. Please try again.';
        }
      }
    });
  }
  loadPosts(): void {
    if (!this.userProfile) {
      this.posts = [];
      return;
    }
    this.isLoading = true;
    this.postService.getAllPosts().subscribe({
      next: (posts) => {
        this.posts = posts || []; // Ensure it's always an array
        this.isLoading = false;
      },
      error: (error) => {
        this.posts = []; // Reset to empty array on error
        this.errorMessage = 'Failed to load posts. Please try again later.';
        this.isLoading = false;
        console.error('Error loading posts:', error);
      }
    });
  }
  switchTab(tab: string, event: Event): void {
    event.preventDefault();
    this.activeTab = tab;
    this.clearMessages();
  }
  loadLanguages(): void {
    this.isLoading = true;
    this.languageService.getLanguages().subscribe({
      next: (response) => {
        console.log('Languages loaded:', response);
        this.languages = response.languages || [];
      },
      error: (error) => {
        // console.error('Error loading languages:', error);
        this.errorMessage = 'Failed to load languages. Please try again later.';
        this.isLoading = false;
      }
    });
  }
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 2592000) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    } else {
      const months = Math.floor(diffInSeconds / 2592000);
      return `${months} month${months > 1 ? 's' : ''} ago`;
    }
  }

  truncateContent(content: string, maxLength: number = 100): string {
    if (!content) return '';
    const filteredContent: string = new DOMParser().parseFromString(content, "text/html").body.textContent || '';
    if (!filteredContent || filteredContent.length <= maxLength) {
      return filteredContent || '';
    }
    return filteredContent.substring(0, maxLength) + '...';
  }
  viewPost(postId: number, event: Event): void {
    event.preventDefault();
    this.postOnlyService.getPostDetail(postId).subscribe({
      next: () => {
        this.router.navigate(['/post-detail'], { queryParams: { postId } });
        // print the router path
        console.log('Navigated to:', this.router.url);
      },
      error: (error) => {
        console.error('Error fetching post details:', error);
        this.errorMessage = 'Failed to load post details. Please try again later.';
      }
    });
  }
  editPost(postId: number, event: Event): void {
    event.preventDefault();
    // check post status
    const post = this.posts.find(p => p.postid === postId);
    console.log('Post status:', post?.status);
    if (post && post.status === 'PENDING') {
      this.router.navigate(['/blog-owner/create'], { queryParams: { edit: postId } });
    } else {
      this.errorMessage = 'You can only edit pending posts.';
      setTimeout(() => {
        this.errorMessage = '';
      }, 3000);
    }
  }
  deletePost(postId: number, event: Event): void {
    event.preventDefault();
    const confirmed = confirm('Are you sure you want to delete this post?');
    if (!confirmed) return;
    this.postService.deletePost(postId).subscribe({
      next: (response) => {
        console.log('Post deleted successfully:', response);
        if (response.success) {
          this.successMessage = 'Post deleted successfully.';
          this.loadPosts(); // Reload posts after deletion
          setTimeout(() => {
            this.successMessage = '';
          }, 3000);
        } else {
          this.errorMessage = response.message || 'Failed to delete post.';
        }
      }
    });
  }
  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/auth/login']);
      },
      error: (error) => {
        console.error('Logout error:', error);
      }
    });
  }

  navigateToLogin(): void {
    this.router.navigate(['/auth/login']);
  }

  private clearMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
  }
}