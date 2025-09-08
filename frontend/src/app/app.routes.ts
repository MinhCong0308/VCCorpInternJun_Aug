import { Routes } from '@angular/router';
import { HomeModule } from './home/home.module';
import { AuthModule } from './auth/auth.module';
import { BlogOwnerModule } from './blog-owner/blog-owner.module';
import { UseraccountModule } from './useraccount/useraccount.module';
import { AdminModule } from './admin/admin.module';
import { authGuard } from './core/guards/auth.guard';
import { PostModule } from './post/post.module';
import { BlogLayoutComponent } from './layouts/blog-layout/blog-layout.component';
import { AdminLayoutComponent } from './layouts/admin-layout/admin-layout.component';
import { LoginComponent as AdminLoginComponent } from './admin/login/login.component';
import { permissionGuard } from './core/guards/permission.guard';

export const routes: Routes = [
  // Admin login should NOT use AdminLayout; define it before the AdminLayout route
  { path: 'admin/login', component: AdminLoginComponent },
  {
    path: '',
    component: BlogLayoutComponent,
    children: [
      { path: '', loadChildren: () => HomeModule },
      { path: 'post-detail', loadChildren: () => PostModule },
      { path: 'auth', loadChildren: () => AuthModule },
      {
        path: 'useraccount',
        loadChildren: () => UseraccountModule,
        canActivate: [authGuard],
      },
      {
        path: 'blog-owner',
        loadChildren: () => BlogOwnerModule,
        canActivate: [authGuard, permissionGuard],
      },
    ],
  },
  {
    path: 'admin',
    component: AdminLayoutComponent,
    loadChildren: () => AdminModule,
  },
  { path: '**', redirectTo: '' }, // Redirect any unknown paths to home
];
