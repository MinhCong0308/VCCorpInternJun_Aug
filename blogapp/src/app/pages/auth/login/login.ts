import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.html',
  standalone: false,
  styleUrls: ['./login.css']
})
export class Login {
  email: string = '';
  password: string = '';
  constructor(private router: Router) {}
  login(): void {
    if(this.email && this.password) {
      alert(`Logged in with email: ${this.email}`);
      console.log(`Logged in with email: ${this.email}`);
      this.router.navigate(['/home']); // Redirect to home page after login
    } else {
      alert('Please enter both email and password.');
    }
  }
  socialLogin(provider: string): void {
    // Here you would typically handle social login with the provider
    console.log(`Logging in with ${provider}`);
    // Redirect to home page after social login
    this.router.navigate(['/home']);
  }
}
