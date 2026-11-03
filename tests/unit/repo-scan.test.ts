import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { AUDIO_LIMITS, validateAudioCredits, type AudioCredits } from './audioCredits';

const ROOT = join(__dirname, '..', '..');
const SKIP = new Set(['node_modules', '.git', 'dist', 'dev-dist', 'playwright-report', 'test-results', 'coverage']);

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (SKIP.has(name)) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

// Always use forward slashes, so the scans work the same on Windows (where relative() gives backslashes).
const files = walk(ROOT).map((p) => relative(ROOT, p).split(sep).join('/').replace(/\\/g, '/'));
const sourceFiles = files.filter((f) => /^(src|content|public)\//.test(f) || f === 'index.html' || f === 'vite.config.ts');
const read = (f: string) => readFileSync(join(ROOT, f), 'utf8');

// Audio rule: only Opus clips under public/audio/<course>/, each listed in AUDIO_CREDITS.json
// (repository root, outside the scanned folders, because it holds https:// source links).
const AUDIO_EXT = /\.(mp3|wav|ogg|oga|m4a|aac|flac|opus|mid|midi|weba|webm|amr|caf|aiff?|wma|mp4)$/i;
const ALLOWED_AUDIO = /^public\/audio\/([a-z0-9-]+)\/[a-z0-9][a-z0-9-]*\.opus$/;
const COURSES = readdirSync(join(ROOT, 'content')).filter((n) => statSync(join(ROOT, 'content', n)).isDirectory());
// The only file allowed to create an audio element.
const PLAYER_FILE = 'src/audio/player.ts';
// The only file allowed to write to the Cache API ("Download for offline"), from the app's own site only.
const OFFLINE_FILE = 'src/audio/offline.ts';
const credits = JSON.parse(read('AUDIO_CREDITS.json')) as AudioCredits;

describe('repository scan', () => {
  it('finds the files it is meant to scan', () => {
    expect(files.every((f) => !f.includes('\\'))).toBe(true);
    expect(sourceFiles.length).toBeGreaterThan(50);
    for (const f of ['index.html', 'vite.config.ts', 'src/main.tsx', 'src/app/App.tsx', 'content/en-from-ar/placement.json', 'public/icon.svg']) {
      expect(sourceFiles, f).toContain(f);
    }
    expect(sourceFiles.filter((f) => /\.(ts|tsx)$/.test(f)).length).toBeGreaterThan(20);
  });

  it('has no audio files except Opus clips under public/audio/<course>/', () => {
    const audio = files.filter((f) => AUDIO_EXT.test(f));
    const misplaced = audio.filter((f) => {
      const m = ALLOWED_AUDIO.exec(f);
      return !m || !COURSES.includes(m[1] ?? '');
    });
    expect(misplaced).toEqual([]);
    // Nothing else may live in public/audio (no music, no other formats, no stray files).
    const others = files.filter((f) => f.startsWith('public/audio/') && !ALLOWED_AUDIO.test(f));
    expect(others).toEqual([]);
  });

  it('keeps every audio clip small, within the total budget, and listed in AUDIO_CREDITS.json', () => {
    const clips = files.filter((f) => ALLOWED_AUDIO.test(f));
    const tooBig = clips.filter((f) => statSync(join(ROOT, f)).size > AUDIO_LIMITS.maxFileBytes);
    expect(tooBig).toEqual([]);
    const total = clips.reduce((n, f) => n + statSync(join(ROOT, f)).size, 0);
    expect(total).toBeLessThanOrEqual(AUDIO_LIMITS.maxTotalBytes);
    const listed = new Set(credits.clips.map((c) => c.file));
    expect(clips.filter((f) => !listed.has(f))).toEqual([]);
    // And every listed clip exists.
    expect(credits.clips.map((c) => c.file).filter((f) => !clips.includes(f))).toEqual([]);
  });

  it('uses no audio or speech APIs in the app source, except an audio element in the player', () => {
    const banned = /AudioContext|webkitAudioContext|speechSynthesis|SpeechSynthesisUtterance|SpeechRecognition|webkitSpeechRecognition|getUserMedia|MediaRecorder/;
    const element = /<audio|new Audio\(|createElement\(\s*['"]audio['"]/;
    const bad = sourceFiles
      .filter((f) => /\.(ts|tsx|js|html|json)$/.test(f))
      .filter((f) => banned.test(read(f)) || (f !== PLAYER_FILE && element.test(read(f))));
    expect(bad).toEqual([]);
  });

  it('has only the known abstract icons as images', () => {
    const images = files.filter((f) => /\.(png|jpe?g|gif|webp|svg|avif|ico|bmp)$/i.test(f) && !f.startsWith('docs/screenshots/'));
    expect(images.sort()).toEqual(['public/icon-192.png', 'public/icon-512.png', 'public/icon.svg']);
    // The SVG icon is made of rectangles and lines only.
    const svg = read('public/icon.svg');
    expect(svg).not.toMatch(/<(image|circle|ellipse|text)\b/);
  });

  it('makes no requests to other hosts', () => {
    const bad: string[] = [];
    for (const f of sourceFiles.filter((x) => /\.(ts|tsx|js|html)$/.test(x))) {
      const text = read(f);
      if (/\bfetch\s*\(|XMLHttpRequest|WebSocket|EventSource|navigator\.sendBeacon|importScripts/.test(text)) bad.push(`${f}: network API`);
      if (/https?:\/\//.test(text)) bad.push(`${f}: URL`);
    }
    expect(bad).toEqual([]);
  });

  it('uses the Cache API in one file only, for downloading audio', () => {
    const bad = sourceFiles
      .filter((f) => /\.(ts|tsx|js|html)$/.test(f) && f !== OFFLINE_FILE)
      .filter((f) => /\bcaches\b|\.addAll\(|\bcache\.add\(|\bcache\.put\(/.test(read(f)));
    expect(bad).toEqual([]);
    // That file uses no network API of its own, and only relative clip paths.
    const offline = read(OFFLINE_FILE);
    expect(offline).not.toMatch(/\bfetch\s*\(|XMLHttpRequest|https?:/);
    expect(offline).toContain("RELATIVE_CLIP = /^audio\\/");
  });

  it('lists every clip of each course in content/<course>/audio.json, matching the files and AUDIO_CREDITS.json', () => {
    for (const course of COURSES) {
      const path = `content/${course}/audio.json`;
      expect(files, path).toContain(path);
      const manifest = JSON.parse(read(path)) as { clips: { id: string; file: string; synthetic: boolean }[] };
      const listed = manifest.clips.map((c) => `public/audio/${course}/${c.file}`).sort();
      const onDisk = files.filter((f) => f.startsWith(`public/audio/${course}/`)).sort();
      expect(listed, course).toEqual(onDisk);
      for (const c of manifest.clips) {
        const credit = credits.clips.find((x) => x.file === `public/audio/${course}/${c.file}`);
        expect(credit, c.file).toBeDefined();
        // The app's "synthetic voice" label must match the credit.
        expect(c.synthetic, c.file).toBe(credit?.synthetic);
      }
    }
  });

  it('caches audio only at run time, same-origin, cache first with range requests, and never precaches it', async () => {
    const cfg = read('vite.config.ts');
    const glob = /globPatterns:\s*\[([^\]]*)\]/.exec(cfg)?.[1] ?? '';
    expect(glob).not.toMatch(/\b(opus|mp3|wav|ogg|oga|m4a|aac|flac|webm|weba)\b/);
    expect(glob).toContain("webmanifest");
    expect(cfg).toMatch(/urlPattern: \(\{ url, sameOrigin \}\) => sameOrigin && /);
    expect(cfg).toContain("handler: 'CacheFirst'");
    expect(cfg).toContain('rangeRequests: true');
    const { AUDIO_CACHE } = await import('../../src/audio/offline');
    expect(cfg).toContain(`cacheName: '${AUDIO_CACHE}'`);
  });

  it('refers to audio only by relative paths', () => {
    const bad: string[] = [];
    for (const f of sourceFiles.filter((x) => /\.(ts|tsx|js|html|json)$/.test(x))) {
      for (const m of read(f).matchAll(/["'`]([^"'`\s]*\.opus)["'`]/g)) {
        if (/^(\/|[a-z][a-z0-9+.-]*:)/i.test(m[1] ?? '')) bad.push(`${f}: ${m[1]}`);
      }
    }
    expect(bad).toEqual([]);
  });

  it('keeps AUDIO_CREDITS.json valid, at the repository root, outside the scanned folders', () => {
    expect(files).toContain('AUDIO_CREDITS.json');
    expect(sourceFiles).not.toContain('AUDIO_CREDITS.json');
    expect(files.filter((f) => /AUDIO_CREDITS/i.test(f) && f !== 'AUDIO_CREDITS.json')).toEqual([]);
    expect(validateAudioCredits(credits, COURSES)).toEqual([]);
  });

  it('has a strict Content Security Policy for the built page', () => {
    const cfg = read('vite.config.ts');
    expect(cfg).toContain("connect-src 'self'");
    expect(cfg).toContain("script-src 'self'");
    expect(cfg).toContain("default-src 'self'");
    expect(cfg).not.toMatch(/unsafe-inline|unsafe-eval/);
  });

  it("allows media only from the app itself (media-src 'self')", async () => {
    const { CSP } = await import('../../vite.config');
    const media = CSP.split(';').map((d) => d.trim()).filter((d) => d.startsWith('media-src'));
    expect(media).toEqual(["media-src 'self'"]);
    expect(CSP).not.toMatch(/\*|http:|https:|blob:|data:|mediastream:/);
  });

  it('defines the app name in one constant', () => {
    expect(read('src/app/config.ts')).toContain("APP_NAME = 'English Practice'");
  });
});
