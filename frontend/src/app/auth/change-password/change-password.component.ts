import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { finalize } from 'rxjs/operators';
import { NotificationService } from '../../core/services/notification.service';
import { TranslateService } from '@ngx-translate/core';
import { LanguageService, Language } from '../../core/services/language.service';
import { isPlatformBrowser } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { AccountService } from '../../core/services/account.service';
import { AppSettingsService } from '../../core/config/app-settings.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-change-password',
  templateUrl: './change-password.component.html',
  styleUrls: ['./change-password.component.css'],
  standalone: false
})
export class ChangePasswordComponent implements OnInit {
  passwordForm!: FormGroup;
  isLoading = false;
  showCurrentPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;
  baseUrl = 'http://localhost:3000/auth';
  isBrowser: boolean;
  loadingLang = false;
  initialLang = 'en';
  dropdownOpen = false;
  languages : Language[] = [];
  currentLanguage: Language | null = null;
  isLoggedIn: boolean = false;
  avatarUrl: string = '';
  currentUserId = 0;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private notificationService: NotificationService,
    private translate: TranslateService,
    private languageService: LanguageService,
    private authService: AuthService,
    @Inject(PLATFORM_ID) private platformId: Object,
    private accountService: AccountService,
    public appSettings: AppSettingsService,
    private router: Router,
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    this.initializeForm();
    this.authService.checkSession().subscribe({
      next: (ok) => {
        this.isLoggedIn = ok;
        if (ok) {
          this.loadProfile();
        }
      },
    });
    this.loadLanguages();
  }

  private initializeForm(): void {
    this.passwordForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [
        Validators.required,
        Validators.minLength(8),
        this.passwordStrengthValidator()
      ]],
      confirmPassword: ['', Validators.required]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  private passwordStrengthValidator() {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (!value) return null;
      
      const hasUpperCase = /[A-Z]+/.test(value);
      const hasLowerCase = /[a-z]+/.test(value);
      const hasNumeric = /[0-9]+/.test(value);
      const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/.test(value);
      
      const passwordValid = hasUpperCase && hasLowerCase && hasNumeric && hasSpecialChar;
      
      return !passwordValid ? { passwordStrength: true } : null;
    };
  }

  private passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const newPassword = control.get('newPassword')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;
    
    if (newPassword && confirmPassword && newPassword !== confirmPassword) {
      control.get('confirmPassword')?.setErrors({ mismatch: true });
      return { passwordMismatch: true };
    } else {
      return null;
    }
  }

  onSubmit(): void {
    if (this.passwordForm.invalid) {
      // Mark all fields as touched to trigger validation visuals
      this.markFormGroupTouched(this.passwordForm);
      return;
    }

    this.isLoading = true;

    const payload = {
      currentPassword: this.passwordForm.get('currentPassword')?.value,
      newPassword: this.passwordForm.get('newPassword')?.value
    };
    console.log("Payload: ", payload);

    this.http.post(`${this.baseUrl}/change-password`, payload, { withCredentials: true })
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (response: any) => {
          this.notificationService.success(
            this.translate.instant('PASSWORD.SUCCESS_TITLE'),
            this.translate.instant('PASSWORD.SUCCESS_MESSAGE')
          );
          console.log("Here");
          this.passwordForm.reset();
        },
        error: (error) => {
          console.error('Change password error:', error);
          let errorMessage = this.translate.instant('PASSWORD.ERROR_DEFAULT');
          if (error.status === 401) {
            errorMessage = this.translate.instant('PASSWORD.ERROR_CURRENT_INCORRECT');
          } else if (error.error?.message) {
            errorMessage = error.error.message;
          }
          
          this.notificationService.error(
            this.translate.instant('PASSWORD.ERROR_TITLE'),
            errorMessage
          );
        }
      });
  }

  togglePasswordVisibility(field: string): void {
    switch (field) {
      case 'currentPassword':
        this.showCurrentPassword = !this.showCurrentPassword;
        break;
      case 'newPassword':
        this.showNewPassword = !this.showNewPassword;
        break;
      case 'confirmPassword':
        this.showConfirmPassword = !this.showConfirmPassword;
        break;
    }
  }

  getPasswordStrength(): { strength: number, label: string, color: string } {
    const password = this.passwordForm.get('newPassword')?.value || '';
    if (!password) {
      return { strength: 0, label: 'None', color: '#e0e0e0' };
    }

    let strength = 0;

    // Length check (up to 25%)
    if (password.length >= 8) strength += 25;
    
    // Character variety checks (up to 75%)
    if (/[A-Z]+/.test(password)) strength += 25;
    if (/[a-z]+/.test(password)) strength += 25;
    if (/[0-9]+/.test(password)) strength += 12.5;
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/.test(password)) strength += 12.5;

    // Determine label and color based on strength
    let label = '';
    let color = '';

    if (strength <= 25) {
      label = this.translate.instant('PASSWORD.STRENGTH_WEAK');
      color = '#dc3545'; // Red (Bootstrap danger)
    } else if (strength <= 50) {
      label = this.translate.instant('PASSWORD.STRENGTH_FAIR');
      color = '#ffc107'; // Yellow (Bootstrap warning)
    } else if (strength <= 75) {
      label = this.translate.instant('PASSWORD.STRENGTH_GOOD');
      color = '#17a2b8'; // Cyan (Bootstrap info)
    } else {
      label = this.translate.instant('PASSWORD.STRENGTH_STRONG');
      color = '#28a745'; // Green (Bootstrap success)
    }

    return { strength, label, color };
  }

  isFieldInvalid(field: string): boolean {
    const control = this.passwordForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  getErrorMessage(field: string): string {
    const control = this.passwordForm.get(field);
    
    if (!control || !control.errors) return '';
    
    if (control.errors['required']) {
      return this.translate.instant('PASSWORD.ERROR_REQUIRED');
    }
    
    if (field === 'newPassword') {
      if (control.errors['minlength']) {
        return this.translate.instant('PASSWORD.ERROR_MIN_LENGTH');
      }
      if (control.errors['passwordStrength']) {
        return this.translate.instant('PASSWORD.ERROR_STRENGTH');
      }
    }
    
    if (field === 'confirmPassword' && control.errors['mismatch']) {
      return this.translate.instant('PASSWORD.ERROR_MISMATCH');
    }
    
    return this.translate.instant('PASSWORD.ERROR_INVALID');
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
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

  // Hàm để lấy profile người dùng đã đăng nhập
  loadProfile(): void {
    this.accountService.getProfile().subscribe({
      next: (res: any) => {
        this.avatarUrl = res?.data?.avatarUrl || this.appSettings.defaults.userAvatar;
        this.currentUserId = res?.data?.userid;
      },
      error: (err) => {
        console.error('Failed to load profile', err);
        this.avatarUrl = this.appSettings.defaults.userAvatar;
      },
    });
  }

  // Hàm để đăng xuất
  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/auth/login']);
      },
      error: (error) => {
        console.error('Logout error:', error);
      }
    });
  }
}