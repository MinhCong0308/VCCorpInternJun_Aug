import {
  Component,
  AfterViewInit,
  OnDestroy,
  ElementRef,
  Renderer2,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-admin-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  standalone: true,
  imports: [CommonModule]
})
export class LoginComponent implements AfterViewInit, OnDestroy {
  private formCleanup: (() => void) | null = null;
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  private router = inject(Router);
  private authService = inject(AuthService);

  constructor(private elRef: ElementRef, private renderer: Renderer2) {}

  ngAfterViewInit(): void {
    const formEl: HTMLFormElement | null =
      this.elRef.nativeElement.querySelector('form');
    // Be robust: try name, then type=email, then type=text
    const emailInput: HTMLInputElement | null =
      this.elRef.nativeElement.querySelector(
        'input[name="email"], input[type="email"], input[type="text"]'
      );
    const passwordInput: HTMLInputElement | null =
      this.elRef.nativeElement.querySelector(
        'input[name="password"], input[type="password"]'
      );

    if (!formEl || !emailInput || !passwordInput) {
      console.warn('Admin Login: form or inputs not found in template');
      return;
    }

    this.formCleanup = this.renderer.listen(formEl, 'submit', (evt: Event) => {
      evt.preventDefault();
      this.errorMessage = '';
      this.successMessage = '';

      const email = emailInput.value?.trim();
      const password = passwordInput.value ?? '';

      // Debug: trace values presence, not sensitive content
      console.debug('[AdminLogin] Submitting form', {
        hasEmail: !!email,
        hasPassword: !!password,
      });

      if (!email || !this.isValidEmail(email)) {
        this.errorMessage = 'Please enter a valid email address.';
        return;
      }
      if (!password) {
        this.errorMessage = 'Password is required.';
        return;
      }

      this.isLoading = true;
      this.authService.adminLogin(email, password).subscribe({
        next: (res) => {
          console.debug('[AdminLogin] Response', res);
          if (res?.success) {
            this.successMessage = 'Login successful! Redirecting...';
            setTimeout(() => {
              this.router.navigate(['/admin/dashboard']);
            }, 1000);
          } else {
            this.errorMessage = 'Username or password is not correct. Please try again';
          }
        },
        error: (err) => {
          console.error('[AdminLogin] Error', err);
          this.errorMessage = err?.message || 'Login failed.';
        },
        complete: () => {
          this.isLoading = false;
        },
      });
    });
  }

  ngOnDestroy(): void {
    if (this.formCleanup) {
      this.formCleanup();
      this.formCleanup = null;
    }
  }

  private isValidEmail(email: string): boolean {
    return /[^\s@]+@[^\s@]+\.[^\s@]+/.test(email);
  }
}
