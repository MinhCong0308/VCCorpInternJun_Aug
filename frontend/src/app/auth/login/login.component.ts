import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';

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

  constructor(
    private fb: FormBuilder,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    this.initializeForm();

    if (this.isBrowser && this.isLoggedIn()) {
      this.router.navigate(['/home']);
    }

    if (this.isBrowser) {
      this.handleOAuthCallback();
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

  async onSubmit(): Promise<void> {
    if (this.loginForm.invalid) {
      this.markAllFieldsAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    try {
      const { email, password } = this.loginForm.value;
      const response = await this.login(email, password);

      if (response.ok) {
        const data = await response.json();

        if (this.isBrowser) {
          localStorage.setItem('accessToken', data.accessToken);
        }

        this.successMessage = 'Login successful! Redirecting...';

        setTimeout(() => {
          this.router.navigate(['/home']);
        }, 1000);
      } else {
        const errorData = await response.json();
        this.errorMessage = errorData.message || 'Login failed!';
      }
    } catch (error: any) {
      this.errorMessage = 'Network error. Please try again.';
      console.error('Login error:', error);
    } finally {
      this.isLoading = false;
    }
  }

  handleGoogleLogin(): void {
    if (!this.isBrowser) return;

    this.isLoading = true;
    const baseUrl = 'http://localhost:3000'; // your API base
    const authUrl = `${baseUrl}/auth/oauth/google`;
    window.location.href = authUrl;
  }

  private async login(email: string, password: string): Promise<Response> {
    const baseUrl = 'http://localhost:3000'; // your API base
    return fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
  }

  private isLoggedIn(): boolean {
    return this.isBrowser && !!localStorage.getItem('accessToken');
  }

  private handleOAuthCallback(): void {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const error = urlParams.get('error');

    if (token) {
      localStorage.setItem('accessToken', token);
      this.successMessage = 'Login successful! Redirecting...';
      window.history.replaceState({}, document.title, window.location.pathname);
      setTimeout(() => this.router.navigate(['/home']), 1000);
    } else if (error) {
      this.errorMessage = decodeURIComponent(error);
    }
  }

  private markAllFieldsAsTouched(): void {
    Object.values(this.loginForm.controls).forEach(control => {
      control.markAsTouched();
    });
  }

  logout(): void {
    if (this.isBrowser) {
      localStorage.removeItem('accessToken');
    }
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return this.isBrowser ? localStorage.getItem('accessToken') : null;
  }
}
