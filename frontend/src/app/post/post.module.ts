import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PostDetailComponent } from './post-detail/post-detail.component';
import { PostRoutingModule } from './post-routing.module';

@NgModule({
  declarations: [PostDetailComponent],
  imports: [
    CommonModule,
    PostRoutingModule
  ]
})
export class PostModule { }
