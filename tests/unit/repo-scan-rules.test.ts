import { describe, expect, it } from 'vitest';
import { ALLOWED_AUDIO, AUDIO_ELEMENT, BANNED_MEDIA_API, isAbsoluteMediaPath, isOggOpus, MEDIA_EXT, MEDIA_PATH, PROTOCOL_RELATIVE_URL, ROOT_SKIP, sniffMedia, SOURCE_EXT } from './repoScanRules';

// All media bytes here are generated in the test; no media file is in the repository.
const bytes = (...parts: (string | number[])[]) => {
  const out: number[] = [];
  for (const p of parts) out.push(...(typeof p === 'string' ? p.split('').map((c) => c.charCodeAt(0)) : p));
  while (out.length < 64) out.push(0);
  return new Uint8Array(out);
};
const at = (offset: number, s: string, lead = 'OggS') => {
  const b = bytes(lead);
  s.split('').forEach((c, i) => (b[offset + i] = c.charCodeAt(0)));
  return b;
};

describe('repository scan rules', () => {
  it('skips build folders only at the root', () => {
    expect(ROOT_SKIP.has('dev-dist')).toBe(true);
    // The walk applies ROOT_SKIP only to the root directory (see repo-scan.test.ts).
  });

  it('catches audio and video file names', () => {
    for (const f of ['a.mp3', 'a.WAV', 'a.spx', 'a.mka', 'a.ogx', 'a.m4b', 'a.3gp', 'a.mov', 'a.mkv', 'a.mp4', 'a.webm', 'a.mid', 'a.opus', 'a.aiff', 'a.m2ts']) {
      expect(MEDIA_EXT.test(f), f).toBe(true);
    }
    for (const f of ['a.ts', 'a.mts', 'a.tsx', 'a.json', 'a.png', 'a.md']) expect(MEDIA_EXT.test(f), f).toBe(false);
  });

  it('allows clips only as public/audio/<course>/<name>.opus', () => {
    expect(ALLOWED_AUDIO.test('public/audio/en-from-ar/ph-01.opus')).toBe(true);
    for (const f of ['public/audio/en-from-ar/ph-01.mp3', 'public/audio/ph-01.opus', 'public/dev-dist/audio/en-from-ar/a.opus', 'public/audio/en-from-ar/sub/a.opus', 'public/audio/en-from-ar/.opus']) {
      expect(ALLOWED_AUDIO.test(f), f).toBe(false);
    }
  });

  it('recognises audio and video data whatever the file is called', () => {
    expect(sniffMedia(bytes('ID3', [3, 0]))).toBe('mp3');
    expect(sniffMedia(bytes([0xff, 0xfb, 0x90, 0x00]))).toBe('mpeg-audio');
    expect(sniffMedia(bytes([0xff, 0xf1, 0x50, 0x80]))).toBe('mpeg-audio');
    expect(sniffMedia(bytes('OggS'))).toBe('ogg');
    expect(sniffMedia(bytes('RIFF', [0, 0, 0, 0], 'WAVE'))).toBe('riff');
    expect(sniffMedia(bytes('fLaC'))).toBe('flac');
    expect(sniffMedia(bytes([0, 0, 0, 0x20], 'ftypM4A '))).toBe('mp4');
    expect(sniffMedia(bytes([0x1a, 0x45, 0xdf, 0xa3]))).toBe('matroska');
    expect(sniffMedia(bytes('MThd'))).toBe('midi');
    expect(sniffMedia(bytes('#!AMR'))).toBe('amr');
    expect(sniffMedia(bytes('FORM', [0, 0, 0, 0], 'AIFF'))).toBe('aiff');
    const ts = new Uint8Array(200);
    ts[0] = 0x47;
    ts[188] = 0x47;
    expect(sniffMedia(ts)).toBe('mpeg-ts');
  });

  it('does not flag ordinary files', () => {
    expect(sniffMedia(bytes('{"a":1}'))).toBeNull();
    expect(sniffMedia(bytes('import x'))).toBeNull();
    expect(sniffMedia(bytes([0x89], 'PNG', [0x0d, 0x0a, 0x1a, 0x0a]))).toBeNull();
    expect(sniffMedia(bytes('<svg'))).toBeNull();
    expect(sniffMedia(new Uint8Array([0xff]))).toBeNull();
  });

  it('accepts only real Ogg Opus data for a clip', () => {
    expect(isOggOpus(at(28, 'OpusHead'))).toBe(true);
    expect(isOggOpus(at(28, 'OpusHead', 'ID3'))).toBe(false);
    expect(isOggOpus(at(28, 'Speex   '))).toBe(false);
    expect(isOggOpus(at(28, '\u0001vorbis'))).toBe(false);
    expect(isOggOpus(new Uint8Array(10))).toBe(false);
  });

  it('reads every kind of app source file', () => {
    for (const f of ['a.ts', 'a.tsx', 'a.js', 'a.jsx', 'a.mjs', 'a.cjs', 'a.mts', 'a.html', 'a.json']) expect(SOURCE_EXT.test(f), f).toBe(true);
  });
});

describe('source scan patterns', () => {
  it('bans media and recording APIs everywhere', () => {
    const banned = [
      'new AudioContext()',
      'new webkitAudioContext()',
      'speechSynthesis.speak(u)',
      'new SpeechRecognition()',
      'new webkitSpeechRecognition()',
      'navigator.mediaDevices.getUserMedia({ audio: true })',
      'navigator.webkitGetUserMedia(c)',
      'navigator.mediaDevices.getDisplayMedia()',
      'new MediaRecorder(s)',
      '<video src="a" />',
      "document.createElement('video')",
      'document.createElement(`video`)',
      '<input type="file" accept="audio/*" capture />',
      '<input capture="user" />',
      "{ capture: 'environment' }",
      'const s = "data:audio/ogg;base64,AAAA";',
      "const v = 'data:video/mp4;base64,AAAA';",
    ];
    for (const b of banned) expect(BANNED_MEDIA_API.test(b), b).toBe(true);
    for (const ok of ['const audioRow = 1;', '<p>Listen</p>', 'captured mistakes', 'const video = false']) expect(BANNED_MEDIA_API.test(ok), ok).toBe(false);
  });

  it('finds every way to create an audio element', () => {
    for (const b of ['new Audio(url)', 'new window.Audio(url)', 'new globalThis.Audio(url)', '<audio src="x" />', "document.createElement('audio')", 'document.createElement(`audio`)', 'document.createElement("audio")']) {
      expect(AUDIO_ELEMENT.test(b), b).toBe(true);
    }
    expect(AUDIO_ELEMENT.test('const AudioButton = 1;')).toBe(false);
  });

  it('finds protocol-relative URLs and absolute media paths', () => {
    expect(PROTOCOL_RELATIVE_URL.test('const u = "//cdn.example.org/a.mp3";')).toBe(true);
    expect(PROTOCOL_RELATIVE_URL.test("url('//example.org/a')")).toBe(true);
    expect(PROTOCOL_RELATIVE_URL.test('// a comment about example.org')).toBe(false);
    const paths = (t: string) => [...t.matchAll(MEDIA_PATH)].map((m) => m[1] ?? '').filter(isAbsoluteMediaPath);
    expect(paths('"//cdn.example.org/a.mp3"')).toEqual(['//cdn.example.org/a.mp3']);
    expect(paths("'/audio/en-from-ar/a.opus'")).toEqual(['/audio/en-from-ar/a.opus']);
    expect(paths('`blob:x.webm`')).toEqual(['blob:x.webm']);
    expect(paths('"audio/en-from-ar/a.opus"')).toEqual([]);
  });
});
