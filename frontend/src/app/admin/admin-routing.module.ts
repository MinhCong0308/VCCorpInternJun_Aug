import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CategoryComponent } from './category/category.component';
import { adminGuard } from '../core/guards/admin.guard';

const routes: Routes = [
  {
    path: '',
    canActivateChild: [adminGuard],
    children: [{ path: 'categories', component: CategoryComponent }],
  },

  // Thêm các path đến các trang vào đây, đừng thêm vào app.routes.ts nhé
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AdminRoutingModule {}
