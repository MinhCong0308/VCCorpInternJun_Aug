import { Component, OnInit, ViewChild, ElementRef, Inject, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
interface Post {
  postid: number;
  title: string;
  content: string;
  createdAt: string;
}

interface UserProfile {
  fullname: string;
  avatarUrl: string;
  bio?: string;
}

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
  userProfile: UserProfile = {
    fullname: '',
    avatarUrl: '',
    bio: ''
  };

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
  constructor(private router: Router, @Inject(PLATFORM_ID) private platformId: Object) {}
  ngOnInit(): void {
    this.checkAuthentication();
    this.loadUserProfile();
    this.loadPosts();
  }

  private checkAuthentication(): void {
    if (!isPlatformBrowser(this.platformId)) {
      this.errorMessage = 'This feature is only available in the browser.';
      return;
    }
    const token = localStorage.getItem('accessToken');
    if (!token) {
      this.router.navigate(['/auth/login']);
    }
  }

  private async loadUserProfile(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) {
      this.errorMessage = 'This feature is only available in the browser.';
      return;
    }
    const token = localStorage.getItem('accessToken');
    if (!token) return;
    try {
      const response = await fetch('http://localhost:3000/account/profile', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        this.userProfile = {
          fullname: data.data.fullname || this.userProfile.fullname,
          avatarUrl: data.data.avatarUrl || this.userProfile.avatarUrl,
          bio: data.data.bio || this.userProfile.bio
        };
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  }

  async loadPosts(): Promise<void> {
    this.isLoading = true;
    this.errorMessage = '';

    try {
      if(!isPlatformBrowser(this.platformId)) {
        this.errorMessage = 'This feature is only available in the browser.';
        return;
      }
      this.posts = [];
      const token = localStorage.getItem('accessToken');
      if (!token) {
        this.errorMessage = 'You need to be logged in to view posts.';
        return;
      }

      const response = await fetch('http://localhost:3000/post-owner/get-all-posts', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to fetch posts');
      }

      if (responseData.data?.posts && Array.isArray(responseData.data.posts)) {
        this.posts = responseData.data.posts;
      } else {
        this.posts = [];
      }
    } catch (error: any) {
      this.errorMessage = error.message || 'Error fetching posts';
      console.error('Error fetching posts:', error);
    } finally {
      this.isLoading = false;
    }
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
    this.router.navigate(['/blog-owner/create'], { queryParams: { edit: postId } });
  }

  async deletePost(postId: number, event: Event): Promise<void> {
    event.preventDefault();
    
    const confirmed = confirm('Are you sure you want to delete this post?');
    if (!confirmed) return;

    try {
      if(!isPlatformBrowser(this.platformId)) {
        this.errorMessage = 'This feature is only available in the browser.'; 
        return;
      }
      const token = localStorage.getItem('accessToken');
      if (!token) {
        this.errorMessage = 'You need to be logged in to delete posts.';
        return;
      }

      const response = await fetch('http://localhost:3000/post-owner/delete-post', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ postid: postId })
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        this.successMessage = 'Post deleted successfully!';
        await this.loadPosts(); // Reload posts
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          this.successMessage = '';
        }, 3000);
      } else {
        this.errorMessage = data.message || 'Failed to delete post.';
      }
    } catch (error: any) {
      this.errorMessage = 'An error occurred while deleting the post.';
      console.error('Error deleting post:', error);
    }
  }

  logout(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('userInfo');
    this.router.navigate(['/auth/login']);
  }

  private clearMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
  }
}