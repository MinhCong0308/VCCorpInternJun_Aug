import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { AbstractControl } from '@angular/forms';


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

  constructor(
    private fb: FormBuilder,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    this.initializeForm();    
    if (this.isLoggedIn()) {
      this.router.navigate(['/home']);
    }
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

    try {
      const formData = this.signupForm.value;
      const response = await this.signup(formData);

      if (response.ok) {
        this.successMessage = 'Signup successful! Please verify your email.';
        localStorage.setItem('verifyEmail', formData.email);
        
        // Redirect after short delay
        setTimeout(() => {
          this.router.navigate(['/auth/verify-otp']);
        }, 1500);
      } else {
        const errorData = await response.json();
        this.errorMessage = errorData.message || 'Signup failed!';
      }
    } catch (error: any) {
      this.errorMessage = 'Network error. Please try again.';
      console.error('Signup error:', error);
    } finally {
      this.isLoading = false;
    }
  }

  handleGoogleSignup(): void {
    this.isLoading = true;
    const baseUrl = 'http://localhost:3000'; // Replace with your API base URL
    const authUrl = `${baseUrl}/auth/oauth/google?signup=true`;
    window.location.href = authUrl;
  }

  private async signup(formData: any): Promise<Response> {
    const baseUrl = 'http://localhost:3000'; // Replace with your API base URL
    
    const signupData = {
      firstname: formData.firstName,
      lastname: formData.lastName,
      username: formData.username,
      email: formData.email,
      password: formData.password,
      confirm_password: formData.confirmPassword
    };

    return fetch(`${baseUrl}/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(signupData)
    });
  }

  private isLoggedIn(): boolean {
    return this.isBrowser && !!localStorage.getItem('accessToken');
  }

  private markAllFieldsAsTouched(): void {
    Object.keys(this.signupForm.controls).forEach(key => {
      this.signupForm.get(key)?.markAsTouched();
    });
  }
}