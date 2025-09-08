import {
  Component,
  OnInit,
  AfterViewInit,
  OnDestroy,
  Renderer2,
  Inject,
  PLATFORM_ID,
} from '@angular/core';
import { AssetLoaderService } from '../../core/services/asset-loader.service';
import {
  CommonModule,
  isPlatformBrowser,
  DOCUMENT,
  NgIf,
} from '@angular/common';
import {
  RouterLink,
  RouterOutlet,
  RouterLinkActive,
  Router,
} from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-admin-layout',
  templateUrl: './admin-layout.component.html',
  styleUrls: ['./admin-layout.component.css'],
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet, NgIf],
})
export class AdminLayoutComponent implements OnInit, AfterViewInit, OnDestroy {
  private urls = {
    // Fonts trước, để AdminLTE có font chuẩn của nó
    ssp: 'https://fonts.googleapis.com/css?family=Source+Sans+Pro:300,400,400i,700&display=fallback',
    fa: 'https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@5.15.4/css/all.min.css',
    alcss:
      'https://cdn.jsdelivr.net/npm/admin-lte@3.2/dist/css/adminlte.min.css',
    jq: 'https://cdn.jsdelivr.net/npm/jquery@3.6.0/dist/jquery.min.js',
    bs4: 'https://cdn.jsdelivr.net/npm/bootstrap@4.6.2/dist/js/bootstrap.bundle.min.js',
    aljs: 'https://cdn.jsdelivr.net/npm/admin-lte@3.2/dist/js/adminlte.min.js',
  };

  constructor(
    private renderer: Renderer2,
    private assets: AssetLoaderService,
    private authService: AuthService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object,
    @Inject(DOCUMENT) private doc: Document
  ) {}

  ngOnInit() {
    if (!isPlatformBrowser(this.platformId)) return;
    // 1) Thêm body classes kiểu AdminLTE
    this.renderer.addClass(this.doc.body, 'admin-mode');
    this.renderer.addClass(this.doc.body, 'hold-transition');
    this.renderer.addClass(this.doc.body, 'sidebar-mini');
    this.renderer.addClass(this.doc.body, 'layout-fixed');
  }

  async ngAfterViewInit() {
    if (!isPlatformBrowser(this.platformId)) return;

    // 2) Nạp CSS theo đúng thứ tự: FA -> AdminLTE
    this.assets.loadCss(this.urls.ssp);
    this.assets.loadCss(this.urls.fa);
    this.assets.loadCss(this.urls.alcss);

    // 3) Nạp JS (theo thứ tự: jQuery -> Bootstrap 4 bundle -> AdminLTE)
    await this.assets.loadJs(this.urls.jq);
    await this.assets.loadJs(this.urls.bs4);
    await this.assets.loadJs(this.urls.aljs);

    // Bật lại transition của AdminLTE
    this.renderer.removeClass(this.doc.body, 'hold-transition');
  }

  ngOnDestroy() {
    if (!isPlatformBrowser(this.platformId)) return;
    // Gỡ body classes
    this.renderer.removeClass(this.doc.body, 'admin-mode');
    this.renderer.removeClass(this.doc.body, 'hold-transition');
    this.renderer.removeClass(this.doc.body, 'sidebar-mini');
    this.renderer.removeClass(this.doc.body, 'layout-fixed');

    this.assets.removeMany([
      this.urls.aljs,
      this.urls.bs4,
      this.urls.jq,
      this.urls.alcss,
      this.urls.fa,
      this.urls.ssp,
    ]);
  }

  logout(): void {
    this.authService
      .logout()
      .pipe(finalize(() => this.router.navigate(['/admin/login'])))
      .subscribe({
        next: () => {},
        error: () => {},
      });
  }
  backToBlog(): void {
    this.authService
      .logout()
      .pipe(finalize(() => this.router.navigate(['/'])))
      .subscribe({
        next: () => {},
        error: () => {},
      });
  }
}
