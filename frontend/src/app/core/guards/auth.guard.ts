import { CanActivateFn } from '@angular/router';
import { inject, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { map, take, timeout, catchError, switchMap, tap } from 'rxjs/operators';
import { isPlatformBrowser } from '@angular/common';
import { of, timer } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);


  if (!isPlatformBrowser(platformId)) {
    return of(true);
  }

  // console.log('🔒 AUTH GUARD: Client-side - will check session after delay...');
  
  return timer(100).pipe(
    switchMap(() => authService.checkSession()),
    timeout(10000),
    take(1),
    map(valid => {
      if (!valid) {
        setTimeout(() => {
          router.navigate(['/auth/login'], { replaceUrl: true });
        }, 50);
        return false;
      }
      return true;
    }),
    catchError((error) => {
      setTimeout(() => {
        router.navigate(['/auth/login'], { replaceUrl: true });
      }, 50);
      return of(false);
    })
  );
};