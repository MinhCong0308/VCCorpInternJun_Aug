import { Routes } from '@angular/router';
import { AuthModule } from './auth/auth.module';
import { BlogOwnerModule } from './blog-owner/blog-owner.module';

export const routes: Routes = [
  { path: 'auth', loadChildren: () => AuthModule },
  { path: 'blog-owner', loadChildren: () => BlogOwnerModule},
];
