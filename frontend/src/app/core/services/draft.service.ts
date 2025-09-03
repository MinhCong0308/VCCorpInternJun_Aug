import { Injectable, Inject, PLATFORM_ID} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import {createStore, get, set, del, keys} from 'idb-keyval';
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
  async debugListKeys() {
    if (!this.store) return;
    const ks = await keys(this.store);
    console.log('[IDB] keys in blog-db/drafts =', ks);
  }
  async clear(key: IDBValidKey): Promise<boolean> {
    if (!this.store) {
      console.log("No store huhhu");
      return false;
    }
    this.debugListKeys();
    const before = await get(key, this.store);
    console.log('[IDB] before delete exists?', before !== undefined, 'key=', key, 'type=', typeof key);

    await del(key, this.store);

    // Optional: small microtask yield to let DevTools catch up; not strictly required.
    await Promise.resolve();

    const after = await get(key, this.store);
    console.log('[IDB] after delete exists?', after !== undefined);

    // Extra diagnostics: list keys to confirm we’re in the same store
    const ks = await keys(this.store);
    console.log('[IDB] keys now:', ks);

    return after === undefined;
  }
}
