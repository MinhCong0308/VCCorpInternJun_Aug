import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Login } from './login/login';    
import { RouterModule } from '@angular/router';
import { authRoutes } from './auth_routes';



@NgModule({
  declarations: [Login],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule.forChild(authRoutes) // Register auth routes
  ],
})
export class AuthModule { }
