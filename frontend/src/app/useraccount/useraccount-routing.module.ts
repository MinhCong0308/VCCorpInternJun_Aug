import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AccountComponent } from './account/account.component';
import { BlogManageComponent } from './blog-manage/blog-manage.component';

const routes: Routes = [{ path: 'account', component: AccountComponent},
                        { path: 'profile', component: BlogManageComponent }
                       ];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class UseraccountRoutingModule { }
