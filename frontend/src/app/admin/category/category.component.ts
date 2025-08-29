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
import { RouterModule, Router, ActivatedRoute } from '@angular/router';

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
  limit = 5;
  deleteTarget: Category | null = null; // category chờ xác nhận xóa
  // Lưu giá trị trùng lặp cuối cùng để chỉ clear khi user đổi sang chuỗi khác
  private lastDuplicateValue: string | null = null;

  constructor(
    private fb: FormBuilder,
    private categoryService: CategoryService,
    private route: ActivatedRoute,
    private router: Router
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

    // Clear duplicate error when user changes the value after a duplicate was flagged
    const nameCtrl = this.categoryForm.get('categoryname');
    nameCtrl?.valueChanges.subscribe((val) => {
      const ctrl = this.categoryForm.get('categoryname');
      if (!ctrl) return;
      if (ctrl.errors?.['duplicate']) {
        const current = (val || '').trim().toLowerCase();
        const original = (this.lastDuplicateValue || '').toLowerCase();
        if (current !== original) {
          const { duplicate, ...rest } = ctrl.errors as any;
          ctrl.setErrors(Object.keys(rest).length ? rest : null);
        }
      }
    });
  }

  ngAfterViewInit(): void {
    // Kích hoạt tooltip khi DOM sẵn sàng (AdminLTE/Bootstrap4 đã nạp ở layout)
    if (typeof $ === 'function') {
      $('[data-toggle="tooltip"]').tooltip();
    }
  }

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((q) => {
      const pageParam = Number(q.get('page'));
      const limitParam = Number(q.get('limit'));
      const kw = q.get('keyword');

      if (pageParam > 0) this.currentPage = pageParam;
      if (limitParam > 0) this.limit = limitParam;
      if (kw !== null) {
        this.searchForm.get('keyword')?.setValue(kw);
      }
      this.loadCategories(this.currentPage);
    });
  }

  // Lấy danh sách category có phân trang và tìm kiếm
  loadCategories(page: number = 1): void {
    const keyword = this.searchForm.get('keyword')?.value || '';
    this.categoryService.getAllCategories(keyword, page, this.limit).subscribe({
      next: (data) => {
        this.categories = data.categories;
        this.currentPage = data.page;
        this.totalPages = data.totalPages;
        this.totalItems = data.total;
        this.errorMsg = '';
        this.updateRouteQuery();
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

  private updateRouteQuery(): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        page: this.currentPage !== 1 ? this.currentPage : undefined,
        limit: this.limit !== 5 ? this.limit : undefined,
        keyword:
          (this.searchForm.get('keyword')?.value || '').trim() || undefined,
      },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
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
    // Clear possible duplicate error state explicitly
    const ctrl = this.categoryForm.get('categoryname');
    ctrl?.setErrors(null);
    (window as any).$('#categoryModal').modal('show');
  }

  // Hiện modal sửa
  onEdit(category: Category): void {
    this.isEditing = true;
    this.selectedCategory = category;
    this.categoryForm.patchValue({
      categoryname: category.categoryname,
    });
    const ctrl = this.categoryForm.get('categoryname');
    ctrl?.setErrors(null);
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
        if (!this.isEditing) {
          this.currentPage = 1;
        }
        this.loadCategories(this.currentPage);
        (window as any).$('#categoryModal').modal('hide');
      },
      error: (err) => {
        const ctrl = this.categoryForm.get('categoryname');
        if (!ctrl) return;
        const msg: string =
          err?.error?.message ||
          err?.error?.data?.message ||
          err?.message ||
          '';

        let handled = false;

        // Check structured errors array
        const errorsArr = err?.error?.data?.errors;
        if (Array.isArray(errorsArr)) {
          const catErr = errorsArr.find(
            (e: any) => e?.field === 'categoryname'
          );
          if (catErr) {
            const m = (catErr.message || '').toLowerCase();
            if (
              m.includes('unique') ||
              m.includes('already') ||
              m.includes('exist')
            ) {
              ctrl.setErrors({ duplicate: true });
              this.lastDuplicateValue = (ctrl.value || '').trim();
              handled = true;
            } else if (m.includes('required') || m.includes('empty')) {
              ctrl.setErrors({ required: true });
              handled = true;
            }
          }
        }

        // Fallback pattern matching on raw message
        if (!handled) {
          const lower = msg.toLowerCase();
          if (
            lower.includes('already exists') ||
            lower.includes('must be unique') ||
            lower.includes('unique constraint') ||
            lower.includes('categoryname must be unique')
          ) {
            ctrl.setErrors({ duplicate: true });
            this.lastDuplicateValue = (ctrl.value || '').trim();
            handled = true;
          } else if (lower.includes('required')) {
            ctrl.setErrors({ required: true });
            handled = true;
          }
        }

        if (!handled) {
          ctrl.setErrors({ server: true });
        }

        ctrl.markAsTouched();
        ctrl.markAsDirty();
      },
    });
  }
  // Xóa category
  onDelete(id: number): void {
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
