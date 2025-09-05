import { ApplicationConfig, inject, PLATFORM_ID, provideAppInitializer, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding, withInMemoryScrolling, withRouterConfig } from '@angular/router';

import { routes } from './app.routes';
import {
  provideClientHydration,
  withEventReplay,
} from '@angular/platform-browser';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { tokenInterceptor } from './core/interceptors/token.interceptor';
import { provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import { isPlatformBrowser } from '@angular/common';
import { AppSettingsService } from './core/config/app-settings.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }), 
    provideRouter(routes, 
      withComponentInputBinding(), 
      withInMemoryScrolling({
        scrollPositionRestoration: 'enabled',
        anchorScrolling: 'enabled',
      }),
), 
    provideClientHydration(withEventReplay()),
    provideHttpClient(withInterceptors([tokenInterceptor]), withFetch()),
    provideTranslateService({
      fallbackLang: 'en',
      loader: provideTranslateHttpLoader({
        prefix: 'assets/i18n/',
        suffix: '.json',
        useHttpBackend: true,  // bypass HttpInterceptors khi load JSON
        // enforceLoading: true // (tuỳ chọn) chống cache khi dev
      }),
    }),
    provideAppInitializer(() => {
      const platformId = inject(PLATFORM_ID);
      if (!isPlatformBrowser(platformId)) {
        return;
      }
      const settings = inject(AppSettingsService);
      // Trả Promise để Angular đợi load xong rồi mới bootstrap
      return settings.load();
    }),
  ],
};
