import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminRoutingModule } from './admin-routing.module';
import { AdminLayoutModule } from '../layouts/admin-layout/admin-layout.module';

@NgModule({
  imports: [CommonModule, AdminRoutingModule, AdminLayoutModule],
})
export class AdminModule {}
