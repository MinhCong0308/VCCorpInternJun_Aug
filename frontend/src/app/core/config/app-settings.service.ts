import { Injectable } from '@angular/core';
import { HttpBackend, HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export interface AppSettings {
  defaults: { userAvatar: string; postCover: string; };
}

const FALLBACK: AppSettings = {
  defaults: {
    userAvatar: 'https://randomuser.me/api/portraits/lego/1.jpg',
    postCover: 'https://hatrabbits.com/wp-content/uploads/2017/01/random.jpg',
  },
};

@Injectable({ providedIn: 'root' })
export class AppSettingsService {
  settings: AppSettings = FALLBACK;

  constructor(private httpBackend: HttpBackend) {}

  async load(): Promise<void> {
    const http = new HttpClient(this.httpBackend); // bypass interceptors
    try {
      const loaded = await firstValueFrom(
        http.get<AppSettings>('assets/app.settings.json')
      );
      this.settings = {
        defaults: { ...FALLBACK.defaults, ...(loaded?.defaults || {}) },
      };
    } catch {
      this.settings = FALLBACK;
    }
  }

  get defaults() {
    return this.settings.defaults;
  }
}