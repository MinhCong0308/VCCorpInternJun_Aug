import {
  AfterViewInit,
  Component,
  OnInit,
  Inject,
  PLATFORM_ID,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import {
  DictionaryService,
  BadWord,
} from '../../core/services/dictionary.service';

declare const $: any;

interface ConfirmModalState {
  action: 'delete-one' | 'status' | null;
  op: 'delete' | 'activate' | 'deactivate' | null;
  ids: number[];
  title: string;
  message: string;
  btnClass: string;
}

@Component({
  selector: 'app-dictionary',
  templateUrl: './dictionary.component.html',
  styleUrls: ['./dictionary.component.css'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
})
export class DictionaryComponent implements OnInit, AfterViewInit {
  searchForm: FormGroup;
  wordForm: FormGroup;
  words: BadWord[] = [];
  // Simplified: only add / toggle status / delete
  errorMsg = '';
  keyword = '';
  statusFilter: '' | 0 | 1 = '';
  localeFilter = '';
  currentPage = 1;
  totalPages = 0;
  limit = 5; // default page size (can be overridden by ?limit= in URL)
  localeOptions: string[] = [];

  confirmModal: ConfirmModalState = {
    action: null,
    op: null,
    ids: [],
    title: '',
    message: '',
    btnClass: 'btn-primary',
  };

  constructor(
    private fb: FormBuilder,
    private service: DictionaryService,
    private route: ActivatedRoute,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.searchForm = this.fb.group({
      keyword: [''],
      status: [''],
      // locale filter is optional
      locale: [''],
    });
    this.wordForm = this.fb.group({
      word: [
        '',
        [
          Validators.required,
          Validators.minLength(1),
          Validators.maxLength(191),
        ],
      ],
      // locale must be selected when adding a word
      locale: ['', [Validators.required]],
      status: [1],
    });
  }

  ngOnInit(): void {
    // Avoid making HTTP calls during SSR to prevent Vite internal timeout
    if (isPlatformBrowser(this.platformId)) {
      // Initial data
      this.loadLocales();
      this.route.queryParamMap.subscribe((q) => {
        // Page
        const pageParam = Number(q.get('page'));
        if (pageParam && pageParam !== this.currentPage) {
          this.currentPage = pageParam;
        }
        const limitParam = Number(q.get('limit'));
        if (!isNaN(limitParam) && limitParam > 0 && limitParam <= 200) {
          this.limit = limitParam;
        }
        this.loadWords(this.currentPage);
      });
    }
  }

  ngAfterViewInit(): void {
    if (typeof $ === 'function') {
      $('[data-toggle="tooltip"]').tooltip();
    }
  }

  loadWords(page: number = 1): void {
    const kw = (
      this.searchForm.get('keyword')?.value ||
      this.keyword ||
      ''
    ).trim();
    const statRaw = this.searchForm.get('status')?.value;
    const statusFilter = statRaw === '' ? '' : (Number(statRaw) as 0 | 1);
    this.statusFilter = statusFilter;
    const localeFilter = this.searchForm.get('locale')?.value || '';
    this.localeFilter = localeFilter;

    this.service
      .getAll(kw, page, this.limit, statusFilter, localeFilter)
      .subscribe({
        next: (res) => {
          this.words = res.words;
          this.currentPage = res.page;
          this.totalPages = res.totalPages;
          this.errorMsg = '';
          this.updateRouteQuery();
        },
        error: (err) => {
          this.errorMsg = err?.error?.message || 'Failed to load dictionary.';
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
    this.loadWords(1);
  }

  onPageChange(page: number): void {
    if (page >= 1 && page <= this.totalPages) this.loadWords(page);
  }

  getPagesArray(): number[] {
    return Array(this.totalPages)
      .fill(0)
      .map((_, i) => i + 1);
  }

  private updateRouteQuery(): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        limit: this.limit,
        page: this.currentPage,
        keyword:
          (this.searchForm.get('keyword')?.value || '').trim() || undefined,
      },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  openAddModal(): void {
    this.wordForm.reset({ word: '', locale: '', status: 1 });
    this.loadLocales();
    this.wordForm.get('word')?.enable({ emitEvent: false });
    this.errorMsg = '';
    (window as any).$('#wordAddModal').modal('show');
  }

  submitAdd(): void {
    this.wordForm.markAllAsTouched();

    if (this.wordForm.invalid) {
      this.errorMsg = '';
      return;
    }

    this.errorMsg = '';
    const payload = this.wordForm.value;
    this.service.create(payload).subscribe({
      next: () => {
        this.currentPage = 1;
        this.loadWords(1);
        (window as any).$('#wordAddModal').modal('hide');
      },
      error: (err) => this.handleCrudError(err),
    });
  }

  // submitEdit removed

  private handleCrudError(err: any): void {
    let msgRaw: string = '';
    if (err?.error) {
      if (typeof err.error === 'string') {
        // Try JSON parse
        try {
          const parsed = JSON.parse(err.error);
          msgRaw = parsed?.message || err.error;
        } catch {
          msgRaw = err.error; // plain text
        }
      } else {
        msgRaw = err.error.message || '';
      }
    }
    if (!msgRaw) msgRaw = err?.message || '';
    const msg = msgRaw.toLowerCase();
    const wordCtrl = this.wordForm.get('word');
    const localeCtrl = this.wordForm.get('locale');

    // Clear previous server errors before setting new ones
    if (wordCtrl?.errors?.['duplicate']) {
      const { duplicate, ...rest } = wordCtrl.errors;
      wordCtrl.setErrors(Object.keys(rest).length ? rest : null);
    }
    if (localeCtrl?.errors?.['invalidLocale']) {
      const { invalidLocale, ...rest } = localeCtrl.errors;
      localeCtrl.setErrors(Object.keys(rest).length ? rest : null);
    }

    if (err.status === 422) {
      if (
        msg.includes('word already exists') ||
        msg.includes('already exists')
      ) {
        wordCtrl?.setErrors({ ...(wordCtrl.errors || {}), duplicate: true });
        this.errorMsg = 'Word already exists. Please enter a different word.';
        return;
      }
    }

    if (
      (err.status === 400 || err.status === 422) &&
      !msg.includes('word ') &&
      !msg.includes('locale')
    ) {
      if (wordCtrl?.value && wordCtrl.value.trim().length > 0) {
        wordCtrl.setErrors({ ...(wordCtrl.errors || {}), duplicate: true });
        this.errorMsg = ''; // rely on field-level error
        return;
      }
    }

    // Handle other specific backend errors
    if (msg.includes('invalid locale code') || msg.includes('invalid locale')) {
      localeCtrl?.setErrors({
        ...(localeCtrl.errors || {}),
        invalidLocale: true,
      });
    } else if (
      msg.includes('locale code is required') ||
      (msg.includes('locale') && msg.includes('required'))
    ) {
      localeCtrl?.setErrors({ ...(localeCtrl.errors || {}), required: true });
    } else if (msg.includes('word is required')) {
      wordCtrl?.setErrors({ ...(wordCtrl.errors || {}), required: true });
    } else {
      this.errorMsg = msgRaw || 'Operation failed';
    }
  }

  openConfirm(word: BadWord, action: 'status' | 'delete-one'): void {
    if (action === 'status') {
      this.confirmModal = {
        action: 'status',
        op: word.status ? 'deactivate' : 'activate',
        ids: [word.wordid],
        title: word.status ? 'Confirm Deactivate' : 'Confirm Activate',
        message: `${word.status ? 'Deactivate' : 'Activate'} word "${
          word.word
        }"?`,
        btnClass: word.status ? 'btn-warning' : 'btn-success',
      };
    } else {
      this.confirmModal = {
        action: 'delete-one',
        op: 'delete',
        ids: [word.wordid],
        title: 'Confirm Delete',
        message: `Delete word "${word.word}"?`,
        btnClass: 'btn-danger',
      };
    }
    (window as any).$('#dictActionModal').modal('show');
  }

  confirmAction(): void {
    const { action, ids } = this.confirmModal;
    if (!action || !ids.length) return;
    if (action === 'delete-one') {
      this.service.delete(ids[0]).subscribe({
        next: () => {
          if (this.words.length === 1 && this.currentPage > 1)
            this.currentPage--;
          this.loadWords(this.currentPage);
        },
        error: (err) =>
          (this.errorMsg = err?.error?.message || 'Delete failed'),
      });
    } else if (action === 'status') {
      const row = this.words.find((w) => w.wordid === ids[0]);
      if (row) this.toggleStatus(row);
    }
    (window as any).$('#dictActionModal').modal('hide');
    setTimeout(() => {
      this.confirmModal = {
        action: null,
        op: null,
        ids: [],
        title: '',
        message: '',
        btnClass: 'btn-primary',
      };
    }, 300);
  }

  private toggleStatus(row: BadWord) {
    const obs = row.status
      ? this.service.disable(row.wordid)
      : this.service.enable(row.wordid);
    obs.subscribe({
      next: () => this.loadWords(this.currentPage),
      error: (err) =>
        (this.errorMsg = err?.error?.message || 'Status update failed'),
    });
  }

  loadLocales() {
    this.service.getLocales().subscribe({
      next: (list) => (this.localeOptions = list.sort()),
      error: () => {},
    });
  }
}
