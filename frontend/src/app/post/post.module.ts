import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PostDetailComponent } from './post-detail/post-detail.component';
import { PostRoutingModule } from './post-routing.module';
import { FormsModule } from '@angular/forms';
import { ExcerptPipe } from '../home/home-page/excerpt.pipe';

@NgModule({
  declarations: [PostDetailComponent],
  imports: [
    CommonModule,
    PostRoutingModule,
    FormsModule,
    ExcerptPipe,
  ]
})
export class PostModule { }
