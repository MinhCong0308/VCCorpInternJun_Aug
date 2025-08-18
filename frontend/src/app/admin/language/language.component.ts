import { AfterViewInit, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { RouterModule } from '@angular/router';
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
  currentPage = 1;
  totalPages = 0;
  totalItems = 0;
  private apiBase = 'http://localhost:3000';

  private selectedFlagFile: File | null = null;

  constructor(private fb: FormBuilder, private service: LanguageService) {
    this.searchForm = this.fb.group({ keyword: [''] });
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
    this.loadLanguages();
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
    this.service.getAllLanguagesAdmin(kw, page).subscribe({
      next: (res: PaginatedLanguageResponse) => {
        this.languages = res.languages;
        this.currentPage = res.page;
        this.totalPages = res.totalPages;
        this.totalItems = res.total;
        this.errorMsg = '';
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

  getPagesArray(): number[] {
    return Array(this.totalPages)
      .fill(0)
      .map((_, i) => i + 1);
  }

  onAddNew(): void {
    this.isEditing = false;
    this.selected = null;
    this.selectedFlagFile = null;
    this.languageForm.reset({
      languagename: '',
      locale_code: '',
      status: true,
      is_default: false,
      flag_image: null,
    });
    (window as any).$('#languageModal').modal('show');
  }

  openAddModal(): void {
    this.isEditing = false;
    this.selected = null;
    this.selectedFlagFile = null;
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
    this.languageForm.patchValue({
      languagename: lang.languagename,
      locale_code: lang.locale_code,
      status: !!lang.status,
      is_default: !!lang.is_default,
      flag_image: null,
    });
    (window as any).$('#editLanguageModal').modal('show');
  }

  onEdit(lang: Language): void {
    this.isEditing = true;
    this.selected = lang;
    this.selectedFlagFile = null;
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

  onSubmit(): void {
    if (this.languageForm.invalid) return;

    const values = this.languageForm.value;
    const formData = new FormData();
    formData.append('languagename', values.languagename);
    formData.append('locale_code', values.locale_code);
    formData.append('status', values.status ? '1' : '0');
    if (values.is_default != null)
      formData.append('is_default', values.is_default ? '1' : '0');

    if (this.isEditing) {
      // optional file
      if (this.selectedFlagFile)
        formData.append('flag_image', this.selectedFlagFile);
      const id = this.selected!.languageid;
      this.service.updateLanguage(id, formData).subscribe({
        next: () => {
          this.loadLanguages(this.currentPage);
          (window as any).$('#languageModal').modal('hide');
        },
        error: (err) => {
          this.errorMsg = err?.error?.message || 'Update failed.';
        },
      });
    } else {
      // create requires file
      if (!this.selectedFlagFile) {
        this.errorMsg = 'Flag image is required.';
        return;
      }
      formData.append('flag_image', this.selectedFlagFile);
      this.service.createLanguage(formData).subscribe({
        next: () => {
          this.currentPage = 1;
          this.loadLanguages(1);
          (window as any).$('#languageModal').modal('hide');
        },
        error: (err) => {
          this.errorMsg = err?.error?.message || 'Create failed.';
        },
      });
    }
  }

  onSubmitAdd(): void {
    if (this.languageForm.invalid) return;
    const values = this.languageForm.value;
    const formData = new FormData();
    formData.append('languagename', values.languagename);
    formData.append('locale_code', values.locale_code);
    formData.append('status', values.status ? '1' : '0');
    if (values.is_default != null)
      formData.append('is_default', values.is_default ? '1' : '0');

    if (!this.selectedFlagFile) {
      this.errorMsg = 'Flag image is required.';
      return;
    }
    formData.append('flag_image', this.selectedFlagFile);

    this.service.createLanguage(formData).subscribe({
      next: () => {
        this.currentPage = 1;
        this.loadLanguages(1);
        (window as any).$('#addLanguageModal').modal('hide');
        this.languageForm.reset();
        this.selectedFlagFile = null;
      },
      error: (err) => {
        this.errorMsg = err?.error?.message || 'Create failed.';
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

    this.service.updateLanguage(this.selected.languageid, formData).subscribe({
      next: () => {
        this.loadLanguages(this.currentPage);
        (window as any).$('#editLanguageModal').modal('hide');
        this.selectedFlagFile = null;
      },
      error: (err) => {
        this.errorMsg = err?.error?.message || 'Update failed.';
      },
    });
  }

  onToggleStatus(lang: Language): void {
    const req$ = lang.status
      ? this.service.disableLanguage(lang.languageid)
      : this.service.enableLanguage(lang.languageid);
    req$.subscribe({
      next: () => {
        this.loadLanguages(this.currentPage);
      },
      error: (err) => {
        this.errorMsg = err?.error?.message || 'Failed to update status.';
      },
    });
  }

  onDelete(id: number): void {
    if (!confirm('Are you sure you want to delete this language?')) return;
    this.service.deleteLanguage(id).subscribe({
      next: () => {
        if (this.languages.length === 1 && this.currentPage > 1)
          this.currentPage--;
        this.loadLanguages(this.currentPage);
      },
      error: (err) => {
        this.errorMsg = err?.error?.message || 'Delete failed.';
      },
    });
  }

  flagUrl(path: string): string {
    if (!path) return '/assets/img/logo.png';
    if (/^https?:\/\//i.test(path)) return path;
    const fixed = path.startsWith('/') ? path : `/${path}`;
    return `${this.apiBase}${fixed}`;
  }
}
