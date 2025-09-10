import { Component, OnInit , Inject, PLATFORM_ID} from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { LanguageService, Language } from '../../core/services/language.service';
import { isPlatformBrowser } from '@angular/common';


@Component({
  selector: 'app-reset-new-password',
  templateUrl: './reset-new-password.component.html',
  styleUrls: ['./reset-new-password.component.css'],
  standalone: false,
})
export class ResetNewPasswordComponent {
  resetForm: FormGroup;
  isLoading = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  showPassword = false;
  languages: Language[] = [];
  currentLanguage: Language | null = null;
  email = localStorage.getItem('verifyEmail') || '';
  passwordStrength = 0;
  passwordStrengthText = 'PASSWORD.STRENGTH_WEAK';
  passwordStrengthClass = 'text-danger';
  passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  initialLang = 'en';
  isBrowser: boolean;
  loadingLang = false;
   constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService,
    private notificationService: NotificationService,
    private translate: TranslateService,
    private languageService: LanguageService,
    @Inject(PLATFORM_ID) private platformId: Object // <-- Missing proper injection

  ) {
    this.resetForm = this.fb.group({
      newPassword: ['', [
        Validators.required, 
        Validators.minLength(8), 
        Validators.pattern(this.passwordPattern)
      ]],
      confirmPassword: ['', Validators.required]
    }, {
      validators: [this.mustMatch('newPassword', 'confirmPassword')]
    });
    this.isBrowser = isPlatformBrowser(this.platformId);
    if(this.isBrowser) {
      this.email = localStorage.getItem('verifyEmail') || '';
    }
  }
  isFieldInvalid(fieldName: string): boolean {
    const field = this.resetForm.get(fieldName);
    return !!field && field.invalid && (field.dirty || field.touched);
  }
  ngOnInit(): void {
    this.loadLanguages();
    this.resetForm?.get('newPassword')?.valueChanges.subscribe(password => {
      this.checkPasswordStrength(password);
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
  onSubmit(): void {
    if (this.resetForm?.invalid) {
      this.resetForm?.markAllAsTouched();
      return;
    }

    if (!this.email) {
      this.errorMessage = this.translate.instant('AUTH.INVALID_RESET_LINK');
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const email = this.email;
    const newPassword = this.resetForm?.value?.newPassword;
    const newPasswordConfirm = this.resetForm?.value?.confirmPassword;

    this.authService.resetPassword(email, newPassword, newPasswordConfirm).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.successMessage = this.translate.instant('AUTH.PASSWORD_RESET_SUCCESS');
        
        this.notificationService.success(
          this.translate.instant('AUTH.PASSWORD_RESET_SUCCESS'),
          this.translate.instant('AUTH.PASSWORD_RESET_SUCCESS_DETAIL')
        );
        
        setTimeout(() => {
          this.router.navigate(['/auth/login']);
        }, 2000);
      },
      error: (error) => {
        this.isLoading = false;
        console.log('Error response from resetPassword:', error);
        if (error.status === 400 || error.status === 401) {
          this.errorMessage = error.error?.message || this.translate.instant('AUTH.INVALID_OR_EXPIRED_TOKEN');
        } else {
          this.errorMessage = this.translate.instant('AUTH.PASSWORD_RESET_FAILED');
        }
        console.error('Password reset error:', error);
      }
    });
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
  mustMatch(controlName: string, matchingControlName: string) {
    return (formGroup: AbstractControl): ValidationErrors | null => {
      const control = formGroup.get(controlName);
      const matchingControl = formGroup.get(matchingControlName);

      if (!control || !matchingControl) {
        return null;
      }

      if (matchingControl.errors && !matchingControl.errors['mustMatch']) {
        return null;
      }

      if (control.value !== matchingControl.value) {
        matchingControl.setErrors({ mustMatch: true });
        return { mustMatch: true };
      } else {
        matchingControl.setErrors(null);
        return null;
      }
    };
  }
  checkPasswordStrength(password: string): void {
    if (!password) {
      this.passwordStrength = 0;
      this.passwordStrengthText = 'PASSWORD.STRENGTH_WEAK';
      this.passwordStrengthClass = 'text-danger';
      return;
    }
    
    let score = 0;
    
    // Length check
    if (password.length >= 8) score += 25;
    
    // Complexity checks
    if (/[a-z]/.test(password)) score += 15; // lowercase
    if (/[A-Z]/.test(password)) score += 20; // uppercase
    if (/\d/.test(password)) score += 20;    // digits
    if (/[@$!%*?&]/.test(password)) score += 20; // special chars
    
    this.passwordStrength = Math.min(100, score);
    
    // Set strength text and class
    if (score < 40) {
      this.passwordStrengthText = 'PASSWORD.STRENGTH_WEAK';
      this.passwordStrengthClass = 'text-danger';
    } else if (score < 60) {
      this.passwordStrengthText = 'PASSWORD.STRENGTH_FAIR';
      this.passwordStrengthClass = 'text-warning';
    } else if (score < 80) {
      this.passwordStrengthText = 'PASSWORD.STRENGTH_GOOD';
      this.passwordStrengthClass = 'text-info';
    } else {
      this.passwordStrengthText = 'PASSWORD.STRENGTH_STRONG';
      this.passwordStrengthClass = 'text-success';
    }
  }
}

