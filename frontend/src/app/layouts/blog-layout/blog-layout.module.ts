import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { BlogLayoutComponent } from './blog-layout.component';

@NgModule({
  declarations: [BlogLayoutComponent],
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
  ],
  exports: [BlogLayoutComponent],
})
export class BlogLayoutModule {}