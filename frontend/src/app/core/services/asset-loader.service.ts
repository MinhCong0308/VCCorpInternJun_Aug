import { Injectable, Inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';

type Handle = { el: HTMLLinkElement | HTMLScriptElement, url: string };

@Injectable({
  providedIn: 'root'
})
export class AssetLoaderService {
  private added: Handle[] = [];
  constructor(@Inject(DOCUMENT) private doc: Document) {}

  loadCss(href: string): Handle {
    const exists = this.added.find(h => h.url === href);
    if (exists) return exists;

    const el = this.doc.createElement('link');
    el.rel = 'stylesheet';
    el.href = href;
    this.doc.head.appendChild(el);

    const handle = { el, url: href };
    this.added.push(handle);
    return handle;
  }

  loadJs(src: string): Promise<Handle> {
    const exists = this.added.find(h => h.url === src);
    if (exists) return Promise.resolve(exists);

    return new Promise((resolve, reject) => {
      const el = this.doc.createElement('script');
      el.src = src;
      el.async = false;
      el.onload = () => resolve(({ el, url: src }));
      el.onerror = reject;
      this.doc.body.appendChild(el);
      this.added.push({ el, url: src });
    });
  }

  remove(url: string) {
    const h = this.added.find(x => x.url === url);
    if (!h) return;
    h.el.parentNode?.removeChild(h.el);
    this.added = this.added.filter(x => x !== h);
  }

  removeMany(urls: string[]) {
    urls.forEach(u => this.remove(u));
  }

  removeAll() {
    this.added.forEach(h => h.el.parentNode?.removeChild(h.el));
    this.added = [];
  }
}
