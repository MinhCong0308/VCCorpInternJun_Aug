import { Injectable, Inject, PLATFORM_ID} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import {createStore, get, set, del} from 'idb-keyval';
@Injectable({
  providedIn: 'root'
})
export class DraftService {
  private enabled: boolean;
  private store: ReturnType<typeof createStore> | null;
  constructor(@Inject(PLATFORM_ID) platformId: Object) { 
    this.enabled = isPlatformBrowser(platformId);
    this.store = this.enabled ? createStore('blog-db', 'drafts') : null;
    if (this.enabled && (navigator as any).storage?.persist) {
      (navigator as any).storage.persist().catch(() => {});
    }
  }
  async load<T>(key: IDBValidKey): Promise<T | undefined> {
    if (!this.store) return undefined;
    return get<T>(key, this.store);
  }
  async save<T>(key: IDBValidKey, value: T): Promise<void> {
    if (!this.store) return;
    await set(key, value, this.store);
  }
  async clear(key: IDBValidKey): Promise<void> {
    if (!this.store) return;
    await del(key, this.store);
  }
}
