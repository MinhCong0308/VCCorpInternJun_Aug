import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { AbstractControl } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { Language, LanguageService } from '../../core/services/language.service';
import { TranslateService } from '@ngx-translate/core';
import { NotificationService } from '../../core/services/notification.service';


@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css'],
  standalone: false, 
})
export class SignupComponent implements OnInit {
  signupForm!: FormGroup;
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  isBrowser: boolean;
  loadingLang = false;
  initialLang = 'en';
  dropdownOpen = false;
  languages : Language[] = [];
  currentLanguage: Language | null = null;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object,
    private authService: AuthService,
    private translate: TranslateService,
    private languageService: LanguageService,
    private notificationService: NotificationService
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    const saved = this.isBrowser ? (localStorage.getItem('lang') || '') : '';
    const code = saved || this.translate.getCurrentLang?.() || 'en';
    this.initialLang = code;
    this.translate.use(code);
    if (this.isBrowser) document.documentElement.lang = code;
    this.loadLanguages();
    this.initializeForm();    
  }

  private initializeForm(): void {
    this.signupForm = this.fb.group({
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      username: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  // Custom validator for password matching
  private passwordMatchValidator(control: AbstractControl): {[key: string]: any} | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      return { 'passwordMismatch': true };
    }
    return null;
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.signupForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  hasPasswordMismatch(): boolean {
    return !!this.signupForm.hasError('passwordMismatch') && 
           !!this.signupForm.get('confirmPassword')?.touched;
  }

  async onSubmit(): Promise<void> {
    if (this.signupForm.invalid) {
      this.markAllFieldsAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.authService.signup(this.signupForm.value).subscribe({
      next: (response) => {
        this.successMessage = response.message;
        if(this.isBrowser) {
          localStorage.setItem('verifyEmail', this.signupForm.value.email);
        }
        this.router.navigate(['/auth/verify-otp']);
      },
      error: (error) => {
        this.errorMessage = error.message;
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }

  handleGoogleSignup(): void {
    this.isLoading = true;
    const baseUrl = 'http://localhost:3000'; 
    const authUrl = `${baseUrl}/auth/oauth/google?signup=true`;
    window.location.href = authUrl;
  }

  private markAllFieldsAsTouched(): void {
    Object.keys(this.signupForm.controls).forEach(key => {
      this.signupForm.get(key)?.markAsTouched();
    });
  }

  loadLanguages(): void {
    if (!this.isBrowser) return;
    try {
      const cached = localStorage.getItem('languages');
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
}