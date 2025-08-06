import { Routes } from '@angular/router';
import { AuthModule } from './auth/auth.module';
import { BlogOwnerModule } from './blog-owner/blog-owner.module';
import { UseraccountModule } from './useraccount/useraccount.module';

export const routes: Routes = [
  { path: '', loadChildren: () => import('./home/home.module').then(m => m.HomeModule) },
  { path: 'auth', loadChildren: () => AuthModule },
  { path: 'blog-owner', loadChildren: () => BlogOwnerModule},
  { path: 'useraccount', loadChildren: () => UseraccountModule },
  { path: '**', redirectTo: '' } // Redirect any unknown paths to home
];
