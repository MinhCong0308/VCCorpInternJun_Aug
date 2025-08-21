import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HomePageComponent } from './home-page/home-page.component';
import { HomeRoutingModule } from './home-routing.module';
import { FormsModule } from '@angular/forms';
import { BlogLayoutComponent } from '../layouts/blog-layout/blog-layout.component';
import { ExcerptPipe } from './home-page/excerpt.pipe';

@NgModule({
  declarations: [BlogLayoutComponent, HomePageComponent],
  imports: [
    CommonModule,
    HomeRoutingModule,
    FormsModule,
    ExcerptPipe,
  ]
})
export class HomeModule { }
