import { Component } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
@Component({
  selector: 'app-register',
  standalone: false,
  templateUrl: './register.html',
  styleUrls: ['./register.css']
})
export class Register {
  name: string = '';
  email: string = '';
  password: string = '';
  constructor(private router: Router) {}

  register(form: NgForm): void {
    if (form.valid) {
        console.log(`Registered with name: ${this.name}, email: ${this.email}`);
        alert(`Registered with name: ${this.name}, email: ${this.email}`);
        this.router.navigate(['/auth/login']); // Redirect to login page after registration
    } else {
      alert('Please fill in all required fields.');
    } 
  }
}
