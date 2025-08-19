import { CommonModule } from '@angular/common';
import { Component, OnInit, AfterViewInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
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
  users: AdminUser[] = [];
  keyword = '';
  errorMsg = '';
  currentPage = 1;
  totalPages = 0;
  totalItems = 0;
  private apiBase = 'http://localhost:3000';

  constructor(private fb: FormBuilder, private service: UserService) {
    this.searchForm = this.fb.group({ keyword: [''] });
  }

  ngOnInit(): void {
    this.loadUsers();
  }

  ngAfterViewInit(): void {
    if (typeof $ === 'function') {
      $('[data-toggle="tooltip"]').tooltip();
    }
  }

  loadUsers(page: number = 1): void {
    const kw = (
      this.searchForm.get('keyword')?.value ||
      this.keyword ||
      ''
    ).trim();
    this.service.getAllUsers(kw, page).subscribe({
      next: (res: PaginatedUserResponse) => {
        this.users = res.user;
        this.currentPage = res.page;
        this.totalPages = res.totalPages;
        this.totalItems = res.total;
        this.errorMsg = '';
      },
      error: (err) => {
        this.errorMsg = err?.error?.message || 'Failed to load users.';
      },
    });
  }

  onSearch(event?: Event, value?: string): void {
    if (event) event.preventDefault();
    if (typeof value === 'string') {
      this.keyword = value;
      this.searchForm.get('keyword')?.setValue(value);
    }
    this.currentPage = 1;
    this.loadUsers(1);
  }

  onPageChange(page: number): void {
    if (page >= 1 && page <= this.totalPages) this.loadUsers(page);
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

  onCreateUser(event: Event): void {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);
    const firstname = String(formData.get('firstname') || '').trim();
    const lastname = String(formData.get('lastname') || '').trim();
    const username = String(formData.get('account_username') || '').trim();
    const email = String(formData.get('email') || '').trim();
    const password = String(formData.get('plain_password') || '').trim();
    const roleid = Number(formData.get('roleid') || 1);
    const avatar = formData.get('avatar') as File | null;

    if (!avatar) {
      this.errorMsg = 'Avatar image is required.';
      return;
    }

    this.service
      .createUser({
        firstname,
        lastname,
        username,
        email,
        password,
        roleid,
        avatar,
      })
      .subscribe({
        next: () => {
          // close modal and refresh list
          if (typeof $ === 'function') {
            $('#addUserModal').modal('hide');
          }
          form.reset();
          this.loadUsers(this.currentPage);
        },
        error: (err) => {
          this.errorMsg = err?.error?.message || 'Failed to create user.';
        },
      });
  }
}
