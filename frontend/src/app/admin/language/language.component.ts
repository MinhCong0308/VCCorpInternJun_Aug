import { AfterViewInit, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import {
  LanguageService,
  Language,
  PaginatedLanguageResponse,
} from '../../core/services/language.service';

declare const $: any;

@Component({
  selector: 'app-language',
  templateUrl: './language.component.html',
  styleUrls: ['./language.component.css'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
})
export class LanguageComponent implements OnInit, AfterViewInit {
  searchForm: FormGroup;
  languageForm: FormGroup;
  isEditing = false;
  selected: Language | null = null;
  languages: Language[] = [];
  errorMsg = '';
  keyword = '';
  statusFilter: '' | 0 | 1 = '';
  currentPage = 1;
  totalPages = 0;
  totalItems = 0;
  limit = 5;
  private apiBase = 'http://localhost:3000';

  private selectedFlagFile: File | null = null;

  confirmModal: {
    action: 'status' | 'delete' | null;
    lang: Language | null;
    title: string;
    message: string;
    btnClass: string;
  } = {
    action: null,
    lang: null,
    title: '',
    message: '',
    btnClass: 'btn-primary',
  };

  constructor(
    private fb: FormBuilder,
    private service: LanguageService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.searchForm = this.fb.group({ keyword: [''], status: [''] });
    this.languageForm = this.fb.group({
      languagename: [
        '',
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(50),
        ],
      ],
      locale_code: ['', [Validators.required, Validators.maxLength(10)]],
      status: [true],
      is_default: [false],
      flag_image: [null], // file input holder
    });
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
      this.loadLanguages(this.currentPage);
    });
  }

  ngAfterViewInit(): void {
    if (typeof $ === 'function') {
      $('[data-toggle="tooltip"]').tooltip();
    }
  }

  loadLanguages(page: number = 1): void {
    const kw = (
      this.searchForm.get('keyword')?.value ||
      this.keyword ||
      ''
    ).trim();
    const statRaw = this.searchForm.get('status')?.value;
    const statusFilter = statRaw === '' ? '' : (Number(statRaw) as 0 | 1);
    this.statusFilter = statusFilter;
    this.service
      .getAllLanguagesAdmin(kw, page, statusFilter, this.limit)
      .subscribe({
        next: (res: PaginatedLanguageResponse) => {
          this.languages = res.languages;
          this.currentPage = res.page;
          this.totalPages = res.totalPages;
          this.totalItems = res.total;
          this.errorMsg = '';
          this.updateRouteQuery();
        },
        error: (err) => {
          this.errorMsg = err?.error?.message || 'Failed to load languages.';
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
    this.loadLanguages(1);
  }

  onPageChange(page: number): void {
    if (page >= 1 && page <= this.totalPages) this.loadLanguages(page);
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

  getPagesArray(): number[] {
    return Array(this.totalPages)
      .fill(0)
      .map((_, i) => i + 1);
  }

  openAddModal(): void {
    this.isEditing = false;
    this.selected = null;
    this.selectedFlagFile = null;
    this.errorMsg = ''; // Clear any previous errors
    this.languageForm.reset({
      languagename: '',
      locale_code: '',
      status: true,
      is_default: false,
      flag_image: null,
    });
    (window as any).$('#addLanguageModal').modal('show');
  }

  openEditModal(lang: Language): void {
    this.isEditing = true;
    this.selected = lang;
    this.selectedFlagFile = null;
    this.errorMsg = ''; // Clear any previous errors
    this.languageForm.patchValue({
      languagename: lang.languagename,
      locale_code: lang.locale_code,
      status: !!lang.status,
      is_default: !!lang.is_default,
      flag_image: null,
    });
    (window as any).$('#editLanguageModal').modal('show');
  }

  onFileChange(event: any): void {
    const file: File | null = event?.target?.files?.[0] || null;
    this.selectedFlagFile = file;
  }

  onSubmitAdd(): void {
    if (this.languageForm.invalid) return;

    this.errorMsg = ''; // Clear previous errors
    this.clearFormErrors();

    const values = this.languageForm.value;
    const formData = new FormData();
    formData.append('languagename', values.languagename);
    formData.append('locale_code', values.locale_code);
    formData.append('status', values.status ? '1' : '0');
    if (values.is_default != null)
      formData.append('is_default', values.is_default ? '1' : '0');

    if (this.selectedFlagFile) {
      formData.append('flag_image', this.selectedFlagFile);
    }

    this.service.createLanguage(formData).subscribe({
      next: () => {
        this.currentPage = 1;
        this.loadLanguages(1);
        (window as any).$('#addLanguageModal').modal('hide');
        this.languageForm.reset();
        this.selectedFlagFile = null;
        this.errorMsg = ''; // Clear errors on success
      },
      error: (err) => {
        console.log('Error creating language:', err); // Debug log
        // Trường hợp 422 validation từ express-validator
        if (this.handleValidationErrors(err)) {
          this.errorMsg = '';
          return;
        }
        const server = err?.error || {};
        const msg =
          server.message || err?.message || 'Failed to create language.';
        // Prefer field info from server
        if (server.field) {
          if (server.field === 'languagename') {
            this.languageForm.get('languagename')?.setErrors({
              ...(this.languageForm.get('languagename')?.errors || {}),
              duplicate: true,
            });
          }
          if (server.field === 'locale_code') {
            this.languageForm.get('locale_code')?.setErrors({
              ...(this.languageForm.get('locale_code')?.errors || {}),
              duplicate: true,
            });
          }
          this.errorMsg = '';
          return;
        }
        const handled = this.applyServerFieldErrors(msg);
        this.errorMsg = handled ? '' : msg;
      },
    });
  }

  onSubmitEdit(): void {
    if (this.languageForm.invalid || !this.selected) return;
    const values = this.languageForm.value;
    const formData = new FormData();
    formData.append('languagename', values.languagename);
    formData.append('locale_code', values.locale_code);
    formData.append('status', values.status ? '1' : '0');
    if (values.is_default != null)
      formData.append('is_default', values.is_default ? '1' : '0');
    if (this.selectedFlagFile)
      formData.append('flag_image', this.selectedFlagFile);

    // Clear previous errors
    this.errorMsg = '';
    this.clearFormErrors();

    // Prevent disabling default directly
    if (this.selected.is_default && !values.status) {
      this.errorMsg =
        'Cannot disable default language. Default language must remain active.';
      return;
    }

    // Prevent removing default status
    if (this.selected.is_default && !values.is_default) {
      this.errorMsg =
        'Cannot remove default language status. There must always be one default language in the system.';
      return;
    }

    this.service.updateLanguage(this.selected.languageid, formData).subscribe({
      next: () => {
        this.loadLanguages(this.currentPage);
        (window as any).$('#editLanguageModal').modal('hide');
        this.selectedFlagFile = null;
        this.errorMsg = ''; // Clear errors on success
      },
      error: (err) => {
        console.log('Error updating language:', err); // Debug log
        if (this.handleValidationErrors(err)) {
          this.errorMsg = '';
          return;
        }
        const msg =
          err?.error?.message || err?.message || 'Failed to update language.';
        const handled = this.applyServerFieldErrors(msg);
        this.errorMsg = handled ? '' : msg;
      },
    });
  }

  onToggleStatus(lang: Language): void {
    if (lang.is_default && lang.status) {
      this.errorMsg =
        'Cannot disable default language. Default language must remain active.';
      return;
    }

    this.errorMsg = ''; // Clear previous errors
    const req$ = lang.status
      ? this.service.disableLanguage(lang.languageid)
      : this.service.enableLanguage(lang.languageid);
    req$.subscribe({
      next: () => {
        this.loadLanguages(this.currentPage);
        this.errorMsg = ''; // Clear any errors on success
      },
      error: (err) => {
        const message = err?.error?.message || 'Failed to update status.';
        if (/cannot disable default language/i.test(message)) {
          this.errorMsg =
            'Cannot disable default language. Default language must remain active.';
        } else {
          this.errorMsg = `Failed to ${
            lang.status ? 'disable' : 'enable'
          } language. ${message}`;
        }
      },
    });
  }

  // Delete removed (backend not supported)
  onDelete(id: number): void {
    return;
  }

  flagUrl(path: string): string {
    if (!path) return '/assets/img/logo.png';
    if (/^https?:\/\//i.test(path)) return path;
    const fixed = path.startsWith('/') ? path : `/${path}`;
    return `${this.apiBase}${fixed}`;
  }

  openConfirm(lang: Language | null, action: 'status' | 'delete'): void {
    if (!lang) return;
    this.confirmModal.lang = lang;
    this.confirmModal.action = action;
    if (action === 'status') {
      const willDisable = !!lang.status;
      this.confirmModal.title = willDisable
        ? 'Confirm Disable'
        : 'Confirm Enable';
      this.confirmModal.message = `${
        willDisable ? 'Disable' : 'Enable'
      } language "${lang.languagename}"?`;
      this.confirmModal.btnClass = willDisable ? 'btn-warning' : 'btn-success';
    } else {
      // delete path removed
      return;
    }
    if (typeof $ === 'function') {
      $('#languageActionModal').modal('show');
    }
  }

  confirmAction(): void {
    const { action, lang } = this.confirmModal;
    if (!action || !lang) return;
    if (action === 'status') {
      this.onToggleStatus(lang);
    }
    if (typeof $ === 'function') {
      $('#languageActionModal').modal('hide');
    }
    setTimeout(() => {
      this.confirmModal = {
        action: null,
        lang: null,
        title: '',
        message: '',
        btnClass: 'btn-primary',
      };
    }, 300);
  }

  private clearFormErrors(): void {
    // Clear custom errors but keep validation errors
    const controls = ['languagename', 'locale_code', 'status', 'is_default'];
    controls.forEach((controlName) => {
      const control = this.languageForm.get(controlName);
      if (control?.errors) {
        const { duplicate, defaultLock, cannotRemove, ...validationErrors } =
          control.errors;
        control.setErrors(
          Object.keys(validationErrors).length > 0 ? validationErrors : null
        );
      }
    });
  }

  private applyServerFieldErrors(msg: string): boolean {
    const nameCtrl = this.languageForm.get('languagename');
    const localeCtrl = this.languageForm.get('locale_code');
    let handled = false;

    // Apply field-specific errors without overriding this.errorMsg
    if (
      /language name.*already exists/i.test(msg) ||
      /languagename.*must be unique/i.test(msg)
    ) {
      nameCtrl?.setErrors({ ...(nameCtrl.errors || {}), duplicate: true });
      nameCtrl?.markAsTouched();
      handled = true;
    }
    if (
      /locale code.*already exists/i.test(msg) ||
      /locale_code.*must be unique/i.test(msg)
    ) {
      localeCtrl?.setErrors({ ...(localeCtrl.errors || {}), duplicate: true });
      localeCtrl?.markAsTouched();
      handled = true;
    }
    if (/cannot disable default language/i.test(msg)) {
      const statusCtrl = this.languageForm.get('status');
      statusCtrl?.setErrors({
        ...(statusCtrl?.errors || {}),
        defaultLock: true,
      });
      handled = true;
    }
    if (/cannot remove default language/i.test(msg)) {
      const defaultCtrl = this.languageForm.get('is_default');
      defaultCtrl?.setErrors({
        ...(defaultCtrl?.errors || {}),
        cannotRemove: true,
      });
      handled = true;
    }
    // Keep the original server message in this.errorMsg for display
    return handled;
  }

  private handleValidationErrors(err: any): boolean {
    if (err?.status !== 422) return false;
    const errors = err?.error?.data?.errors;
    if (!Array.isArray(errors)) return false;
    let handled = false;
    errors.forEach((e: any) => {
      const field = e.field;
      const message = e.message || '';
      const control = this.languageForm.get(field);
      if (!control) return;
      if (/must be required/i.test(message) || /required/i.test(message)) {
        control.setErrors({ ...(control.errors || {}), required: true });
        handled = true;
      }
      if (/must be text/i.test(message)) {
        control.setErrors({ ...(control.errors || {}), type: true });
        handled = true;
      }
      if (/must be unique/i.test(message)) {
        control.setErrors({ ...(control.errors || {}), duplicate: true });
        handled = true;
      }
      if (/must be at least/i.test(message)) {
        control.setErrors({ ...(control.errors || {}), minlength: true });
        handled = true;
      }
      if (/must be at most/i.test(message)) {
        control.setErrors({ ...(control.errors || {}), maxlength: true });
        handled = true;
      }
      control.markAsTouched();
    });
    return handled;
  }
}
