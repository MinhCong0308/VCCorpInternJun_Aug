import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { of } from 'rxjs';
import { switchMap, map, catchError } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { AccountService } from '../services/account.service';
import { UserPermissionService } from '../services/user-permission.service';

export const permissionGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const authService = inject(AuthService);
  const accountService = inject(AccountService);
  const permissionService = inject(UserPermissionService);

  return authService.checkSession().pipe(
    switchMap((ok: boolean) => {
      if (!ok) return of(router.createUrlTree(['/']));
      return accountService.getProfile();
    }),
    switchMap((profileRes: any | UrlTree) => {
      if (profileRes instanceof UrlTree) return of(profileRes);
      const userId = profileRes?.data?.userid;
      if (!userId) {
        return of(router.createUrlTree(['/']));
      }
      return permissionService.getUserPermissions(userId).pipe(
        map(perms => {
          // Chỉ cho vào nếu có quyền viết bài
          return perms?.can_write_post ? true : router.createUrlTree(['/']);
        })
      );
    }),
    // Bất kỳ lỗi nào -> về trang chủ
    catchError(() => of(router.createUrlTree(['/'])))
  );
};