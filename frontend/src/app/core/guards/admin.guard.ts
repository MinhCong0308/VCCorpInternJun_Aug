import { inject, PLATFORM_ID } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { catchError, map, of } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';

export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);

  // Avoid SSR hanging: skip HTTP checks on server-side rendering
  if (!isPlatformBrowser(platformId)) {
    return of(true);
  }

  return auth.me().pipe(
    map((res) => {
      const user = res?.data;
      const roles = user?.roles || [];
      const isAdmin =
        user?.role?.toString().toUpperCase() === 'ADMIN' ||
        roles.some(
          (r: any) => (r?.name || r)?.toString().toUpperCase() === 'ADMIN'
        );

      if (res?.success && isAdmin) return true;
      router.navigate(['/admin/login']);
      return false;
    }),
    catchError(() => {
      router.navigate(['/admin/login']);
      return of(false);
    })
  );
};
