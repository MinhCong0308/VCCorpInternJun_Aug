import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { PostService } from '../../core/services/post.service';
import { CommentService } from '../../core/services/comment.service';
import { AccountService } from '../../core/services/account.service';
import { ActivatedRoute, Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-post-detail',
  templateUrl: './post-detail.component.html',
  styleUrls: ['./post-detail.component.css'],
  standalone: false,
})
export class PostDetailComponent implements OnInit {
  postId: any;
  post: any;
  comments: any[] = [];
  isLoggedIn: boolean = false; // Biến để kiểm tra trạng thái đăng nhập
  isBrowser: boolean; // Biến để kiểm tra môi trường trình duyệt
  avatarUrl: string = ''; // Biến để lưu trữ URL của avatar người dùng
  defaultAvatar: string = 'https://randomuser.me/api/portraits/lego/1.jpg'; // URL của avatar mặc định
  isLiked: boolean = false;
  isAnimating: boolean = false;
  showPlusOne: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private postService: PostService,
    private commentService: CommentService,
    private accountService: AccountService,
    private router: Router,
    private authService: AuthService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }
  

  ngOnInit(): void {
    // if (this.isBrowser) {
    //   this.isLoggedIn = !!localStorage.getItem('accessToken'); // Kiểm tra xem người dùng đã đăng nhập hay chưa
    //   console.log('Access Token:', localStorage.getItem('accessToken'));
    // }
    this.authService.checkSession().subscribe({
      next: (ok) => {
        this.isLoggedIn = ok;
        if (ok) {
          this.loadProfile();
        }
      },
      error: () => {
        this.isLoggedIn = false;
      }
    });
    this.route.paramMap.subscribe(params => {
      this.postId = params.get('postId');
      // console.log("postId:", this.postId);
      if (this.postId === null) {
        console.error("Invalid post id");
        return;
      }
      this.loadPost(this.postId);
      this.loadComments(this.postId);
    });
  }

  loadProfile(): void {
    this.accountService.getProfile().subscribe({
      next: (res: any) => {
        this.avatarUrl = res?.data?.avatarUrl || this.defaultAvatar;
      },
      error: (err) => {
        console.error('Failed to load profile', err);
        this.avatarUrl = this.defaultAvatar;
      }
    });
  }

  loadPost(id: any): void {
    this.postService.getPostDetail(id).subscribe({
      next: (res: any) => {
        this.post = res.data;
        // console.log("this.post=", this.post)
      },
      error: (err) => console.error('Failed to load post', err)
    });
  }

  loadComments(id: any): void {
    this.commentService.getCommentsByPostId(id).subscribe({
      next: (res: any) => {
        this.comments = res.data;
      },
      error: (err) => console.error('Failed to load comments', err)
    });
  }

  like(id: any): void {
    this.isAnimating = true;
    this.isLiked = true;
    this.showPlusOne = true;
    setTimeout(() => {
      this.isAnimating = false;
      this.showPlusOne = false;
    }, 600);
    this.postService.likePost(id).subscribe({
      next: (res: any) => {
        this.post.like_cnt = res.data.like_cnt;
        // console.log('this.post.like_cnt', this.post.like_cnt);
      },
      error: (err) => console.error('Failed to like post', err)
    });
  }

  // Hàm để đăng xuất
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
}
