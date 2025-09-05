import { Component, inject, PLATFORM_ID } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NotificationComponent } from './shared/components/notification/notification.component';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NotificationComponent, TranslateModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'frontend';
  private translate = inject(TranslateService);
  private platformId = inject(PLATFORM_ID);
  private doc = inject(DOCUMENT);

  constructor() {
    const isBrowser = isPlatformBrowser(this.platformId);
    this.translate.addLangs(['en', 'vi', 'fr']);
    this.translate.setFallbackLang?.('en');

    // 🔒 Chỉ động vào localStorage & document trên trình duyệt
    const saved = isBrowser ? localStorage.getItem('lang') : null;
    const initial = saved || 'en';

    if (isBrowser) {
      this.translate.use(initial);            // kích hoạt ngôn ngữ hiện tại (client)
      this.doc.documentElement.lang = initial;
    }
  }
}
