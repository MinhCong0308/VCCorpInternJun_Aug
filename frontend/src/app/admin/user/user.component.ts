import { CommonModule } from '@angular/common';
import { Component, OnInit, AfterViewInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import {
  AdminUser,
  PaginatedUserResponse,
  UserService,
} from '../../core/services/user.service';

declare const $: any;

@Component({
  selector: 'app-user',
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.css'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
})
export class UserComponent implements OnInit, AfterViewInit {
  searchForm: FormGroup;
  userForm: FormGroup;
  users: AdminUser[] = [];
  keyword = '';
  status: '' | number = '';
  role: '' | number = '';
  errorMsg = '';
  currentPage = 1;
  totalPages = 0;
  totalItems = 0;
  limit = 5;
  private apiBase = 'http://localhost:3000';
  avatarPreview: string | null = null; // data URL preview for new user form

  confirmModal: {
    action: 'role' | 'status' | null;
    user: AdminUser | null;
    title: string;
    message: string;
    btnClass: string;
  } = {
    action: null,
    user: null,
    title: '',
    message: '',
    btnClass: 'btn-primary',
  };

  constructor(
    private fb: FormBuilder,
    private service: UserService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.searchForm = this.fb.group({
      keyword: [''],
      status: [''],
      role: [''],
    });
    this.userForm = this.fb.group({
      firstname: [
        '',
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(50),
        ],
      ],
      lastname: [
        '',
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(50),
        ],
      ],
      username: [
        '',
        [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(30),
        ],
      ],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      roleid: [1, Validators.required],
      status: [1, Validators.required],
      avatar: [null, Validators.required],
    });
  }

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((q) => {
      const limitParam = Number(q.get('limit'));
      const pageParam = Number(q.get('page'));
      const kw = q.get('keyword');
      const stParam = q.get('status');
      const roleParam = q.get('role');

      if (limitParam > 0) this.limit = limitParam;
      if (pageParam > 0) this.currentPage = pageParam;
      if (kw !== null) {
        this.searchForm.get('keyword')?.setValue(kw);
      }
      if (stParam !== null && stParam !== '') {
        const stNum = Number(stParam);
        this.searchForm.get('status')?.setValue(stNum);
        this.status = stNum;
      }
      if (roleParam !== null && roleParam !== '') {
        const roleNum = Number(roleParam);
        if (!isNaN(roleNum)) {
          this.searchForm.get('role')?.setValue(roleNum);
          this.role = roleNum;
        }
      }
      this.loadUsers(this.currentPage);
    });
  }

  ngAfterViewInit(): void {
    if (typeof $ === 'function') {
      $('[data-toggle="tooltip"]').tooltip();
      // Reset form when modal is hidden
      $('#addUserModal').on('hidden.bs.modal', () => {
        this.userForm.reset({ roleid: 1, status: 1, avatar: null });
        this.errorMsg = '';
      });
    }
  }

  loadUsers(page: number = 1): void {
    const kw = (
      this.searchForm.get('keyword')?.value ||
      this.keyword ||
      ''
    ).trim();
    const stRaw = this.searchForm.get('status')?.value;
    const roleRaw = this.searchForm.get('role')?.value;
    const st = stRaw === '' || stRaw == null ? '' : Number(stRaw);
    this.status = st === '' ? '' : st;
    const rl = roleRaw === '' || roleRaw == null ? '' : Number(roleRaw);
    this.role = rl === '' ? '' : rl;
    // BUG FIX: previously passed (kw, page, status, limit) so limit was misinterpreted as role.
    this.service
      .getAllUsers(kw, page, this.status, this.role, this.limit)
      .subscribe({
        next: (res: PaginatedUserResponse) => {
          this.users = res.user;
          this.currentPage = res.page;
          this.totalPages = res.totalPages;
          this.totalItems = res.total;
          this.errorMsg = '';
          this.updateRouteQuery();
        },
        error: (err) => {
          this.errorMsg = err?.error?.message || 'Failed to load users.';
        },
      });
  }

  onSearch(event?: Event): void {
    if (event) event.preventDefault();
    this.keyword = (this.searchForm.get('keyword')?.value || '').trim();
    this.currentPage = 1;
    this.loadUsers(1);
  }

  onPageChange(page: number): void {
    if (page >= 1 && page <= this.totalPages) this.loadUsers(page);
  }
  onPageSizeChange(raw: string): void {
    const newSize = Number(raw);
    if (!newSize || newSize <= 0 || newSize === this.limit) return;
    this.limit = newSize;
    this.currentPage = 1;
    this.loadUsers(1);
  }

  private updateRouteQuery(): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        limit: this.limit,
        page: this.currentPage,
        keyword:
          (this.searchForm.get('keyword')?.value || '').trim() || undefined,
        status: this.status !== '' ? this.status : undefined,
        role: this.role !== '' ? this.role : undefined,
      },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  getPagesArray(): number[] {
    return Array(this.totalPages)
      .fill(0)
      .map((_, i) => i + 1);
  }

  avatarUrl(path: string): string {
    if (!path) return `${this.apiBase}/uploads/avatars/default.png`;
    if (/^https?:\/\//i.test(path)) return path;
    const fixed = path.startsWith('/') ? path : `/${path}`;
    return `${this.apiBase}${fixed}`;
  }

  onToggleStatus(u: AdminUser): void {
    const req$ =
      u.status === 1
        ? this.service.disableUser(u.userid)
        : this.service.enableUser(u.userid);
    req$.subscribe({
      next: () => this.loadUsers(this.currentPage),
      error: (err) =>
        (this.errorMsg = err?.error?.message || 'Failed to update status.'),
    });
  }

  onChangeRole(u: AdminUser): void {
    const newRole = u.roleid === 2 ? 1 : 2; // 1: user, 2: admin
    this.service.changeUserRole(u.userid, newRole).subscribe({
      next: () => this.loadUsers(this.currentPage),
      error: (err) =>
        (this.errorMsg = err?.error?.message || 'Failed to change role.'),
    });
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length) {
      const file = input.files[0];
      // Validate type
      if (!file.type.startsWith('image/')) {
        this.errorMsg = 'Avatar file must be an image.';
        input.value = '';
        this.userForm.patchValue({ avatar: null });
        this.avatarPreview = null;
        return;
      }
      // Validate size < 2MB
      const maxBytes = 2 * 1024 * 1024;
      if (file.size > maxBytes) {
        this.errorMsg = 'Avatar must be smaller than 2MB.';
        input.value = '';
        this.userForm.patchValue({ avatar: null });
        this.avatarPreview = null;
        return;
      }
      this.errorMsg = '';
      this.userForm.patchValue({ avatar: file });
      this.userForm.get('avatar')?.updateValueAndValidity();
      const reader = new FileReader();
      reader.onload = () => (this.avatarPreview = reader.result as string);
      reader.readAsDataURL(file);
    }
  }

  onCreateUser(): void {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }

    this.errorMsg = '';
    const payload = this.userForm.value;

    this.service.createUser(payload).subscribe({
      next: () => {
        if (typeof $ === 'function') $('#addUserModal').modal('hide');
        // Reset is handled by modal hidden event
        this.loadUsers(this.currentPage);
        this.avatarPreview = null;
      },
      error: (err) => {
        const server = err?.error || {};
        const statusCode = err?.status;
        // 1. Handle validation middleware errors (422)
        const validationErrors = server?.data?.errors;
        if (statusCode === 422 && Array.isArray(validationErrors)) {
          validationErrors.forEach((ve: any) => {
            // backend uses field names: firstname, lastname, username, hashed_password, email
            let field = ve.field;
            if (field === 'hashed_password') field = 'password';
            const ctrl = this.userForm.get(field);
            if (!ctrl) return;
            const existing = ctrl.errors || {};
            // map duplicate email message to duplicate flag for consistency
            if (field === 'email' && /unique|exists/i.test(ve.message)) {
              ctrl.setErrors({ ...existing, duplicate: true });
            } else {
              ctrl.setErrors({ ...existing, server: ve.message });
            }
            ctrl.markAsTouched();
          });
          return;
        }

        if (server.field === 'email') {
          const emailCtrl = this.userForm.get('email');
          emailCtrl?.setErrors({
            ...(emailCtrl?.errors || {}),
            duplicate: true,
          });
          emailCtrl?.markAsTouched();
          this.errorMsg = '';
          return;
        }

        this.errorMsg = server.message || 'Failed to create user.';
      },
    });
  }

  openConfirm(user: AdminUser, action: 'role' | 'status'): void {
    this.confirmModal.user = user;
    this.confirmModal.action = action;
    if (action === 'role') {
      const targetRole = user.roleid === 2 ? 'User' : 'Admin';
      this.confirmModal.title = 'Confirm Role Change';
      this.confirmModal.message = `Change role of "${user.username}" to ${targetRole}?`;
      this.confirmModal.btnClass = 'btn-info';
    } else {
      const willDisable = user.status === 1;
      this.confirmModal.title = willDisable
        ? 'Confirm Disable'
        : 'Confirm Enable';
      this.confirmModal.message = `${
        willDisable ? 'Disable' : 'Enable'
      } user "${user.username}"?`;
      this.confirmModal.btnClass = willDisable ? 'btn-warning' : 'btn-success';
    }
    if (typeof $ === 'function') {
      $('#userActionModal').modal('show');
    }
  }

  confirmAction(): void {
    const { action, user } = this.confirmModal;
    if (!action || !user) return;
    if (action === 'role') {
      this.onChangeRole(user);
    } else if (action === 'status') {
      this.onToggleStatus(user);
    }
    if (typeof $ === 'function') {
      $('#userActionModal').modal('hide');
    }
    setTimeout(() => {
      this.confirmModal = {
        action: null,
        user: null,
        title: '',
        message: '',
        btnClass: 'btn-primary',
      };
    }, 300);
  }
}
