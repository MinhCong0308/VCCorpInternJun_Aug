import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BlogOwnerRoutingModule } from './blog-owner-routing.module';
import { CreateBlogComponent } from './create-blog/create-blog.component';
import { FormsModule } from '@angular/forms';
import { QuillModule } from 'ngx-quill';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';


@NgModule({
  declarations: [CreateBlogComponent],
  imports: [
    CommonModule,
    QuillModule,
    ReactiveFormsModule,
    RouterModule,
    FormsModule,
    BlogOwnerRoutingModule,
    HttpClientModule
  ]
})
export class BlogOwnerModule { }
