import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { UseraccountRoutingModule } from './useraccount-routing.module';
import { AccountComponent } from './account/account.component';

@NgModule({
  declarations: [AccountComponent],
  imports: [
    CommonModule,
    UseraccountRoutingModule,
    FormsModule
  ]
})
export class UseraccountModule { }
