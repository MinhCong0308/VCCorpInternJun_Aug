import {Routes} from '@angular/router';
import {Login} from './login/login';
// route configuration for the auth module (login, register...)
export const authRoutes: Routes = [
  { path: 'auth/login', component: Login },
];