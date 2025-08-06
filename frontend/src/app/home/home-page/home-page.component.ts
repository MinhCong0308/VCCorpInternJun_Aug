import { Component, OnInit } from '@angular/core';
import { CategoryService } from '../../core/services/category.service';
import { PostService } from '../../core/services/post.service';

@Component({
  selector: 'app-home-page',
  templateUrl: './home-page.component.html',
  styleUrls: ['./home-page.component.css'],
  standalone: false,
})
export class HomePageComponent implements OnInit {
  categories: any[] = [];
  selectedCategory: any = 'latest'; // Biến theo dõi category đang chọn
  posts: any[] = []; // Biến để lưu trữ bài viết
  searchQuery: string = ''; // Biến để lưu trữ từ khóa tìm kiếm
  searchTermDisplay: string | null = null; // Biến để hiển thị từ khóa tìm kiếm

  constructor(
    private categoryService: CategoryService,
    private postService: PostService
  ) {}

  ngOnInit(): void {
    this.categoryService.getCategories().subscribe({
      next: (res: any) => {
        const staticTabs = [
          { categoryid: 'latest', categoryname: 'Latest' },
          { categoryid: 'trending', categoryname: 'Trending' }
        ];
        this.categories = [...staticTabs, ...res];
      },
      error: (err) => console.error('Failed to fetch categories', err)
    });
    this.loadPosts(); // Mặc định là Latest
  }

  // Hàm để xử lý sự kiện khi người dùng chọn một category
  selectCategory(id: any): void {
    this.selectedCategory = id;
    this.searchTermDisplay = null; // Clear search term display khi chọn category mới
    this.loadPosts();
  }

  // Hàm để tải bài viết dựa trên category đã chọn
  loadPosts(): void {
    if (this.selectedCategory === 'latest') {
      this.postService.getPublishedPosts().subscribe(res => {
        this.posts = res?.data?.posts || [];
      });
    } else if (this.selectedCategory === 'trending') {
      this.postService.getPublishedPostsTrending().subscribe(res => {
        this.posts = res?.data?.posts || [];
      });
    } else {
      this.postService.getPostsByCategory(this.selectedCategory).subscribe(res => {
        this.posts = res?.data?.posts || [];
      });
    }
  }

  // Hàm để xử lý tìm kiếm bài viết
  onSearch(): void {
    const query = this.searchQuery.trim();
    if (!query) {
      // Nếu không nhập gì: reset danh sách và searchQuery
      this.searchTermDisplay = null; // Clear search term display
      this.selectedCategory = 'latest'; // Reset về Latest
      this.searchQuery = ''; // Clear search input
      this.loadPosts(); // Tải lại bài viết theo category đã chọn
      return;
    };

    this.postService.searchPosts(query).subscribe({
      next: (res) => {
        this.posts = res.data.posts;
        this.selectedCategory = null; // clear highlight
        this.searchTermDisplay = query; // Hiển thị từ khóa tìm kiếm
      },
      error: (err) => console.error('Search error:', err)
    });
  }

}
