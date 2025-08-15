import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import e from 'express';

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
    @Inject(PLATFORM_ID) private platformId: Object,
    private authService: AuthService
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  async ngOnInit(): Promise<void> {
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
          console.log("Jump here");
          console.log('Response:', response);
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
