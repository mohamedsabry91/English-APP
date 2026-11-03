// The only file in the app that writes to the Cache API (checked by the repository scan).
// "Download for offline" stores a course's clips, from the app's own site only, in one cache
// that the service worker also reads (see runtimeCaching in vite.config.ts).
import { requestPersistence } from '../core/storage';

/** Must match cacheName for audio in vite.config.ts (checked by a unit test). */
export const AUDIO_CACHE = 'english-practice-audio';

const RELATIVE_CLIP = /^audio\/[a-z]{2,3}-from-[a-z]{2,3}\/[a-z0-9][a-z0-9-]*\.opus$/;

/** The part of CacheStorage this file uses, so tests can pass a fake. */
export interface CachesLike {
  open(name: string): Promise<{ addAll(urls: string[]): Promise<void>; match(url: string): Promise<unknown>; delete(url: string): Promise<boolean> }>;
}

export type DownloadResult = 'ok' | 'unavailable' | 'failed' | 'none';

const browserCaches = (): CachesLike | null => (typeof caches !== 'undefined' ? (caches as unknown as CachesLike) : null);

/** Only relative clip paths: never another host. */
function safe(urls: string[]): string[] | null {
  return urls.every((u) => RELATIVE_CLIP.test(u)) ? urls : null;
}

/** Download every clip of a course for offline use, and ask the browser to keep the app's data. */
export async function downloadClips(urls: string[], api: CachesLike | null = browserCaches(), persist: () => Promise<boolean> = requestPersistence): Promise<DownloadResult> {
  if (urls.length === 0) return 'none';
  const list = safe(urls);
  if (!list) return 'failed';
  if (!api) return 'unavailable';
  try {
    const cache = await api.open(AUDIO_CACHE);
    await cache.addAll(list);
    await persist();
    return 'ok';
  } catch {
    return 'failed';
  }
}

/** How many of these clips are already stored for offline use. */
export async function countDownloaded(urls: string[], api: CachesLike | null = browserCaches()): Promise<number> {
  const list = safe(urls);
  if (!list || !api) return 0;
  try {
    const cache = await api.open(AUDIO_CACHE);
    const found = await Promise.all(list.map((u) => cache.match(u)));
    return found.filter(Boolean).length;
  } catch {
    return 0;
  }
}

/** Remove a course's downloaded clips. */
export async function removeClips(urls: string[], api: CachesLike | null = browserCaches()): Promise<boolean> {
  const list = safe(urls);
  if (!list || !api) return false;
  try {
    const cache = await api.open(AUDIO_CACHE);
    await Promise.all(list.map((u) => cache.delete(u)));
    return true;
  } catch {
    return false;
  }
}
