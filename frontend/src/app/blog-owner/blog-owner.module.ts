import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BlogOwnerRoutingModule } from './blog-owner-routing.module';
import { CreateBlogComponent } from './create-blog/create-blog.component';
import { FormsModule } from '@angular/forms';

@NgModule({
  declarations: [CreateBlogComponent],
  imports: [
    CommonModule,
    FormsModule,
    BlogOwnerRoutingModule
  ]
})
export class BlogOwnerModule { }
