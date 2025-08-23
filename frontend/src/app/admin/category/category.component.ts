import {
  AfterViewInit,
  Component,
  OnInit,
  ViewEncapsulation,
} from '@angular/core';
import { CommonModule, NgFor, NgIf } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import {
  CategoryService,
  Category,
} from '../../core/services/category.service';
import { RouterModule } from '@angular/router';

declare const $: any; // dùng cho tooltip Bootstrap 4

@Component({
  selector: 'app-category',
  templateUrl: './category.component.html',
  styleUrls: ['./category.component.css'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, NgFor, NgIf],
})
export class CategoryComponent implements OnInit, AfterViewInit {
  categories: Category[] = [];
  searchForm: FormGroup;
  categoryForm: FormGroup;
  isEditing = false;
  selectedCategory: Category | null = null;
  errorMsg = '';
  currentPage = 1;
  totalPages = 0;
  totalItems = 0;
  deleteTarget: Category | null = null; // category chờ xác nhận xóa

  constructor(
    private fb: FormBuilder,
    private categoryService: CategoryService
  ) {
    this.searchForm = this.fb.group({
      keyword: [''],
    });
    this.categoryForm = this.fb.group({
      categoryname: [
        '',
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(250),
        ],
      ],
    });
  }

  ngAfterViewInit(): void {
    // Kích hoạt tooltip khi DOM sẵn sàng (AdminLTE/Bootstrap4 đã nạp ở layout)
    if (typeof $ === 'function') {
      $('[data-toggle="tooltip"]').tooltip();
    }
  }

  ngOnInit(): void {
    this.loadCategories();
  }

  // Lấy danh sách category có phân trang và tìm kiếm
  loadCategories(page: number = 1): void {
    const keyword = this.searchForm.get('keyword')?.value || '';
    this.categoryService.getAllCategories(keyword, page).subscribe({
      next: (data) => {
        this.categories = data.categories;
        this.currentPage = data.page;
        this.totalPages = data.totalPages;
        this.totalItems = data.total;
        this.errorMsg = '';
      },
      error: (err) => {
        this.errorMsg = 'Failed to load categories.';
      },
    });
  }

  // Tìm kiếm category
  onSearch(): void {
    this.currentPage = 1;
    this.loadCategories(1);
  }

  // Chuyển trang
  onPageChange(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.loadCategories(page);
    }
  }

  // Tạo mảng số trang cho phân trang
  getPagesArray(): number[] {
    return Array(this.totalPages)
      .fill(0)
      .map((_, i) => i + 1);
  }

  // Hiện modal thêm mới
  onAddNew(): void {
    this.isEditing = false;
    this.selectedCategory = null;
    this.categoryForm.reset();
    (window as any).$('#categoryModal').modal('show');
  }

  // Hiện modal sửa
  onEdit(category: Category): void {
    this.isEditing = true;
    this.selectedCategory = category;
    this.categoryForm.patchValue({
      categoryname: category.categoryname,
    });
    (window as any).$('#categoryModal').modal('show');
  }

  // Thêm mới hoặc cập nhật category
  onSubmit(): void {
    if (this.categoryForm.invalid) return;
    const categoryData = {
      categoryname: this.categoryForm.value.categoryname,
    };
    let action$;
    if (this.isEditing && this.selectedCategory) {
      action$ = this.categoryService.updateCategory(
        this.selectedCategory.categoryid,
        categoryData
      );
    } else {
      action$ = this.categoryService.createCategory(categoryData);
    }
    action$.subscribe({
      next: () => {
        // Nếu thêm mới thì về trang 1, nếu sửa thì giữ nguyên trang
        if (!this.isEditing) {
          this.currentPage = 1;
        }
        this.loadCategories(this.currentPage);
        (window as any).$('#categoryModal').modal('hide');
      },
      error: (err) => {
        const msg = err?.error?.message || 'Operation failed.';
        this.errorMsg = msg;
        if (msg.toLowerCase().includes('already exists')) {
          const ctrl = this.categoryForm.get('categoryname');
          ctrl?.setErrors({ ...(ctrl.errors || {}), duplicate: true });
          ctrl?.markAsTouched();
        }
      },
    });
  }

  // Xóa category
  onDelete(id: number): void {
    // Kept for backward compatibility (could be removed). Use modal instead.
    this.openDeleteConfirm(
      this.categories.find((c) => c.categoryid === id) || null
    );
  }

  openDeleteConfirm(category: Category | null): void {
    this.deleteTarget = category;
    if (typeof $ === 'function') {
      $('#confirmDeleteModal').modal('show');
    } else {
      // Fallback if jQuery not available
      if (category && confirm(`Delete category "${category.categoryname}"?`)) {
        this.performDelete(category.categoryid);
      }
    }
  }

  confirmDelete(): void {
    if (!this.deleteTarget) return;
    this.performDelete(this.deleteTarget.categoryid);
    if (typeof $ === 'function') {
      $('#confirmDeleteModal').modal('hide');
    }
    setTimeout(() => (this.deleteTarget = null), 300);
  }

  private performDelete(id: number): void {
    this.categoryService.deleteCategory(id).subscribe({
      next: () => {
        if (this.categories.length === 1 && this.currentPage > 1) {
          this.currentPage--;
        }
        this.loadCategories(this.currentPage);
      },
      error: (err) => {
        this.errorMsg = err?.error?.message || 'Delete failed.';
      },
    });
  }
}
