import { Component, OnInit, OnDestroy, ViewChildren, QueryList, ElementRef, Inject, PLATFORM_ID } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription, interval } from 'rxjs';
import { Language, LanguageService } from '../../core/services/language.service';
import { AuthService } from '../../core/services/auth.service';
import { TranslateService } from '@ngx-translate/core';
import { NotificationService } from '../../core/services/notification.service';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-verify-otp',
  templateUrl: './verify-otp.component.html',
  styleUrls: ['./verify-otp.component.css'],
  standalone: false, // This component is not standalone, it is part of the AuthModule
})
export class VerifyOtpComponent implements OnInit, OnDestroy {
  @ViewChildren('otpInput') otpInputs!: QueryList<ElementRef>;
  otpForm!: FormGroup;
  otpDigits = new Array(6); // Array for 6 OTP digits
  userEmail = '';
  isLoading = false;
  isResending = false;
  errorMessage = '';
  successMessage = '';
  isOtpInvalid = false;
  isBrowser: boolean;
  loadingLang = false;
  initialLang = 'en';
  dropdownOpen = false;
  languages : Language[] = [];
  currentLanguage: Language | null = null;

  // Resend cooldown
  isResendCooldown = false;
  resendCountdown = 0;
  private countdownSubscription?: Subscription;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService,
    private translate: TranslateService,
    private languageService: LanguageService,
    private notificationService: NotificationService,
    @Inject(PLATFORM_ID) private platformId: Object,
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
    this.getUserEmail();
    this.focusFirstInput();
  }

  ngOnDestroy(): void {
    if (this.countdownSubscription) {
      this.countdownSubscription.unsubscribe();
    }
  }

  private initializeForm(): void {
    const formControls: any = {};
    for (let i = 0; i < 6; i++) {
      formControls[`digit${i}`] = ['', [Validators.required, Validators.pattern(/^\d$/)]];
    }
    this.otpForm = this.fb.group(formControls);
  }

  private getUserEmail(): void {
    if (!this.isBrowser) return;
    this.userEmail = localStorage.getItem('verifyEmail') || '';
    if (!this.userEmail) {
      this.errorMessage = 'Email not found. Please go back to signup.';
      setTimeout(() => {
        this.router.navigate(['/auth/signup']);
      }, 3000);
    }
  }

  private focusFirstInput(): void {
    setTimeout(() => {
      if (this.otpInputs.first) {
        this.otpInputs.first.nativeElement.focus();
      }
    }, 100);
  }

  onDigitInput(event: any, index: number): void {
    const value = event.target.value;
    this.isOtpInvalid = false;
    this.errorMessage = '';

    // Only allow numeric input
    if (value && !/^\d$/.test(value)) {
      event.target.value = '';
      this.otpForm.get(`digit${index}`)?.setValue('');
      return;
    }

    // Move to next input if value entered
    if (value && index < 5) {
      const nextInput = this.otpInputs.toArray()[index + 1];
      if (nextInput) {
        nextInput.nativeElement.focus();
      }
    }
  }

  onKeyDown(event: KeyboardEvent, index: number): void {
    // Handle backspace
    if (event.key === 'Backspace') {
      const currentInput = event.target as HTMLInputElement;
      
      if (!currentInput.value && index > 0) {
        // Move to previous input if current is empty
        const prevInput = this.otpInputs.toArray()[index - 1];
        if (prevInput) {
          prevInput.nativeElement.focus();
        }
      }
    }
    
    // Handle arrow keys
    if (event.key === 'ArrowLeft' && index > 0) {
      const prevInput = this.otpInputs.toArray()[index - 1];
      if (prevInput) {
        prevInput.nativeElement.focus();
      }
    }
    
    if (event.key === 'ArrowRight' && index < 5) {
      const nextInput = this.otpInputs.toArray()[index + 1];
      if (nextInput) {
        nextInput.nativeElement.focus();
      }
    }
  }

  onPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const pastedData = event.clipboardData?.getData('text') || '';
    const digits = pastedData.replace(/\D/g, '').slice(0, 6);
    
    if (digits.length === 6) {
      for (let i = 0; i < 6; i++) {
        this.otpForm.get(`digit${i}`)?.setValue(digits[i]);
        const input = this.otpInputs.toArray()[i];
        if (input) {
          input.nativeElement.value = digits[i];
        }
      }
      // Focus last input
      const lastInput = this.otpInputs.toArray()[5];
      if (lastInput) {
        lastInput.nativeElement.focus();
      }
    }
  }

  async onSubmit(): Promise<void> {
    if (this.otpForm.invalid) {
      this.isOtpInvalid = true;
      this.errorMessage = 'Please enter all 6 digits.';
      return;
    }

    const otp = this.getOtpValue();
    if (otp.length !== 6) {
      this.isOtpInvalid = true;
      this.errorMessage = 'Please enter a valid 6-digit code.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    // Bắt đầu cooldown khi gửi OTP lần đầu nếu chưa cooldown
    if (!this.isResendCooldown) {
      this.startResendCooldown();
    }

    if (!this.isBrowser) return;

    try {
      const response = await this.verifyOtp(this.userEmail, otp);

      if (response.ok) {
        this.successMessage = 'Verification successful! Redirecting to login...';
        localStorage.removeItem('verifyEmail');
        
        setTimeout(() => {
          this.router.navigate(['/auth/login']);
        }, 2000);
      } else {
        const errorData = await response.json();
        this.errorMessage = errorData.message || 'Invalid verification code.';
        this.isOtpInvalid = true;
        this.clearOtp();
      }
    } catch (error: any) {
      this.errorMessage = 'Network error. Please try again.';
      console.error('OTP verification error:', error);
    } finally {
      this.isLoading = false;
    }
  }

  async resendOtp(): Promise<void> {
    if (!this.userEmail) {
      this.errorMessage = 'Email not found. Please go back to signup.';
      return;
    }

    this.isResending = true;
    this.errorMessage = '';
    this.successMessage = '';

    try {
      const response = await this.requestResendOtp(this.userEmail);

      if (response.ok) {
        const data = await response.json();
        console.log("Resend response: ", data.message);
        this.successMessage = 'New code sent to your email!';
        this.startResendCooldown();
        this.clearOtp();
        this.focusFirstInput();
      } else {
        const errorData = await response.json();
        console.log("Resend response: ", errorData.message);
        this.errorMessage = 'Failed to resend code.';
        this.successMessage = '';
      }
    } catch (error: any) {
      this.errorMessage = 'Network error. Please try again.';
      this.successMessage = '';
      console.error('Resend OTP error:', error);
    } finally {
      this.isResending = false;
    }
  }

  private getOtpValue(): string {
    let otp = '';
    for (let i = 0; i < 6; i++) {
      otp += this.otpForm.get(`digit${i}`)?.value || '';
    }
    return otp;
  }

  private clearOtp(): void {
    for (let i = 0; i < 6; i++) {
      this.otpForm.get(`digit${i}`)?.setValue('');
    }
    this.focusFirstInput();
  }

  private startResendCooldown(): void {
    this.isResendCooldown = true;
    this.resendCountdown = 60; // 60 seconds cooldown

    this.countdownSubscription = interval(1000).subscribe(() => {
      this.resendCountdown--;
      if (this.resendCountdown <= 0) {
        this.isResendCooldown = false;
        this.countdownSubscription?.unsubscribe();
      }
    });
  }

  private async verifyOtp(email: string, otp: string): Promise<Response> {
    const baseUrl = 'http://localhost:3000'; // Replace with your API base URL
    
    return fetch(`${baseUrl}/auth/validate-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        email: email, 
        inputOTP: otp 
      })
    });
  }

  private async requestResendOtp(email: string): Promise<Response> {
    const baseUrl = 'http://localhost:3000'; // Replace with your API base URL
    
    return fetch(`${baseUrl}/auth/resend-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email: email })
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