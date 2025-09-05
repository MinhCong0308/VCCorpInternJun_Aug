import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AuthRoutingModule } from './auth-routing.module';
import { LoginComponent } from './login/login.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SignupComponent } from './signup/signup.component';
import { VerifyOtpComponent } from './verify-otp/verify-otp.component';
import { TranslateModule } from '@ngx-translate/core';

@NgModule({
  declarations: [LoginComponent, SignupComponent, VerifyOtpComponent],
  imports: [
    CommonModule,
    AuthRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    TranslateModule
  ]
})
export class AuthModule { }
