import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CategoryComponent } from './category/category.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { LanguageComponent } from './language/language.component';
import { UserComponent } from './user/user.component';
import { PostComponent } from './post/post.component';
import { adminGuard } from '../core/guards/admin.guard';
import { ViewPostComponent } from './view-post/view-post.component';

const routes: Routes = [
  {
    path: '',
    canActivateChild: [adminGuard],
    children: [
      { path: '', component: DashboardComponent },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'categories', component: CategoryComponent },
      { path: 'languages', component: LanguageComponent },
      { path: 'users', component: UserComponent },
      { path: 'posts', component: PostComponent },
      { path: 'posts/:postid', component: ViewPostComponent },
    ],
  },

  // Thêm các path đến các trang vào đây, đừng thêm vào app.routes.ts nhé
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AdminRoutingModule {}
