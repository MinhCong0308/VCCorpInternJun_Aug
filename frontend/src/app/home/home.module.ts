import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HomePageComponent } from './home-page/home-page.component';
import { HomeRoutingModule } from './home-routing.module';
import { FormsModule } from '@angular/forms';
import { BlogLayoutComponent } from '../layouts/blog-layout/blog-layout.component';

@NgModule({
  declarations: [BlogLayoutComponent, HomePageComponent],
  imports: [
    CommonModule,
    HomeRoutingModule,
    FormsModule,
  ]
})
export class HomeModule { }
