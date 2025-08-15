import { Component, Inject, OnDestroy, OnInit, AfterViewInit, Renderer2, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, DOCUMENT } from '@angular/common';
import { AssetLoaderService } from '../../core/services/asset-loader.service';


@Component({
  selector: 'app-blog-layout',
  templateUrl: './blog-layout.component.html',
  styleUrls: ['./blog-layout.component.css'],
  standalone: false,
})
export class BlogLayoutComponent implements OnInit, AfterViewInit, OnDestroy {
  cssLoaded: Boolean = false;
  fontsLoaded: Boolean = false;
  private urls = {
    fonts: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&family=Playfair+Display:wght@700&display=swap',
    themify: 'assets/fonts/themify-icons/themify-icons.css',
    bs5css: 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css',
    blogcss: 'assets/css/home_style.css',
    bs5js: 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js',
  };

  constructor(
    private assets: AssetLoaderService,
    private r2: Renderer2,
    @Inject(PLATFORM_ID) private platformId: object,
    @Inject(DOCUMENT) private doc: Document
  ) {}

  ngOnInit() {
    if (!isPlatformBrowser(this.platformId)) return;
    this.r2.addClass(this.doc.body, 'blog-mode');
  }

  async ngAfterViewInit() {
    if (!isPlatformBrowser(this.platformId)) return;
    // CSS cho blog
    this.assets.loadCss(this.urls.bs5css);
    this.assets.loadCss(this.urls.fonts);
    this.assets.loadCss(this.urls.themify);
    this.assets.loadCss(this.urls.blogcss);
    // JS Bootstrap 5 (chỉ blog mới nạp)
    await this.assets.loadJs(this.urls.bs5js);
    this.cssLoaded = true;
    this.fontsLoaded = true;
  }

  ngOnDestroy() {
    if (!isPlatformBrowser(this.platformId)) return;
    this.r2.removeClass(this.doc.body, 'blog-mode');
    this.assets.removeMany([
      this.urls.bs5js,
      this.urls.blogcss,
      this.urls.themify,
      this.urls.fonts,
      this.urls.bs5css,
    ]);
  }
}

