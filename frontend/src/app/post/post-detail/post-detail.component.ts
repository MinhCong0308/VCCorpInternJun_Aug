import { Component, Inject, OnInit, AfterViewInit, PLATFORM_ID, ViewChild, ElementRef, HostListener, OnDestroy, inject } from '@angular/core';
import { PostService } from '../../core/services/post.service';
import { CommentService, Comment } from '../../core/services/comment.service';
import { ActivatedRoute, Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { LanguageService, Language } from '../../core/services/language.service';
import { ProfileService, UserProfile } from '../../core/services/profile.service';
import { SearchService } from '../../core/services/search.service';
import { AppSettingsService } from '../../core/config/app-settings.service';
import { TranslateService } from '@ngx-translate/core';
import { Subject, takeUntil } from 'rxjs';
import { LocaleService } from '../../core/services/locale.service';

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
  isLiked: boolean = false;
  isAnimating: boolean = false;
  coverImageUrl: string = '';
  userid: any;
  languages: Language[] = [];
  currentLanguage: Language | null = null;
  loadingLang = false;
  userProfile: UserProfile | null = null;
  rootComments: UiComment[] = [];
  visibleRootCount = 4;
  expandedRootIds = new Set<number>();
  trackByUiId = (_: number, c: UiComment) => c.commentid;
  recommendedPosts: any[] = [];
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
  showErrorWarn = false;
  errorWarnText = '';
  errorToastTimer: any;

  private t(key: string, params?: Record<string, any>) {
    // instant là đủ vì i18n đã load; nếu muốn chắc, có thể dùng .get(...).subscribe(...)
    const out = this.translate.instant(key, params);
    return out || key;
  }

  private destroy$ = new Subject<void>();
  public localeService = inject(LocaleService);
  public currentLocale = 'en-US';

  constructor(
    private route: ActivatedRoute,
    private postService: PostService,
    private commentService: CommentService,
    private profileService: ProfileService,
    private router: Router,
    private authService: AuthService,
    private languageService: LanguageService,
    public search: SearchService,
    public appSettings: AppSettingsService,
    private translate: TranslateService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    this.search.query$.subscribe(q => this.query = q || '');
  }

  ngOnInit(): void {
    this.avatarUrl = this.appSettings.defaults.userAvatar;
    this.coverImageUrl = this.appSettings.defaults.postCover;
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
      this.watchRoute();
      this.loadPost(this.postId);
      this.loadComments(this.postId);
    });
    this.localeService.locale$.pipe(takeUntil(this.destroy$)).subscribe((loc: string) => { this.currentLocale = loc || 'en-US' });
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
        this.avatarUrl = profile.avatarUrl;
      },
      error: (err) => {
        console.error('Failed to load profile', err);
      }
    });
  }

  loadPost(id: any): void {
    this.postService.getPostDetail(id).subscribe({
      next: (res: any) => {
        this.post = res.data;
        this.applyComputedUrls(id);
        this.syncCurrentLanguage(true);
        // console.log("this.post=", this.post)
        this.coverImageUrl = res?.data?.coverImage;
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
    if (!this.isBrowser) return;
    try {
      const raw = localStorage.getItem('languages');
      if (raw) {
        this.languages = JSON.parse(raw) as Language[];
        this.languages = this.languages.filter(l => l.status === 1 || l.status === undefined);
        this.syncCurrentLanguage();  // đồng bộ với post nếu đã có
      }
    } catch {}
    this.languageService.getLanguages().subscribe({
      next: (res: any) => {
        const list: Language[] = (res?.data?.languages || res?.languages || res || []) as Language[];
        let normalized = list.filter(l => l.status === 1 || l.status === undefined)
                            .map(l => ({
                                ...l,
                                locale_code: l.locale_code?.trim() || (l.languagename === 'Vietnamese' ? 'vi' : 'en')
                            }));
        this.languages = normalized;
        if (this.isBrowser) {
          try { localStorage.setItem('languages', JSON.stringify(this.languages)); } catch {}
        }
        this.syncCurrentLanguage(true);
      },
      error: (err) => console.error('Failed to load languages', err),
    });
  }

  syncCurrentLanguage(applyUi = false): void {
    if (!this.post) return;

    // Ưu tiên: ngôn ngữ của post hiện tại
    let lang =
      this.languages.find(l => l.languageid === this.post.languageid)
      // fallback: ngôn ngữ mặc định hệ thống
      || this.languages.find(l => !!l.is_default)
      // fallback cuối: lấy phần tử đầu
      || this.languages[0];

    if (!lang && this.currentLanguage) lang = this.currentLanguage;

    this.currentLanguage = lang;
    if (applyUi && lang) this.applyUiLanguage(lang);
  }

  selectLanguage(lang: Language): void {
    if (!this.post || this.loadingLang) return;

    // Nếu bấm lại chính ngôn ngữ hiện tại → chỉ đổi UI (ngx-translate) rồi thoát
    if (lang.languageid === this.post.languageid) {
      this.applyUiLanguage(lang);
      this.currentLanguage = lang;
      return;
    }

    const originalId = this.post.original_postid || this.post.postid;
    this.loadingLang = true;

    this.postService.getPostsWithSameOriginalPostId(originalId, lang.languageid)
      .subscribe({
        next: (res: any) => {
          const list = res?.data?.posts ?? res?.posts ?? (Array.isArray(res) ? res : []);
          const target = Array.isArray(list)
            ? (list.find((x: any) => x.languageid === lang.languageid) || list[0])
            : (res?.data?.post || res?.post || null);

          if (!target) {
            this.loadingLang = false;
            this.showErrorToast('translate');
            console.warn('No translated post for language', lang.languageid);
            return;
          }

          // Đổi UI language ngay để có phản hồi thị giác
          this.applyUiLanguage(lang);
          this.currentLanguage = lang;
          
          this.localeService.setLocaleFromLangCode(lang.locale_code);

          // Điều hướng sang postid mới (URL “đúng bản dịch”)
          this.router.navigate(['/post-detail', target.postid], { replaceUrl: true })
            .finally(() => this.loadingLang = false);
        },
        error: (e) => {
          this.loadingLang = false;
          console.error('switch language error', e);
        }
      });
  }

  applyUiLanguage(lang?: Language): void {
    const code = lang?.locale_code?.trim();
    const id = lang?.languageid;
    if (!code) return;

    this.translate.use(code);
    if (this.isBrowser) {
      try { 
        localStorage.setItem('lang', code);
        localStorage.setItem('languageId', String(id));
      } catch {}
      document.documentElement.lang = code;
    }
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
      this.showAuthToast('like');
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

  showAuthToast(kind: 'like' | 'comment' | string = 'generic') {
    const keyMap: Record<string, string> = {
      like: 'TOAST.LOGIN_TO_LIKE',
      comment: 'TOAST.LOGIN_TO_COMMENT',
      generic: 'TOAST.PLEASE_LOGIN'
    };

    // Nếu tham số là 1 key đã có dấu chấm (AUTH.XYZ), dùng thẳng; nếu là like/comment/bookmark → map sang key; nếu là text thường → để nguyên
    const key = kind.includes?.('.') ? kind : (keyMap[kind] || keyMap['generic']);
    const msg = key.includes('.') ? this.t(key) : kind; // nếu là text thuần thì dùng trực tiếp

    this.authWarnText = msg;
    this.showAuthWarn = true;

    clearTimeout(this.authToastTimer);
    this.authToastTimer = setTimeout(() => (this.showAuthWarn = false), 3000);
  }

  dismissAuthToast() {
    clearTimeout(this.authToastTimer);
    this.showAuthWarn = false;
  }

  showErrorToast(kind: 'translate' | string = 'generic') {
    const keyMap: Record<string, string> = {
      translate: 'TOAST.NO_TRANSLATED_POST',
      generic: ''
    };
    const key = kind.includes?.('.') ? kind : (keyMap[kind] || keyMap['generic']);
    const msg = key.includes('.') ? this.t(key) : kind;
    
    this.errorWarnText = msg;
    this.showErrorWarn = true;

    clearTimeout(this.errorToastTimer);
    this.errorToastTimer = setTimeout(() => (this.showErrorWarn = false), 3000);
  }

  dismissErrorToast() {
    clearTimeout(this.errorToastTimer);
    this.showErrorWarn = false;
  }

  goLogin() {
    this.dismissAuthToast();
    this.router.navigate(['/auth/login']);
  }

  applyComputedUrls(post: any) {
    const defaultCover = this.appSettings.defaults.postCover;
    const cover = (post?.coverImage || '').toString().trim();
    this.coverImageUrl = cover ? cover : defaultCover;
  }

  watchRoute(): void {
    this.route.paramMap.subscribe(p => {
      const id = Number(p.get('postid') || p.get('postId'));
      if (!id) return;
      this.loadPost(id);
      if (this.isBrowser) window.scrollTo({ top: 0 });
    });
  }

  ngOnDestroy(): void {
    clearTimeout(this.authToastTimer);
    clearTimeout(this.holdTimeout);
    clearInterval(this.repeatInterval);
    this.destroy$.next();
    this.destroy$.complete();
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
