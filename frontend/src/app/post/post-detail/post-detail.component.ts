import { Component, Inject, OnInit, AfterViewInit, PLATFORM_ID, ViewChild, ElementRef, HostListener, OnDestroy } from '@angular/core';
import { PostService } from '../../core/services/post.service';
import { CommentService, Comment } from '../../core/services/comment.service';
import { ActivatedRoute, Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { LanguageService, Language } from '../../core/services/language.service';
import { ProfileService, UserProfile } from '../../core/services/profile.service';
import { SearchService } from '../../core/services/search.service';

type CommentView = Comment & { depth: number };
type UiComment = Comment & { children: UiComment[]; depth: number };

@Component({
  selector: 'app-post-detail',
  templateUrl: './post-detail.component.html',
  styleUrls: ['./post-detail.component.css'],
  standalone: false,
})
export class PostDetailComponent implements OnInit, AfterViewInit, OnDestroy {
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
  coverImageUrl: string = '';
  defaultCoverImage: string = 'https://picsum.photos/1000';
  userid: any;
  languages: Language[] = [];
  currentLanguage: Language | null = null;
  userProfile: UserProfile | null = null;
  rootComments: UiComment[] = [];
  visibleRootCount = 4;
  expandedRootIds = new Set<number>();
  trackByUiId = (_: number, c: UiComment) => c.commentid;
  recommendedPosts: any[] = [];
  defaultThumb = 'https://hatrabbits.com/wp-content/uploads/2017/01/random.jpg';
  @ViewChild('navbar') navbar!: ElementRef<HTMLElement>;
  isNavHidden = false;
  lastScrollY = 0;
  navSlide = 0;
  query = '';
  dropdownOpen = false;
  LONG_PRESS_MS = 250; // giữ lâu hơn 250ms thì vào chế độ lặp
  REPEAT_MS = 120; // chu kỳ lặp like ms
  MAX_PER_HOLD = 100; // limit trần an toàn (client) cho mỗi lần giữ
  holdTimeout?: any;
  repeatInterval?: any;
  holding = false;
  longPressed = false;
  // Số like (UI) cộng trong 1 lần nhấn/giữ (để gộp gửi khi nhả)
  sessionLikes = 0;
  sentOnRelease = false;
  plusBubbles: { id: number; dx: number }[] = []; // dx: lệch ngang ngẫu nhiên
  bubbleSeq = 0;
  trackByBubble = (_: number, b: { id: number }) => b.id;
  // Toast noti
  showAuthWarn = false;
  authWarnText = '';
  authToastTimer: any;

  constructor(
    private route: ActivatedRoute,
    private postService: PostService,
    private commentService: CommentService,
    private profileService: ProfileService,
    private router: Router,
    private authService: AuthService,
    private languageService: LanguageService,
    public search: SearchService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    this.search.query$.subscribe(q => this.query = q || '');
  }
  

  ngOnInit(): void {
    if (this.isBrowser) {
      if ('scrollRestoration' in history) {
        history.scrollRestoration = 'auto';
      }
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    }
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

  ngAfterViewInit(): void {
    if (this.isBrowser) {
      this.isNavHidden = false;
      this.setNavSlide(0);
      this.lastScrollY = window.scrollY || 0;
    }
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    if (!this.isBrowser) return;

    const y = window.scrollY || 0;
    const delta = y - this.lastScrollY;

    // Nếu ở sát đầu trang → mở hoàn toàn
    if (y <= 0) {
      this.setNavSlide(0);
      this.lastScrollY = 0;
      return;
    }

    // Nếu menu navbar đang mở (mobile), đừng ẩn
    const collapse = this.navbar?.nativeElement?.querySelector('.navbar-collapse');
    const expanded = collapse?.classList.contains('show');
    if (expanded) {
      this.setNavSlide(0);
      this.lastScrollY = y;
      return;
    }

    // Tính slide theo tổng quãng cuộn
    const navH = this.getCssVarPx('--navbar-height', 67.33);

    // 1) tích lũy khoảng ẩn-tính theo px (0..navH)
    let hiddenPx = this.navSlide * navH + delta;

    // 2) clamp vào 0..navH
    hiddenPx = Math.max(0, Math.min(navH, hiddenPx));

    // 3) đổi sang tỉ lệ 0..1 và set CSS var
    const ratio = navH > 0 ? hiddenPx / navH : 0;
    this.setNavSlide(ratio);

    this.lastScrollY = y;
  }

  loadProfile(): void {
    this.profileService.getUserProfile().subscribe({
      next: (profile) => {
        this.userProfile = profile;
        this.userid = profile.userid;
        this.avatarUrl = profile.avatarUrl || this.defaultAvatar;
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
        this.loadRecommendations(this.post);
      },
      error: (err) => console.error('Failed to load post', err)
    });
  }

  loadComments(id: any) {
    this.commentService.getCommentsByPostId(id).subscribe({
      next: (list) => {
        this.comments = this.buildDepthFromNestedSet(list);
        this.rootComments = this.buildTreeFromNestedSet(list);
        this.visibleRootCount = Math.min(4, this.rootComments.length);
      },
      error: (err) => console.error('Failed to load comments', err)
    });
  }

  buildDepthFromNestedSet(list: Comment[]): CommentView[] {
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

  buildTreeFromNestedSet(list: Comment[]): UiComment[] {
    const sorted = [...list].sort((a, b) => a.lft - b.lft);
    const items: UiComment[] = sorted.map(c => ({ ...c, children: [], depth: 0 }));
    const stack: UiComment[] = [];
    const roots: UiComment[] = [];

    for (const c of items) {
      while (stack.length && stack[stack.length - 1].rgt < c.lft) stack.pop();
      c.depth = stack.length; // depth tính theo stack
      if (stack.length) stack[stack.length - 1].children.push(c);
      else roots.push(c);
      stack.push(c);
    }
    return roots;
  }

  getDirectChildCount(root: UiComment) {
    return root.children.length; // đếm con trực tiếp 
  }

  toggleReplies(root: UiComment) {
    if (this.expandedRootIds.has(root.commentid)) this.expandedRootIds.delete(root.commentid);
    else this.expandedRootIds.add(root.commentid);
  }

  showMoreRoots() {
    this.visibleRootCount = Math.min(this.visibleRootCount + 4, this.rootComments.length);
  }

  hideRoots() {
    this.visibleRootCount = 4;
    this.expandedRootIds.clear();
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
    this.spawnPlusOne();
    setTimeout(() => {
      this.isAnimating = false;
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

  shuffleInPlace<T>(a: T[]): T[] {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  getCategoryIdSet(post: any): Set<number> {
    // Hỗ trợ cả 2 dạng: post.Categories (array) hoặc post.categoryid (số)
    if (post?.Categories?.length) {
      return new Set(post.Categories.map((c: any) => c.categoryid));
    }
    if (typeof post?.categoryid === 'number') {
      return new Set([post.categoryid]);
    }
    return new Set<number>();
  }

  shareAnyCategory(post: any, currentSet: Set<number>): boolean {
    if (!currentSet.size) return false;
    const ids = this.getCategoryIdSet(post);
    for (const id of ids) if (currentSet.has(id)) return true;
    return false;
  }

  loadRecommendations(currentPost: any) {
    const currentId = currentPost?.postid;
    const currentCats = this.getCategoryIdSet(currentPost);
    const langId = currentPost?.languageid;

    this.postService.getPublishedPosts(langId).subscribe({
      next: (res: any) => {
        const all: any[] = res?.data?.posts ?? [];
        // Loại bài hiện tại
        let pool = all.filter(p => p.postid !== currentId);

        // Nếu bài hiện tại không có category → chọn ngẫu nhiên 4 từ pool
        if (!currentCats.size) {
          this.recommendedPosts = this.shuffleInPlace(pool).slice(0, 4);
          return;
        }

        // Chia cùng/khác category (share ít nhất 1 category)
        const sameCat = this.shuffleInPlace(pool.filter(p => this.shareAnyCategory(p, currentCats)));
        const otherCat = this.shuffleInPlace(pool.filter(p => !this.shareAnyCategory(p, currentCats)));

        const needed = 4;
        const takeSame = sameCat.slice(0, Math.min(needed, sameCat.length));
        const takeOther = otherCat.slice(0, Math.max(0, needed - takeSame.length));

        this.recommendedPosts = [...takeSame, ...takeOther];
      },
      error: (e) => console.error('Failed to load recommendations', e),
    });
  }

  goToPost(id: number) {
    this.router.navigate(['/post-detail', id]);
  }

  setCssVar(name: string, value: string) {
    if (!this.isBrowser) return;
    document.documentElement.style.setProperty(name, value);
  }

  getCssVarPx(name: string, fallback = 0): number {
    if (!this.isBrowser) return fallback;
    const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : fallback;
  }

  setNavSlide(ratio: number) {
    // clamp 0..1
    this.navSlide = Math.max(0, Math.min(1, ratio));
    this.setCssVar('--nav-slide', `${this.navSlide}`);
  }

  onSearchFocus() { this.dropdownOpen = true; }
  onSearchBlur()  { setTimeout(() => this.dropdownOpen = false, 120); }

  submit() {
    const q = (this.query || '').trim();
    if (!q) return;
    this.search.addRecent(q);
    this.search.setQuery(q);
    this.dropdownOpen = false;
    // điều hướng về /home?q=...
    this.router.navigate(['/home'], { queryParams: { q } });
  }

  clickRecent(item: string) {
    this.query = item;
    this.submit();
  }

  removeRecent(i: number, ev: MouseEvent) {
    ev.stopPropagation();
    this.search.removeRecent(i);
  }

  clearRecent(ev: MouseEvent) {
    ev.stopPropagation();
    this.search.clearRecent();
  }

  // Hàm để tải danh sách tìm kiếm gần đây
  get recentSearches(): string[] { return this.search.recent; }

  onLikePress(ev: Event) {
    if (!this.isLoggedIn) {
      this.showAuthToast('You need to log in to like this post');
      return; 
    }
    if (ev.type === 'touchstart') { ev.preventDefault(); } // tránh click ảo trên mobile

    this.holding = true;
    this.longPressed = false;
    this.sessionLikes = 0;
    this.sentOnRelease = false;

    // nếu giữ > LONG_PRESS_MS -> bật chế độ lặp
    this.holdTimeout = setTimeout(() => {
      if (!this.holding) return;
      this.longPressed = true;
      this.startRepeat();
    }, this.LONG_PRESS_MS);

    this.likeOnce(); // khi bấm xuống (đầu) cộng 1 like
  }

  onLikeRelease(_ev?: Event) {
    if (!this.holding) return;
    this.holding = false;

    clearTimeout(this.holdTimeout);
    this.holdTimeout = undefined;

    if (this.longPressed) {
      clearInterval(this.repeatInterval);
      this.repeatInterval = undefined;
    }

    // Gửi GỘP đúng tổng số like vừa cộng trong lần nhấn này
    const totalToSend = Math.max(0, this.sessionLikes);
    this.sessionLikes = 0;

    // tránh gửi 2 lần nếu release bị lặp (mouse + touch)
    if (this.sentOnRelease || !totalToSend) return;
    this.sentOnRelease = true;

    this.sendLikesInChunks(totalToSend);
  }

  startRepeat() {
    this.repeatInterval = setInterval(() => {
      if (!this.holding || this.sessionLikes >= this.MAX_PER_HOLD) {
        this.onLikeRelease(); 
        return; 
      }
      this.likeOnce();
    }, this.REPEAT_MS);
  }

  likeOnce() {
    if (!this.post) return;
    // UI lạc quan
    this.isAnimating = true;
    this.isLiked = true;
    this.post.like_cnt = (this.post.like_cnt || 0) + 1;
    this.spawnPlusOne();
    this.sessionLikes++; // đếm vào tổng của LẦN NHẤN HIỆN TẠI
    setTimeout(() => {
      this.isAnimating = false;
    }, 300); // tắt bounce nhẹ
  }

  sendLikesInChunks(total: number) {
    const postId = this.post?.postid;
    if (!postId || total <= 0) return;

    const CHUNK = 100; // khớp MAX_LIKES_PER_REQUEST ở controller
    const send = (left: number) => {
      if (left <= 0) return;

      const n = Math.min(CHUNK, left);
      this.postService.likePost(postId, n).subscribe({
        next: (res) => {
          // đồng bộ theo server để chống lệch
          const serverCnt = res?.data?.like_cnt;
          if (typeof serverCnt === 'number') this.post.like_cnt = serverCnt;
        },
        error: (err) => {
          console.error('like (batched) failed', err);
        },
        complete: () => {
          send(left - n);
        }
      });
    };

    send(total);
  }

  spawnPlusOne() {
    // Giới hạn tối đa bubble đồng thời để bảo vệ DOM
    const MAX_BUBBLES = 18;
    if (this.plusBubbles.length >= MAX_BUBBLES) {
      this.plusBubbles.shift();
    }

    const id = ++this.bubbleSeq;
    // Xê dịch ngang ngẫu nhiên cho tự nhiên (-10px..+10px)
    const dx = (Math.random() * 20) - 10;

    this.plusBubbles.push({ id, dx });
  }

  onBubbleDone(id: number) {
    // Xóa bubble khi animation kết thúc
    const idx = this.plusBubbles.findIndex(b => b.id === id);
    if (idx >= 0) this.plusBubbles.splice(idx, 1);
  }

  showAuthToast(message = 'You need to log in to like the post') {
    this.authWarnText = message;
    this.showAuthWarn = true;

    clearTimeout(this.authToastTimer);
    // Tự ẩn sau 3s
    this.authToastTimer = setTimeout(() => {
      this.showAuthWarn = false;
    }, 3000);
  }

  dismissAuthToast() {
    clearTimeout(this.authToastTimer);
    this.showAuthWarn = false;
  }

  goLogin() {
    this.dismissAuthToast();
    this.router.navigate(['/auth/login']);
  }

  ngOnDestroy(): void {
    clearTimeout(this.authToastTimer);
    clearTimeout(this.holdTimeout);
    clearInterval(this.repeatInterval);
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
