import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, registerLocaleData } from '@angular/common';
import { BehaviorSubject, Observable } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';

import localeEn from '@angular/common/locales/en';
import localeVi from '@angular/common/locales/vi';
import localeFr from '@angular/common/locales/fr';

@Injectable({ providedIn: 'root' })
export class LocaleService {
  private translate = inject(TranslateService);
  private platformId = inject(PLATFORM_ID);

  private localeSub = new BehaviorSubject<string>(this.computeInitial());
  readonly locale$: Observable<string> = this.localeSub.asObservable();

  constructor() {
    registerLocaleData(localeEn);
    registerLocaleData(localeVi);
    registerLocaleData(localeFr);

    this.translate.onLangChange.subscribe(ev => {
      this.setLocaleFromLangCode(ev.lang);
    });
  }

  private mapLangToAngularLocale(code: string): string {
    const c = (code || '').toLowerCase();
    if (c.startsWith('vi')) return 'vi';
    if (c.startsWith('fr')) return 'fr';
    return 'en-US';
  }

  private computeInitial(): string {
    let lang = 'en';
    if (typeof this.translate.getCurrentLang === 'function') {
      lang = this.translate.getCurrentLang() || 'en';
    }
    if (isPlatformBrowser(this.platformId)) {
      try { lang = localStorage.getItem('lang') || lang; } catch {}
    }
    return this.mapLangToAngularLocale(lang);
  }

  setLocaleFromLangCode(langCode: string) {
    const loc = this.mapLangToAngularLocale(langCode);
    this.localeSub.next(loc);
    if (isPlatformBrowser(this.platformId)) {
      try { localStorage.setItem('lang', langCode); } catch {}
      document.documentElement.lang = langCode;
    }
  }
}