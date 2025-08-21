import { Inject, Pipe, PipeTransform, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

type ExcerptOpts = {
  limit?: number;               
  by?: 'chars' | 'words';       
  suffix?: string;              // đuôi khi cắt, mặc định '…'
  preserveCase?: boolean;       
};

@Pipe({ name: 'excerpt', pure: true })
export class ExcerptPipe implements PipeTransform {
  private readonly isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  transform(html: any, opts: ExcerptOpts = {}): string {
    if (!html) return '';

    const limit = Math.max(1, opts.limit ?? 130);
    const by = opts.by ?? 'chars';
    const suffix = opts.suffix ?? '…';

    // HTML -> text
    let text = '';
    if (this.isBrowser) {
      const div = document.createElement('div');
      div.innerHTML = String(html);
      text = (div.textContent || div.innerText || '').toString();
    } else {
      // Fallback khi SSR: tách thẻ đơn giản, chấp nhận không hoàn hảo
      text = String(html).replace(/<[^>]+>/g, ' ');
      // Giải một số entity phổ biến
      text = text.replace(/&nbsp;/g, ' ')
                 .replace(/&amp;/g, '&')
                 .replace(/&lt;/g, '<')
                 .replace(/&gt;/g, '>');
    }

    // Chuẩn hoá khoảng trắng
    text = text.replace(/\s+/g, ' ').trim();

    if (!text) return '';

    // Cắt
    if (by === 'words') {
      const words = text.split(' ');
      if (words.length <= limit) return text;
      const cut = words.slice(0, limit).join(' ');
      return cut + suffix;
    } else {
      // by === 'chars'
      if (text.length <= limit) return text;
      // cắt “đẹp”: tìm khoảng trắng gần nhất trước limit
      let end = limit;
      const spaceIdx = text.lastIndexOf(' ', limit);
      if (spaceIdx >= limit * 0.6) end = spaceIdx; // tránh cắt giữa từ
      return text.slice(0, end).trimEnd() + suffix;
    }
  }
}
