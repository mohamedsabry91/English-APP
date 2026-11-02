import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

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

const files = walk(ROOT).map((p) => relative(ROOT, p));
const sourceFiles = files.filter((f) => /^(src|content|public)\//.test(f) || f === 'index.html' || f === 'vite.config.ts');
const read = (f: string) => readFileSync(join(ROOT, f), 'utf8');

describe('repository scan', () => {
  it('has no audio files', () => {
    expect(files.filter((f) => /\.(mp3|wav|ogg|oga|m4a|aac|flac|opus|mid|midi|weba|amr|caf)$/i.test(f))).toEqual([]);
  });

  it('uses no audio or speech APIs in the app source', () => {
    const bad = sourceFiles
      .filter((f) => /\.(ts|tsx|js|html|json)$/.test(f))
      .filter((f) => /<audio|AudioContext|webkitAudioContext|speechSynthesis|SpeechSynthesisUtterance|new Audio\(|SpeechRecognition|getUserMedia/.test(read(f)));
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

  it('has a strict Content Security Policy for the built page', () => {
    const cfg = read('vite.config.ts');
    expect(cfg).toContain("connect-src 'self'");
    expect(cfg).toContain("script-src 'self'");
    expect(cfg).toContain("default-src 'self'");
    expect(cfg).not.toMatch(/unsafe-inline|unsafe-eval/);
  });

  it('defines the app name in one constant', () => {
    expect(read('src/app/config.ts')).toContain("APP_NAME = 'English Practice'");
  });
});
