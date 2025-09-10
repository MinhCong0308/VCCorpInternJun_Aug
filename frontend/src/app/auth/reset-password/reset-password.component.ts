import { Component, OnInit , PLATFORM_ID, Inject} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { Language, LanguageService } from '../../core/services/language.service';
import { isPlatformBrowser } from '@angular/common';


@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.css'],
  standalone: false,
})
export class ResetPasswordComponent implements OnInit {
  resetForm: FormGroup;
  isLoading = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  languages: Language[] = [];
  currentLanguage: Language | null = null;
  initialLang = 'en';
  isBrowser: boolean;
  loadingLang = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private translate: TranslateService,
    private authService: AuthService,
    private notificationService: NotificationService,
    private languageService: LanguageService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    this.resetForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });
  }

  ngOnInit(): void {
    this.loadLanguages();
    console.log('Languages loaded:', this.languages);
  }
  loadLanguages(): void {
    if (!this.isBrowser) return;
    try {
      const cached = localStorage.getItem('languages');
      console.log('Cached languages from localStorage:', cached);
      if (cached) {
        this.languages = JSON.parse(cached) as Language[];
        this.normalizeLanguages();
        const code = this.translate.getCurrentLang?.() || this.initialLang;
        this.syncCurrentLanguageByCode(code);
      }
    } catch {}
    this.languageService.getLanguages().subscribe({
      next: (response) => {
        const list: Language[] = (response?.data?.languages || response?.languages || response || []) as Language[];
        this.languages = list;
        this.normalizeLanguages();
        if (this.isBrowser) {
          try { localStorage.setItem('languages', JSON.stringify(this.languages)); } catch {}
        }
        this.syncCurrentLanguageByCode(this.translate.getCurrentLang?.());
      },
      error: (error) => {
        // console.error('Error loading languages:', error);
        this.notificationService.error('Error', 'Failed to load languages. Please try again later.');
      }
    });
  }
  normalizeLanguages(): void {
    this.languages = this.languages
      .filter(l => l.status === 1 || l.status === undefined)
      .map(l => ({
        ...l,
        locale_code: (l.locale_code || '').trim() || (l.languagename === 'Vietnamese' ? 'vi' : 'en')
      }));
  }
  syncCurrentLanguageByCode(code?: string): void {
    const cc = (code || 'en').toLowerCase();
    this.currentLanguage =
      this.languages.find(l => (l.locale_code || '').toLowerCase() === cc)
      || this.languages.find(l => !!l.is_default)
      || this.languages[0];
  }
  selectLanguage(lang: Language): void {
    if (!lang || this.loadingLang) return;
    // nếu chọn lại chính ngôn ngữ đang dùng → thôi
    if (this.currentLanguage?.languageid === lang.languageid) {
      this.applyUiLanguage(lang); // vẫn gọi để đồng bộ document.lang/localStorage
      return;
    }

    this.loadingLang = true;
    this.applyUiLanguage(lang);
    this.currentLanguage = lang;
    this.loadingLang = false;
  }
  applyUiLanguage(lang: Language): void {
    if (!lang?.locale_code) return;
    const id = lang?.languageid;
    this.translate.use(lang.locale_code);
    if (this.isBrowser) {
      try { 
        localStorage.setItem('lang', lang.locale_code);
        localStorage.setItem('languageId', String(id));
      } catch {}
      document.documentElement.lang = lang.locale_code;
    }
  }


  onSubmit(): void {
    if (this.resetForm.invalid) {
      return;
    }
    this.isLoading = true;
    console.log('Submitting email for password reset:', this.resetForm.value.email);
    this.authService.verifyResetPassword(this.resetForm.value.email).subscribe({
      next: () => {
        this.successMessage = this.translate.instant('AUTH.SENT_OTP');
        console.log('Here');
        localStorage.setItem('verifyEmail', this.resetForm.value.email);
        this.resetForm.reset();
        // this.router.navigate(['/auth/verify-otp'], { queryParams: { purpose: 'reset-password' } });
      },
      error: (error) => {
        console.log("What's the error:", error);
        this.errorMessage = this.translate.instant('AUTH.RESET_FAILED');
      },
      complete: () => {
        this.isLoading = false;
      },
    });
  }

  isFieldInvalid(field: string): boolean {
    return !!this.resetForm.get(field)?.invalid && !!this.resetForm.get(field)?.touched;
  }
}
