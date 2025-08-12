import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AdminLayoutComponent } from './admin-layout.component';

// Không import AdminRoutingModule ở đây nữa, chỉ import ở AdminModule

@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    AdminLayoutComponent,
  ],
  exports: [AdminLayoutComponent],
})
export class AdminLayoutModule {}
