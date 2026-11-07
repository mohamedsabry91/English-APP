import { describe, expect, it } from 'vitest';
import { validateAudioCredits, type AudioClipCredit } from './audioCredits';

const COURSES = ['en-from-ar'];
const own: AudioClipCredit = {
  file: 'public/audio/en-from-ar/ph-01.opus',
  text: 'Could you send me the report, please?',
  source: 'own-recording',
  licence: 'own',
  link: '',
  speaker: 'Teacher A',
  consent: true,
  synthetic: false,
  reviewed: false,
};
const kokoro: AudioClipCredit = {
  ...own,
  file: 'public/audio/en-from-ar/ph-02.opus',
  source: 'kokoro',
  licence: 'Apache-2.0',
  link: 'https://example.org/kokoro',
  speaker: 'voice-a',
  consent: false,
  synthetic: true,
  reviewed: true,
};
const check = (clips: unknown[]) => validateAudioCredits({ version: 1, clips }, COURSES);

describe('AUDIO_CREDITS.json schema', () => {
  it('accepts an empty list, an own recording and a checked Kokoro clip', () => {
    expect(check([])).toEqual([]);
    expect(check([own])).toEqual([]);
    expect(check([own, kokoro])).toEqual([]);
  });

  it('rejects a damaged file', () => {
    expect(validateAudioCredits(null, COURSES)).not.toEqual([]);
    expect(validateAudioCredits({ version: 2, clips: [] }, COURSES)).not.toEqual([]);
    expect(validateAudioCredits({ version: 1 }, COURSES)).not.toEqual([]);
    expect(validateAudioCredits({ version: 1, clips: [], extra: 1 }, COURSES)).not.toEqual([]);
  });

  it('needs every field, and no unknown fields', () => {
    for (const k of Object.keys(own)) {
      const c: Record<string, unknown> = { ...own };
      delete c[k];
      expect(check([c]), k).not.toEqual([]);
    }
    expect(check([{ ...own, note: 'x' }])).not.toEqual([]);
  });

  it('allows only Opus files under public/audio/<known course>/, once each', () => {
    expect(check([{ ...own, file: 'public/audio/en-from-ar/ph-01.mp3' }])).not.toEqual([]);
    expect(check([{ ...own, file: 'public/ph-01.opus' }])).not.toEqual([]);
    expect(check([{ ...own, file: 'public/audio/zh-from-ar/ph-01.opus' }])).not.toEqual([]);
    expect(check([{ ...own, file: 'public/audio/en-from-ar/../x.opus' }])).not.toEqual([]);
    expect(check([own, own])).not.toEqual([]);
  });

  it('allows only licences that permit commercial use', () => {
    for (const licence of ['CC-BY-NC-4.0', 'CC-BY-ND-4.0', 'CC-BY-NC-SA-4.0', 'unknown', '']) {
      expect(check([{ ...own, source: 'open-licence', licence, link: 'https://example.org/a' }]), licence).not.toEqual([]);
    }
    expect(check([{ ...own, source: 'open-licence', licence: 'CC-BY-4.0', link: 'https://example.org/a' }])).toEqual([]);
  });

  it('needs consent for our own recordings, and an https source link for everything else', () => {
    expect(check([{ ...own, consent: false }])).not.toEqual([]);
    expect(check([{ ...own, link: 'http://example.org' }])).not.toEqual([]);
    expect(check([{ ...own, source: 'open-licence', licence: 'CC0-1.0', link: '' }])).not.toEqual([]);
    expect(check([{ ...kokoro, link: 'http://example.org/kokoro' }])).not.toEqual([]);
  });

  it('marks every Kokoro clip as synthetic', () => {
    expect(check([{ ...kokoro, synthetic: false }])).not.toEqual([]);
    expect(check([{ ...kokoro, licence: 'own' }])).not.toEqual([]);
    expect(check([{ ...own, synthetic: true }])).not.toEqual([]);
  });

  it('allows a synthetic clip that no teacher has checked yet (owner decision, 7 Nov 2026); the app labels it so', () => {
    expect(check([{ ...kokoro, reviewed: false }])).toEqual([]);
    const openSynthetic = { ...own, source: 'open-licence', licence: 'CC0-1.0', link: 'https://example.org/a', consent: false, synthetic: true };
    expect(check([{ ...openSynthetic, reviewed: false }])).toEqual([]);
    expect(check([{ ...openSynthetic, reviewed: true }])).toEqual([]);
  });

  it('does not allow share-alike (CC-BY-SA) licences', () => {
    expect(check([{ ...own, source: 'open-licence', licence: 'CC-BY-SA-4.0', link: 'https://example.org/a' }])).not.toEqual([]);
  });

  it('allows no synthetic voice outside English courses', () => {
    const courses = ['en-from-ar', 'zh-from-ar'];
    const zh = { ...kokoro, file: 'public/audio/zh-from-ar/a.opus' };
    expect(validateAudioCredits({ version: 1, clips: [zh] }, courses)).not.toEqual([]);
    expect(validateAudioCredits({ version: 1, clips: [{ ...own, file: 'public/audio/zh-from-ar/a.opus' }] }, courses)).toEqual([]);
  });
});
