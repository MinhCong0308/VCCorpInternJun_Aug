import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { CategoryService } from '../../core/services/category.service';
import { PostService } from '../../core/services/post.service';
import { AccountService } from '../../core/services/account.service';
import { Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-home-page',
  templateUrl: './home-page.component.html',
  styleUrls: ['./home-page.component.css'],
  standalone: false,
})
export class HomePageComponent implements OnInit {
  categories: any[] = [];
  recommendedCategories: any[] = []; // Biến để lưu trữ các category được gợi ý
  allCategories: any[] = []; // Biến để lưu trữ tất cả các category (không bao gồm các static tabs), CÓ THỂ MỞ RỘNG THÀNH 1 TRANG EXPLORE-CATEGORIES
  showAllRecommended: boolean = false; // Toggle để hiển thị thêm
  selectedCategory: any = 'latest'; // Biến theo dõi category đang chọn
  posts: any[] = []; // Biến để lưu trữ bài viết
  searchQuery: string = ''; // Biến để lưu trữ từ khóa tìm kiếm
  searchTermDisplay: string | null = null; // Biến để hiển thị từ khóa tìm kiếm
  recentSearches: string[] = []; // Biến để lưu trữ các từ khóa tìm kiếm gần đây
  showRecentSearches: boolean = false; // Biến để kiểm soát hiển thị danh sách tìm kiếm gần đây
  isLoggedIn: boolean = false; // Biến để kiểm tra trạng thái đăng nhập
  isBrowser: boolean; // Biến để kiểm tra môi trường trình duyệt
  avatarUrl: string = ''; // Biến để lưu trữ URL của avatar người dùng
  defaultAvatar: string = 'https://randomuser.me/api/portraits/lego/1.jpg'; // URL của avatar mặc định
  trendingPreviewPosts: any[] = []; // Biển để lưu 3 bài post trending

  constructor(
    private categoryService: CategoryService,
    private postService: PostService,
    private accountService: AccountService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    if (this.isBrowser) {
      this.isLoggedIn = !!localStorage.getItem('accessToken'); // Kiểm tra xem người dùng đã đăng nhập hay chưa
      console.log('Access Token:', localStorage.getItem('accessToken'));
    }
    this.loadRecentSearches(); // Tải danh sách tìm kiếm gần đây từ localStorage
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
    this.loadPosts(); // Mặc định là

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
    if (this.router.url === '/home') {
      // Đang ở /home → reload lại trang
      window.location.reload();
    } else {
      // Nếu đang ở trang khác → chuyển về /home
      this.router.navigate(['/home']);
    }
  }

  // Hàm để xử lý sự kiện khi người dùng chọn một category
  selectCategory(id: any): void {
    this.selectedCategory = id;
    this.searchTermDisplay = null; // Clear search term display khi chọn category mới
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.loadPosts();
  }

  // Hàm để tải bài viết dựa trên category đã chọn
  loadPosts(): void {
    if (this.selectedCategory === 'latest') {
      this.postService.getPublishedPosts().subscribe((res) => {
        this.posts = res?.data?.posts || [];
      });
    } else if (this.selectedCategory === 'trending') {
      this.postService.getPublishedPostsTrending().subscribe((res) => {
        this.posts = res?.data?.posts || [];
      });
    } else {
      this.postService
        .getPostsByCategory(this.selectedCategory)
        .subscribe((res) => {
          this.posts = res?.data?.posts || [];
        });
    }
  }

  // Hàm để xử lý tìm kiếm bài viết
  onSearch(): void {
    const query = this.searchQuery.trim();
    this.saveToRecentSearches(query); // Lưu từ khóa tìm kiếm vào danh sách gần đây
    if (!query) {
      // Nếu không nhập gì: reset danh sách và searchQuery
      this.searchTermDisplay = null; // Clear search term display
      this.selectedCategory = 'latest'; // Reset về Latest
      this.searchQuery = ''; // Clear search input
      this.loadPosts(); // Tải lại bài viết theo category đã chọn
      return;
    }

    this.postService.searchPosts(query).subscribe({
      next: (res) => {
        this.posts = res.data.posts;
        this.selectedCategory = null; // clear highlight
        this.searchTermDisplay = query; // Hiển thị từ khóa tìm kiếm
      },
      error: (err) => console.error('Search error:', err),
    });
    this.saveToRecentSearches(query); // Lưu từ khóa tìm kiếm vào danh sách gần đây
  }

  // Hàm để tải danh sách tìm kiếm gần đây từ localStorage
  loadRecentSearches(): void {
    if (this.isBrowser) {
      const stored = localStorage.getItem('recentSearches');
      if (stored) {
        this.recentSearches = JSON.parse(stored);
      }
    }
  }

  // Hàm để thêm từ khóa tìm kiếm vào danh sách tìm kiếm gần đây
  saveToRecentSearches(term: string): void {
    if (!term.trim()) return;

    if (this.isBrowser) {
      // Tránh trùng lặp
      const exists = this.recentSearches.includes(term);
      if (!exists) {
        this.recentSearches.unshift(term);
        // Giới hạn số lượng
        if (this.recentSearches.length > 5) {
          this.recentSearches = this.recentSearches.slice(0, 5);
        }
        // Lưu localStorage nếu muốn nhớ khi refresh
        localStorage.setItem(
          'recentSearches',
          JSON.stringify(this.recentSearches)
        );
      }
    }
  }

  onSearchFocus(): void {
    if (!this.searchQuery.trim()) {
      this.showRecentSearches = true;
    }
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
    this.recentSearches = this.recentSearches.filter((t) => t !== term);
    if (this.isBrowser) {
      localStorage.setItem(
        'recentSearches',
        JSON.stringify(this.recentSearches)
      );
    }
  }

  // Hàm để đăng xuất
  logout(): void {
    if (this.isBrowser) {
      localStorage.removeItem('accessToken');
    }
    this.router.navigate(['/auth/login']);
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
}
