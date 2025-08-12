import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminLayoutComponent } from '../layouts/admin-layout/admin-layout.component';

const routes: Routes = [
  {
    path: '',
    component: AdminLayoutComponent,
    children: [
      { path: '', redirectTo: 'categories', pathMatch: 'full' },
      {
        path: 'categories',
        loadComponent: () =>
          import('./category/category.component').then(
            (m) => m.CategoryComponent
          ),
      },
      // { path: 'post', loadComponent: ... },
      // { path: 'user', loadComponent: ... },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AdminRoutingModule {}
