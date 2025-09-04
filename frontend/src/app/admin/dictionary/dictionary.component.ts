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
  action: 'delete-one' | 'bulk-delete' | 'status' | null;
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
  // Edit functionality removed
  errorMsg = '';
  keyword = '';
  statusFilter: '' | 0 | 1 = '';
  localeFilter = '';
  currentPage = 1;
  totalPages = 0;
  // totalItems removed (not displayed)
  limit = 10; // fixed page size
  bulkSelection = new Set<number>();
  localeOptions: string[] = [];

  confirmModal: ConfirmModalState = {
    action: null,
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
      locale: [''],
      status: [1],
    });
  }

  ngOnInit(): void {
    // Avoid making HTTP calls during SSR to prevent Vite internal timeout
    if (isPlatformBrowser(this.platformId)) {
      this.loadWords(1); // immediate first load
      this.loadLocales();
      this.route.queryParamMap.subscribe((q) => {
        const pageParam = Number(q.get('page'));
        if (pageParam && pageParam !== this.currentPage) {
          this.currentPage = pageParam;
          this.loadWords(this.currentPage);
        }
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
          // totalItems removed
          this.totalPages = res.totalPages;
          this.errorMsg = '';
          this.bulkSelection.clear();
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
    // only adding new word now
    this.wordForm.reset({ word: '', locale: '', status: 1 });
    this.wordForm.get('word')?.enable({ emitEvent: false });
    this.errorMsg = '';
    (window as any).$('#wordAddModal').modal('show');
  }

  // openEditModal removed

  submitAdd(): void {
    if (this.wordForm.invalid) return;
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
    const ctrl = this.wordForm.get('word');
    const msg = (err?.error?.message || err?.message || '').toLowerCase();
    if (msg.includes('exist')) {
      ctrl?.setErrors({ ...(ctrl.errors || {}), duplicate: true });
    } else if (msg.includes('required')) {
      ctrl?.setErrors({ ...(ctrl.errors || {}), required: true });
    } else {
      this.errorMsg = err?.error?.message || err?.message || 'Operation failed';
    }
  }

  toggleSelect(id: number, checked: boolean) {
    if (checked) this.bulkSelection.add(id);
    else this.bulkSelection.delete(id);
  }

  toggleSelectAll(ev: Event) {
    const target = ev.target as HTMLInputElement | null;
    if (!target) return;
    if (target.checked)
      this.words.forEach((w) => this.bulkSelection.add(w.wordid));
    else this.bulkSelection.clear();
  }

  openConfirm(word: BadWord, action: 'status' | 'delete-one'): void {
    if (action === 'status') {
      this.confirmModal = {
        action: 'status',
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
        ids: [word.wordid],
        title: 'Confirm Delete',
        message: `Delete word "${word.word}"?`,
        btnClass: 'btn-danger',
      };
    }
    (window as any).$('#dictActionModal').modal('show');
  }

  openBulkDelete(): void {
    if (!this.bulkSelection.size) return;
    this.confirmModal = {
      action: 'bulk-delete',
      ids: Array.from(this.bulkSelection),
      title: 'Confirm Bulk Delete',
      message: `Delete ${this.bulkSelection.size} selected words?`,
      btnClass: 'btn-danger',
    };
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
    } else if (action === 'bulk-delete') {
      this.service.bulkDelete(ids).subscribe({
        next: () => {
          if (this.words.length === ids.length && this.currentPage > 1)
            this.currentPage--;
          this.loadWords(this.currentPage);
        },
        error: (err) =>
          (this.errorMsg = err?.error?.message || 'Bulk delete failed'),
      });
    } else if (action === 'status') {
      const row = this.words.find((w) => w.wordid === ids[0]);
      if (row) this.toggleStatus(row);
    }
    (window as any).$('#dictActionModal').modal('hide');
    setTimeout(() => {
      this.confirmModal = {
        action: null,
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

  onRowCheckbox(ev: Event, id: number) {
    const target = ev.target as HTMLInputElement | null;
    if (!target) return;
    this.toggleSelect(id, target.checked);
  }

  loadLocales() {
    this.service.getLocales().subscribe({
      next: (list) => (this.localeOptions = list.sort()),
      error: () => {},
    });
  }
}
