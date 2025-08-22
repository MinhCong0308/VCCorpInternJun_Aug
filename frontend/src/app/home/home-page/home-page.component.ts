import { AfterViewInit, ElementRef, ViewChild, ViewChildren, QueryList, HostListener, Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { CategoryService } from '../../core/services/category.service';
import { PostService } from '../../core/services/post.service';
import { AccountService } from '../../core/services/account.service';
import { ActivatedRoute, Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { LanguageService, Language} from '../../core/services/language.service';
import { SearchService } from '../../core/services/search.service';

@Component({
  selector: 'app-home-page',
  templateUrl: './home-page.component.html',
  styleUrls: ['./home-page.component.css'],
  standalone: false,
})
export class HomePageComponent implements OnInit, AfterViewInit {
  categories: any[] = [];
  recommendedCategories: any[] = [];
  allCategories: any[] = [];
  showAllRecommended: boolean = false;
  selectedCategory: any = 'latest';
  posts: any[] = [];
  searchQuery: string = '';
  searchTermDisplay: string | null = null;
  showRecentSearches: boolean = false;
  isLoggedIn: boolean = false;
  isBrowser: boolean;
  avatarUrl: string = '';
  defaultAvatar: string = 'https://randomuser.me/api/portraits/lego/1.jpg';
  trendingPreviewPosts: any[] = [];
  languages: Language[] = [];
  currentLanguage: Language | null = null;
  @ViewChild('navCategoryScroll') navScroll!: ElementRef<HTMLDivElement>;
  @ViewChild('categoryBar') categoryBar!: ElementRef<HTMLDivElement>;
  @ViewChildren('catLink') catLinks!: QueryList<ElementRef<HTMLAnchorElement>>;
  showLeftArrow = false;
  showRightArrow = false;
  @ViewChild('postListTop') postListTop!: ElementRef<HTMLElement>;
  shouldScrollToTop = false;
  @ViewChild('navbar') navbar!: ElementRef<HTMLElement>;
  isNavHidden = false;
  lastScrollY = 0;
  suppressAutoHideUntil = 0;
  navSlide = 0;
  pendingScrollActive = false;

  constructor(
    private categoryService: CategoryService,
    private postService: PostService,
    private accountService: AccountService,
    private router: Router,
    private authService: AuthService,
    private languageService: LanguageService,
    private route: ActivatedRoute,
    public searchService: SearchService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    this.authService.checkSession().subscribe({
      next: (ok) => {
        this.isLoggedIn = ok;
        if (ok) {
          this.loadProfile();
        }
      },
    });
    this.getTrendingPreviewPosts(); // Tải danh sách post trending
    this.categoryService.getCategories().subscribe({
      next: (res: any) => {
        const staticTabs = [
          { categoryid: 'latest', categoryname: 'Latest' },
          { categoryid: 'trending', categoryname: 'Trending' },
        ];
        this.categories = [...staticTabs, ...res];
        // console.log("this.categories=", this.categories);
        this.allCategories = res; // Lưu danh sách đầy đủ
        // console.log("allCategories=", this.allCategories);
        // Lấy ngẫu nhiên 6 categories cho Recommended
        const shuffled = [...res].sort(() => 0.5 - Math.random());
        this.recommendedCategories = shuffled.slice(0, 6);
      },
      error: (err) => console.error('Failed to fetch categories', err),
    });
    this.loadLanguages();
    this.shouldScrollToTop = false;
    this.loadPosts();
    this.searchService.query$.subscribe(q => this.searchQuery = q || '');
    this.route.queryParamMap.subscribe(pm => {
      const q = (pm.get('q') || '').trim();
      const cat = pm.get('category');
      const id = cat ? Number(cat) : null;
      if (q) {
        this.searchService.setQuery(q);
        this.searchTermDisplay = q;
        this.selectedCategory = 'latest';
        this.shouldScrollToTop = true;
        this.searchPosts(q);
        return;
      }
      this.searchTermDisplay = '';
      if (id && !Number.isNaN(id)) {
        this.selectCategory(id); // đặt active tab + gọi API lọc
        this.pendingScrollActive = true;
        // this.cdr.detectChanges();
      } else {
        this.selectedCategory = 'latest';
        this.loadPosts();
      }
    });
  }

  ngAfterViewInit() {
    if (this.isBrowser) {
      this.isNavHidden = false;
      this.setNavSlide(0);
      this.lastScrollY = window.scrollY || 0;
      this.updateSidebarTop();
    }
    this.scrollActiveIntoView();
    setTimeout(() => this.updateArrows(), 0);
    this.catLinks.changes.subscribe(() => {
      if (this.pendingScrollActive) {
        // chờ 1 nhịp để class active được apply xong
        setTimeout(() => {
          this.scrollActiveIntoView();
          this.pendingScrollActive = false;
        }, 0);
      }
    });
  }

  @HostListener('window:resize')
  onResize() {
    if (!this.isBrowser) return;
    if (!this.isNavHidden) 
    this.updateArrows();
    this.updateSidebarTop();
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
    this.updateSidebarTop();
  }

  // Hàm để lấy profile người dùng đã đăng nhập
  loadProfile(): void {
    this.accountService.getProfile().subscribe({
      next: (res: any) => {
        this.avatarUrl = res?.data?.avatarUrl || this.defaultAvatar;
      },
      error: (err) => {
        console.error('Failed to load profile', err);
        this.avatarUrl = this.defaultAvatar;
      },
    });
  }

  // Hàm để xử lý sự kiện khi người dùng click vào logo
  onLogoClick(): void {
    if (this.router.url.startsWith('/home')) {
      // Đang ở /home hoặc /home?... → reload lại trang
      this.router.navigate(['/home']).then(() => window.location.reload());
    } else {
      // Nếu đang ở trang khác → chuyển về /home
      this.router.navigate(['/home']);
    }
  }

  onTabClick(cat: any) {
    this.selectCategory(cat.categoryid);
  }

  get currentCategoryName(): string {
    const cat = this.categories?.find(c => c.categoryid === this.selectedCategory);
    if (!cat && this.selectedCategory === 'trending') return 'Top Picks';
    return cat?.categoryname || 'All';
  }

  // Hàm để xử lý sự kiện khi người dùng chọn một category
  selectCategory(id: any): void {
    // Clear chế độ search nếu đang bật
    if (this.searchTermDisplay) {
      this.searchService.setQuery('');
      this.searchTermDisplay = '';
      this.router.navigate(['/home']); // loại ?q khỏi URL
    }
    this.selectedCategory = id;
    this.searchTermDisplay = null; // Clear search term display khi chọn category mới
    if (!this.isBrowser) return;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.showNavbarNow();
    this.shouldScrollToTop = true;
    this.loadPosts();
    this.scrollActiveIntoView();
    setTimeout(() => this.updateArrows(), 350);
    this.scrollToCategoryBar();
  }

  // Hàm để tải bài viết dựa trên category đã chọn
  loadPosts(): void {
    if (this.selectedCategory === 'latest') {
      this.postService.getPublishedPosts().subscribe((res) => {
        this.posts = res?.data?.posts || [];
        if (this.shouldScrollToTop) {
          setTimeout(() => this.scrollToPostListTop(), 0);
          this.shouldScrollToTop = false;
        }
      });
    } else if (this.selectedCategory === 'trending') {
      this.postService.getPublishedPostsTrending().subscribe((res) => {
        this.posts = res?.data?.posts || [];
        if (this.shouldScrollToTop) {
          setTimeout(() => this.scrollToPostListTop(), 0);
          this.shouldScrollToTop = false;
        }
      });
    } else {
      this.postService
        .getPostsByCategory(this.selectedCategory)
        .subscribe((res) => {
          this.posts = res?.data?.posts || [];
          if (this.shouldScrollToTop) {
            setTimeout(() => this.scrollToPostListTop(), 0);
            this.shouldScrollToTop = false;
          }
        });
    }
  }

  // Hàm để xử lý tìm kiếm bài viết
  onSearch() {
    const q = (this.searchQuery || '').trim();
    if (!q) {
      // Nếu submit rỗng: clear q khỏi URL và về chế độ bình thường
      this.searchService.setQuery('');
      this.searchTermDisplay = '';
      this.router.navigate(['/home']);   // loại bỏ cả ?category cũ nếu có
      this.selectedCategory = 'latest';
      this.shouldScrollToTop = false;
      this.loadPosts();
      return;
    }

    // Lưu recent + sync service
    this.searchService.addRecent(q);
    this.searchService.setQuery(q);
    this.showRecentSearches = false;

    // Đưa q lên URL (clear category)
    this.router.navigate(['/home'], { queryParams: { q } });

    // Hiển thị kết quả ngay (không chờ route loop)
    this.searchTermDisplay = q;
    this.selectedCategory = 'latest';
    this.shouldScrollToTop = true;
    this.searchPosts(q);
  }

  searchPosts(q: string) {
    this.postService.searchPosts(q).subscribe({
      next: (res) => {
        this.posts = res?.data?.posts || [];
        // cuộn về đầu danh sách (dùng hàm bạn đã có)
        setTimeout(() => this.scrollToPostListTop(), 0);
      },
      error: () => {
        this.posts = [];
      }
    });
  }

  // Hàm để tải danh sách tìm kiếm gần đây
  get recentSearches(): string[] { return this.searchService.recent; }

  onSearchFocus(): void {
    this.showRecentSearches = true;
  }

  onSearchBlur(): void {
    setTimeout(() => {
      this.showRecentSearches = false;
    }, 200); // để tránh mất focus khi click recent
  }

  // Hàm để lặp lại tìm kiếm với từ khóa đã nhập
  repeatSearch(term: string): void {
    this.searchQuery = term;
    this.onSearch();
  }

  // Hàm để xóa từ khóa tìm kiếm gần đây
  removeRecentSearch(term: string): void {
    const i = this.recentSearches.indexOf(term);
    if (i >= 0) this.searchService.removeRecent(i);
  }

  clearAllRecentSearches() {
    this.searchService.clearRecent();
  }

  // Hàm để toggle See more categories
  toggleRecommended(): void {
    this.showAllRecommended = !this.showAllRecommended;
  }

  // Hàm lấy 3 top picks
  getTrendingPreviewPosts(): void {
    this.postService.getPublishedPostsTrending().subscribe({
      next: (res: any) => {
        this.trendingPreviewPosts = res?.data?.posts.slice(0, 3) || [];
      },
      error: (err) => {
        console.error('Failed to fetch trending preview', err);
      },
    });
  }

  goToPost(id: any): void {
    this.router.navigate(['/post-detail', id]);
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

  scrollToCategoryBar() {
    if (!this.isBrowser || !this.categoryBar?.nativeElement) return;
    const offset = this.getStickyOffset();
    const top = this.categoryBar.nativeElement.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: 'smooth' });
  }

  scrollActiveIntoView() {
    setTimeout(() => {
      const activeEl = this.catLinks?.find(ref =>
        ref.nativeElement.classList.contains('active')
      )?.nativeElement;

      if (activeEl) {
        activeEl.scrollIntoView({
          behavior: 'smooth',
          inline: 'center',
          block: 'nearest'
        });
      }
    });
  }

  scrollToStart() {
    if (this.navScroll?.nativeElement) {
      this.navScroll.nativeElement.scrollTo({ left: 0, behavior: 'smooth' });
    }
  }

  updateArrows() {
    const el = this.navScroll?.nativeElement;
    if (!el) return;

    const maxScrollLeft = el.scrollWidth - el.clientWidth;
    const EPS = 2; // chống sai số

    this.showLeftArrow = el.scrollLeft > EPS;
    this.showRightArrow = el.scrollLeft < (maxScrollLeft - EPS);
  }

  onTabScroll() {
    this.updateArrows();
  }

  scrollBy(direction: 1 | -1) {
    const el = this.navScroll?.nativeElement;
    if (!el) return;

    // Bước cuộn: 60% bề rộng khung, tối thiểu 160px
    const step = Math.max(160, Math.round(el.clientWidth * 0.6));
    el.scrollBy({ left: direction * step, behavior: 'smooth' });

    // Cập nhật lại trạng thái sau khi cuộn mượt một chút
    setTimeout(() => this.updateArrows(), 300);
  }

  onWheel(e: WheelEvent) {
    const el = this.navScroll?.nativeElement;
    if (!el) return;

    if (el.scrollWidth > el.clientWidth) {
      // chỉ chặn khi có thể cuộn ngang
      e.preventDefault();
      el.scrollBy({ left: e.deltaY, behavior: 'auto' });
      this.updateArrows();
    }
  }

  scrollToPostListTop() {
    if (!this.isBrowser) return;
    const el = this.postListTop?.nativeElement as HTMLElement | null;
    if (!el) return;

    const offset = this.getStickyOffset();

    if (typeof (el as any).getBoundingClientRect === 'function') {
      const top = el.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    } else if (typeof (el as any).scrollIntoView === 'function') {
      (el as any).scrollIntoView({ behavior: 'smooth', block: 'start' });
      setTimeout(() => window.scrollBy({ top: -offset, behavior: 'auto' }), 0);
    }
  }

  getStickyOffset(): number {
    const navHidden = document.documentElement.classList.contains('nav-hidden');
    const navH = navHidden ? 0 : this.getCssVarPx('--navbar-height', 67.33);
    const navVisible = navH * (1 - this.navSlide);
    const catH = this.categoryBar?.nativeElement?.offsetHeight || 0;
    return navVisible + catH + 35.5;
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

  showNavbarNow() {
    // Chỉ dùng nếu bạn đang ở browser
    if (!this.isBrowser) return;

    this.isNavHidden = false;
    document.documentElement.classList.remove('nav-hidden'); // cập nhật class để Category Bar xuống đúng vị trí
    this.setNavSlide(0);
    this.lastScrollY = window.scrollY || 0;

    // chặn onWindowScroll ẩn navbar ngay trong nhịp cuộn tiếp theo
    this.suppressAutoHideUntil = Date.now() + 400; // 0.4s là đủ
  }

  updateSidebarTop() {
    // navSlide: 0..1 (0 = navbar hiện, 1 = ẩn). Bạn đã có biến này từ bước trước.
    const navH = this.getCssVarPx('--navbar-height', 67.33);
    const navVisible = navH * (1 - this.navSlide);

    const top = Math.round(navVisible + 24); // đệm nhỏ cho đẹp
    this.setCssVar('--sidebar-top', `${top}px`);
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
