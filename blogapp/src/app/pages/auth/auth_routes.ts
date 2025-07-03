import {Routes} from '@angular/router';
import {Login} from './login/login';
import {Register} from './register/register'; // Uncomment if Register component is implemented
// route configuration for the auth module (login, register...)
export const authRoutes: Routes = [
  { path: 'auth/login', component: Login },
  { path: 'auth/register', component: Register },
];