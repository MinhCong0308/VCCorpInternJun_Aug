import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { UseraccountRoutingModule } from './useraccount-routing.module';
import { AccountComponent } from './account/account.component';
import { BlogManageComponent } from './blog-manage/blog-manage.component';
import { UseraccountService } from './useraccount.service';

@NgModule({
  declarations: [AccountComponent, BlogManageComponent],
  imports: [
    CommonModule,
    UseraccountRoutingModule,
    FormsModule
  ]
})
export class UseraccountModule { }
