import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map, catchError } from 'rxjs/operators';
import { UserPermissionService } from '../services/user-permission.service';

export const permissionGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const permissionService = inject(UserPermissionService);
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
  if (!currentUser?.userid) {
    router.navigate(['/']);
    return false;
  }
  return permissionService.getUserPermissions(currentUser.userid).pipe(
    // Nếu không có quyền viết bài thì chuyển về home
    // Nếu có thì cho phép truy cập
    // Có thể dùng map hoặc tap tuỳ ý
    // Nếu lỗi backend thì cũng chuyển về home
    map(perms => {
      if (!perms.can_write_post) {
        router.navigate(['/']);
        return false;
      }
      return true;
    }),
    catchError(() => {
      router.navigate(['/']);
      return [false];
    })
  );
};
