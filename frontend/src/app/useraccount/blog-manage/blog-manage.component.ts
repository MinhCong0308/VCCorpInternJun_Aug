import { Component, OnInit, ViewChild, ElementRef, Inject, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { PostBlogOwnerService, Post } from '../../core/services/postowner.service';
import { AuthService } from '../../core/services/auth.service';
import { ProfileService, UserProfile} from '../../core/services/profile.service';

interface Language {
  id: number;
  flag: string;
}

@Component({
  selector: 'app-blog-manage',
  templateUrl: './blog-manage.component.html',
  styleUrls: ['./blog-manage.component.css'],
  standalone: false
})
export class BlogManageComponent implements OnInit {
  
  posts: Post[] = [];
  userProfile!: UserProfile;

  languages: Language[] = [
    { id: 1, flag: '🇺🇸' },
    { id: 2, flag: '🇻🇳' },
    { id: 3, flag: '🇫🇷' }
  ];

  selectedLanguage = 1;
  activeTab = 'home';
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  constructor(private router: Router, @Inject(PLATFORM_ID) private platformId: Object, private postService: PostBlogOwnerService, private authService: AuthService, private profileService: ProfileService) {}
  async ngOnInit(): Promise<void> {
    this.profileService.getUserProfile().subscribe({
      next: (profile) => {
        this.userProfile = profile;
      },
      error: (error) => {
        console.error('Error fetching user profile:', error);
        this.errorMessage = 'Failed to load user profile.';
      }
    });
    this.loadPosts();
  }
  
  loadPosts(): void {
    this.isLoading = true;
    this.posts = [];
    this.postService.getAllPosts().subscribe({
      next: (posts) => {
        this.posts = posts;
        this.isLoading = false;
      },
      error: (error) => {
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

  selectLanguage(languageId: number, event: Event): void {
    event.preventDefault();
    this.selectedLanguage = languageId;
  }

  getLanguageFlag(languageId: number): string {
    const lang = this.languages.find(l => l.id === languageId);
    return lang ? lang.flag : '🇺🇸';
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
    if (!content || content.length <= maxLength) {
      return content || '';
    }
    return content.substring(0, maxLength) + '...';
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

  private clearMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
  }
}