// The only file in the app that writes to the Cache API (checked by the repository scan).
// "Download for offline" stores a course's clips, from the app's own site only, in one cache
// that the service worker also reads (see runtimeCaching in vite.config.ts).
import { requestPersistence } from '../core/storage';

/** Must match cacheName for audio in vite.config.ts (checked by a unit test). */
export const AUDIO_CACHE = 'english-practice-audio';

const RELATIVE_CLIP = /^audio\/[a-z]{2,3}-from-[a-z]{2,3}\/[a-z0-9][a-z0-9-]*\.opus$/;

/** The part of CacheStorage this file uses, so tests can pass a fake. */
export interface CacheLike {
  addAll(urls: string[]): Promise<void>;
  keys(): Promise<readonly { url: string }[]>;
  delete(request: string | { url: string }): Promise<boolean>;
}
export interface CachesLike {
  open(name: string): Promise<CacheLike>;
}

/** 'full': the device has no room left. */
export type DownloadResult = 'ok' | 'unavailable' | 'failed' | 'full' | 'none';

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
  } catch (e) {
    const name = e instanceof Error || (typeof e === 'object' && e !== null && 'name' in e) ? (e as { name: string }).name : '';
    return name === 'QuotaExceededError' ? 'full' : 'failed';
  }
}

/** The clip path (audio/<course>/<file>.opus) of a stored entry, whose URL is absolute. */
function clipPath(storedUrl: string): string | null {
  const path = storedUrl.replace(/[?#].*$/, '');
  const m = /(?:^|\/)(audio\/[a-z]{2,3}-from-[a-z]{2,3}\/[a-z0-9][a-z0-9-]*\.opus)$/.exec(path);
  return m ? (m[1] ?? null) : null;
}

/**
 * What is stored for offline use, read from the cache itself (never from memory), so the count is
 * honest after a failed or partial download: `listed` = how many of these clips are stored,
 * `course` = every stored clip of the course, including files no longer listed.
 */
export async function countDownloaded(urls: string[], courseId: string, api: CachesLike | null = browserCaches()): Promise<{ listed: number; course: number }> {
  const list = safe(urls);
  if (!list || !api) return { listed: 0, course: 0 };
  try {
    const cache = await api.open(AUDIO_CACHE);
    const stored = (await cache.keys()).map((r) => clipPath(r.url)).filter((p): p is string => p !== null);
    return { listed: list.filter((u) => stored.includes(u)).length, course: stored.filter((p) => p.startsWith(`audio/${courseId}/`)).length };
  } catch {
    return { listed: 0, course: 0 };
  }
}

/** Remove every stored clip of a course, including files no longer listed. */
export async function removeCourseAudio(courseId: string, api: CachesLike | null = browserCaches()): Promise<boolean> {
  if (!/^[a-z]{2,3}-from-[a-z]{2,3}$/.test(courseId) || !api) return false;
  try {
    const cache = await api.open(AUDIO_CACHE);
    const keys = await cache.keys();
    await Promise.all(keys.filter((r) => clipPath(r.url)?.startsWith(`audio/${courseId}/`)).map((r) => cache.delete(r)));
    return true;
  } catch {
    return false;
  }
}
