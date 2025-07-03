import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Login } from './login/login';    
import { RouterModule } from '@angular/router';
import { authRoutes } from './auth_routes';
import { Register } from './register/register';


@NgModule({
  declarations: [Login, Register],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule, // Import RouterModule for routing
    RouterModule.forChild(authRoutes) // Register auth routes
  ],
})
export class AuthModule { }
