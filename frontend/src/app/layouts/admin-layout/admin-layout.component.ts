import {
  Component,
  OnInit,
  AfterViewInit,
  Renderer2,
  Inject,
  PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-admin-layout',
  templateUrl: './admin-layout.component.html',
  styleUrls: ['./admin-layout.component.css'],
  standalone: true,
  imports: [CommonModule, RouterModule],
})
export class AdminLayoutComponent implements OnInit, AfterViewInit {
  private isBrowser = false;

  constructor(
    private renderer: Renderer2,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);
    if (this.isBrowser) {
      const body = document.body;
      this.renderer.addClass(body, 'hold-transition');
      this.renderer.addClass(body, 'sidebar-mini');
      this.renderer.addClass(body, 'layout-fixed');
    }
  }

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    if (!this.isBrowser) return;
    const w: any = window as any;
    setTimeout(() => {
      if (w.$) {
        try {
          w.$('[data-widget="treeview"]').Treeview?.('init');
        } catch (_) {}
      }
    });
  }
}
