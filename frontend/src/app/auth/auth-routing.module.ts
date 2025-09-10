import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { SignupComponent } from './signup/signup.component';
import { VerifyOtpComponent } from './verify-otp/verify-otp.component';
import { ChangePasswordComponent } from './change-password/change-password.component';
import { authGuard } from '../core/guards/auth.guard';
import { ResetPasswordComponent } from './reset-password/reset-password.component';
import { ResetNewPasswordComponent } from './reset-new-password/reset-new-password.component';

const routes: Routes = [
  // { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'signup', component: SignupComponent },
  { path: 'verify-otp', component: VerifyOtpComponent },
  { path: 'change-password', component: ChangePasswordComponent },
  { path: 'forgot-password', component: ResetPasswordComponent },
  {path: 'reset-password', component: ResetNewPasswordComponent}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AuthRoutingModule {}
