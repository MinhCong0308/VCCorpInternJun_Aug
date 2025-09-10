import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import e from 'express';
import { TranslateService } from '@ngx-translate/core';
import { Language, LanguageService } from '../../core/services/language.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  standalone: false,
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  isBrowser: boolean;
  loadingLang = false;
  initialLang = 'en';
  dropdownOpen = false;
  languages : Language[] = [];
  currentLanguage: Language | null = null;
  showCurrentPassword = false;
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

  async ngOnInit(): Promise<void> {
    const saved = this.isBrowser ? (localStorage.getItem('lang') || '') : '';
    const code = saved || this.translate.getCurrentLang?.() || 'en';
    this.initialLang = code;
    this.translate.use(code);
    if (this.isBrowser) document.documentElement.lang = code;
    this.loadLanguages();
    this.initializeForm();
    if(this.isBrowser) {
      this.authService.checkSession().subscribe(valid => {
        if (valid) {
         this.router.navigate(['/home']);
        }
      });
    }
    if(this.isBrowser && window.location.search.includes('oauth=success')) {
      this.checkSession().then((valid) => {
        if (valid) {
          this.router.navigate(['/home']);
        }
      });
    }
  }

  private initializeForm(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.loginForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  onSubmit(): void {
    if (!this.loginForm.valid) {
      this.markAllFieldsAsTouched();
      return;
    }
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';
    const { email, password } = this.loginForm.value;
    this.authService.login(email, password).subscribe({
      next: (response) => {
        if (response.success) {
          console.log('Login successful:', response);
          this.successMessage = 'Login successful! Redirecting...';
          setTimeout(() => {
            this.router.navigate(['/home']);
          }, 1000);
        } else {
          // console.log("Jump here");
          // console.log('Response:', response);
          this.errorMessage = response.message || 'Login failed!';
        }
      },
      error: (error) => {
        console.log("Error: ", error)
        this.errorMessage = error.message || 'Login failed!';
        console.error('Login error:', error.message || error);
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }
  togglePasswordVisibility(field: string): void {
    switch (field) {
      case 'password':
        this.showCurrentPassword = !this.showCurrentPassword;
        break;
    }
  }
  handleGoogleLogin(): void {
    if (!this.isBrowser) return
    this.isLoading = false;
    const baseUrl = 'http://localhost:3000'; 
    const authUrl = `${baseUrl}/auth/oauth/google`;
    window.location.href = authUrl;
  }
  private async checkSession(): Promise<boolean> {
    const res = await fetch(`http://localhost:3000/auth/me`, {
      credentials: 'include',
    });
    return res.ok;
  }

  private markAllFieldsAsTouched(): void {
    Object.values(this.loginForm.controls).forEach(control => {
      control.markAsTouched();
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

  logout(): void {
    // remove cookie
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/login']);
      },
      error: (error) => {
        console.error('Logout error:', error);
      }
    });
  }
}
