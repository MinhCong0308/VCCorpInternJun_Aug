import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';

const LS_KEY = 'recent_searches';
const MAX_RECENT = 10;

@Injectable({ providedIn: 'root' })
export class SearchService {
  private isBrowser: boolean;
  private _recent: string[] = [];
  readonly query$ = new BehaviorSubject<string>('');

  constructor(@Inject(PLATFORM_ID) platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);
    this._recent = this.loadRecent();
  }

  get recent(): string[] {
    return this._recent;
  }

  setQuery(q: string) {
    this.query$.next(q);
  }

  addRecent(q: string) {
    const s = (q || '').trim();
    if (!s) return;
    const dedup = [s, ...this._recent.filter(x => x.toLowerCase() !== s.toLowerCase())];
    this._recent = dedup.slice(0, MAX_RECENT);
    this.saveRecent();
  }

  removeRecent(idx: number) {
    this._recent.splice(idx, 1);
    this.saveRecent();
  }

  clearRecent() {
    this._recent = [];
    this.saveRecent();
  }

  private loadRecent(): string[] {
    if (!this.isBrowser) return [];
    try {
      const raw = localStorage.getItem(LS_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr.filter(x => typeof x === 'string') : [];
    } catch { return []; }
  }

  private saveRecent() {
    if (!this.isBrowser) return;
    localStorage.setItem(LS_KEY, JSON.stringify(this._recent));
  }
}