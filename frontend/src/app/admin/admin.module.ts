import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminRoutingModule } from './admin-routing.module';
import { AdminLayoutComponent } from '../layouts/admin-layout/admin-layout.component';
import { CategoryComponent } from './category/category.component';

@NgModule({
  imports: [
    CommonModule,
    AdminRoutingModule,
    AdminLayoutComponent,
    CategoryComponent,
  ],
})
export class AdminModule {}
