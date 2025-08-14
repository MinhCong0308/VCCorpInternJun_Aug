import { Routes } from '@angular/router';
import { AuthModule } from './auth/auth.module';
import { BlogOwnerModule } from './blog-owner/blog-owner.module';
import { UseraccountModule } from './useraccount/useraccount.module';
import { AdminModule } from './admin/admin.module';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./home/home.module').then((m) => m.HomeModule),
  },
  { path: 'auth', loadChildren: () => AuthModule },
  { path: 'blog-owner', loadChildren: () => BlogOwnerModule, canActivate: [authGuard] },
  { path: 'useraccount', loadChildren: () => UseraccountModule, canActivate: [authGuard] },
  { path: 'admin', loadChildren: () => AdminModule },
  { path: '**', redirectTo: '' }, // Redirect any unknown paths to home
];
