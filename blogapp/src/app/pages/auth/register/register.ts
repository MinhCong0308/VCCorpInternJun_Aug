import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-register',
  templateUrl: './register.html',
  imports: [CommonModule, FormsModule, RouterModule],
  styleUrls: ['./register.css']
})
export class Register {
  email: string = '';
  password: string = '';
  constructor(private router: Router) {}

  register(): void {
    console.log('Registering user...');
    if (this.email && this.password) {
        console.log(`Registered with email: ${this.email}`);
        alert(`Registered with email: ${this.email}`);
        this.router.navigate(['/auth/login']); // Redirect to login page after registration
    } else {
      alert('Please fill in all required fields.');
    } 
  }
}
