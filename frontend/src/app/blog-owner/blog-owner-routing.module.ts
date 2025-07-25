import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CreateBlogComponent } from './create-blog/create-blog.component';
const routes: Routes = [
  { path: 'create', component: CreateBlogComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class BlogOwnerRoutingModule { }
