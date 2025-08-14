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

  console.log('🔒 AUTH GUARD: Starting for route:', state.url, 'at', new Date().toLocaleTimeString());

  // ✅ Allow navigation on server-side during SSR
  if (!isPlatformBrowser(platformId)) {
    console.log('🔒 AUTH GUARD: Server-side - allowing navigation');
    return of(true);
  }

  console.log('🔒 AUTH GUARD: Client-side - will check session after delay...');
  
  // ✅ Add small delay to allow Angular hydration to complete
  return timer(100).pipe(
    tap(() => console.log('🔒 AUTH GUARD: Delay complete, checking session now...')),
    switchMap(() => authService.checkSession()),
    timeout(10000),
    take(1),
    tap(valid => console.log('🔒 AUTH GUARD: Got session result:', valid)),
    map(valid => {
      if (!valid) {
        console.log('🔒 AUTH GUARD: ❌ Session INVALID - will redirect to login');
        setTimeout(() => {
          console.log('🔒 AUTH GUARD: Executing redirect to login now...');
          router.navigate(['/auth/login'], { replaceUrl: true });
        }, 50);
        return false;
      }
      console.log('🔒 AUTH GUARD: ✅ Session VALID - allowing access to:', state.url);
      return true;
    }),
    catchError((error) => {
      console.log('🔒 AUTH GUARD: ❌ ERROR occurred:', error.name, error.message);
      setTimeout(() => {
        console.log('🔒 AUTH GUARD: Executing redirect to login due to error...');
        router.navigate(['/auth/login'], { replaceUrl: true });
      }, 50);
      return of(false);
    })
  );
};