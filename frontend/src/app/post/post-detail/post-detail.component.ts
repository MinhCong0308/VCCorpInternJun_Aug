import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { PostService } from '../../core/services/post.service';
import { CommentService, Comment } from '../../core/services/comment.service';
import { ActivatedRoute, Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { LanguageService } from '../../core/services/language.service';
import { ProfileService } from '../../core/services/profile.service';

interface Language {
  languageid: number;
  languagename: string;
  locale_code: string;
  is_default: boolean;
  flag_image: string;
  status: number;
  createdAt: string;
  updatedAt: string;
}

type CommentView = Comment & { depth: number };

@Component({
  selector: 'app-post-detail',
  templateUrl: './post-detail.component.html',
  styleUrls: ['./post-detail.component.css'],
  standalone: false,
})
export class PostDetailComponent implements OnInit {
  postId: any;
  post: any;
  comments: CommentView[] = [];
  visibleCount = 4;
  newComment = '';
  replyTo?: number;
  replyContent = '';
  isSubmitting = false;
  editingId?: number;
  editContent = '';
  isLoggedIn: boolean = false; // Biến để kiểm tra trạng thái đăng nhập
  isBrowser: boolean; // Biến để kiểm tra môi trường trình duyệt
  avatarUrl: string = ''; // Biến để lưu trữ URL của avatar người dùng
  defaultAvatar: string = 'https://randomuser.me/api/portraits/lego/1.jpg'; // URL của avatar mặc định
  isLiked: boolean = false;
  isAnimating: boolean = false;
  showPlusOne: boolean = false;
  coverImageUrl: string = '';
  defaultCoverImage: string = 'https://picsum.photos/1000';
  userid: any;
  languages: Language[] = [];
  currentLanguage: Language | null = null;

  constructor(
    private route: ActivatedRoute,
    private postService: PostService,
    private commentService: CommentService,
    private profileService: ProfileService,
    private router: Router,
    private authService: AuthService,
    private languageService: LanguageService,
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
      this.loadLanguages();
      this.loadPost(this.postId);
      this.loadComments(this.postId);
    });
  }

  loadProfile(): void {
    this.profileService.getUserProfile().subscribe({
      next: (res: any) => {
        this.userid = res?.data?.userid;
        console.log("this.userid:", this.userid);
        this.avatarUrl = res?.data?.avatarUrl || this.defaultAvatar;
        console.log("this.avatarUrl:", this.avatarUrl);
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
        this.coverImageUrl = res?.data?.coverImage || this.defaultCoverImage;
      },
      error: (err) => console.error('Failed to load post', err)
    });
  }

  loadComments(id: any) {
    this.commentService.getCommentsByPostId(id).subscribe({
      next: (list) => {
        this.comments = this.buildDepthFromNestedSet(list);
      },
      error: (err) => console.error('Failed to load comments', err)
    });
  }

  private buildDepthFromNestedSet(list: Comment[]): CommentView[] {
    // Sắp theo lft ASC, dùng stack để tính depth
    const items = [...list].sort((a, b) => a.lft - b.lft);
    const stack: Comment[] = [];
    const result: CommentView[] = [];

    for (const c of items) {
      // pop những node đã kết thúc phạm vi (rgt < current.lft)
      while (stack.length && stack[stack.length - 1].rgt < c.lft) {
        stack.pop();
      }
      const depth = stack.length;
      result.push({ ...c, depth });
      stack.push(c);
    }
    return result;
  }

  showMore() {
    this.visibleCount += 4;
  }

  hide() {
    this.visibleCount = 4;
  }

  sendNewComment() {
    const postId = this.post?.postid;
    const content = this.newComment.trim();
    const userId = this.userid;
    const parentId = 0;
    if (!postId || !content || !userId || this.isSubmitting) return;
    this.isSubmitting = true;

    this.commentService.createComment(postId, userId, content, parentId).subscribe({
      next: () => {
        this.newComment = '';
        this.isSubmitting = false;
        this.loadComments(postId);
      },
      error: (e) => console.error(e)
    });
  }

  openReplyForm(c: CommentView) {
    this.replyTo = c.commentid;
    this.replyContent = '';
  }

  cancelReply() {
    this.replyTo = undefined;
    this.replyContent = '';
  }

  sendReply(parent: CommentView) {
    const postId = this.post?.postid;
    const content = this.replyContent?.trim();
    const userId = this.userid;
    if (!postId ||!userId || !content) return;

    this.commentService.createComment(postId, userId, content, parent.commentid).subscribe({
      next: () => {
        this.replyContent = '';
        this.replyTo = undefined;
        this.loadComments(postId);
      },
      error: (e) => console.error(e)
    });
  }

  trackByCommentId(_: number, c: CommentView) {
    return c.commentid;
  }

  like(id: any): void {
    if (this.isLoggedIn == false) {
      this.router.navigate(['/auth/login']);
    }
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

  loadLanguages(): void {
    this.languageService.getLanguages().subscribe({
      next: (res: any) => {
        const list: Language[] = res?.data?.languages || [];
        this.languages = list;
        const byDefault = this.languages.find(l => l.is_default);
        this.currentLanguage = byDefault || null;
      },
      error: (err) => console.error('Failed to load languages', err),
    });
  }

  selectLanguage(lang: Language) {
    this.currentLanguage = lang;
    if(this.isBrowser) {
      localStorage.setItem('locale_code', lang.locale_code);
    }
    // Goi service doi ngon ngu o day
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
