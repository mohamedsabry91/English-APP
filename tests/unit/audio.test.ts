import { describe, expect, it } from 'vitest';
import { cleanManifest, clipUrl, findClip, playClip, stopAudio, type AudioLike } from '../../src/audio/player';
import { AUDIO_CACHE, countDownloaded, downloadClips, removeClips, type CachesLike } from '../../src/audio/offline';
import { AUDIO, loadCourse } from '../../src/core/content';

class FakeAudio implements AudioLike {
  static made: FakeAudio[] = [];
  currentTime = 5;
  paused = false;
  constructor(public url: string, private fail = false) {
    FakeAudio.made.push(this);
  }
  play() {
    return this.fail ? Promise.reject(new Error('NotAllowedError')) : Promise.resolve();
  }
  pause() {
    this.paused = true;
  }
}

class FakeCaches implements CachesLike {
  store = new Map<string, Set<string>>();
  opened: string[] = [];
  failAdd = false;
  async open(name: string) {
    this.opened.push(name);
    const set = this.store.get(name) ?? new Set<string>();
    this.store.set(name, set);
    return {
      addAll: async (urls: string[]) => {
        if (this.failAdd) throw new Error('network');
        for (const u of urls) set.add(u);
      },
      match: async (url: string) => (set.has(url) ? {} : undefined),
      delete: async (url: string) => set.delete(url),
    };
  }
}

describe('audio clips', () => {
  it('has no audio in the English course yet, so the app shows no audio controls', () => {
    expect(AUDIO.clips).toEqual([]);
    expect(loadCourse('en-from-ar')?.audio).toEqual({ clips: [] });
  });

  it('builds only relative clip URLs inside audio/<course>/', () => {
    expect(clipUrl('en-from-ar', 'ph-01.opus')).toBe('audio/en-from-ar/ph-01.opus');
    for (const [course, file] of [
      ['en-from-ar', '../x.opus'],
      ['en-from-ar', 'ph-01.mp3'],
      ['en-from-ar', '/ph-01.opus'],
      ['en-from-ar', 'https:x.opus'],
      ['../en', 'ph-01.opus'],
      ['', 'ph-01.opus'],
    ]) {
      expect(clipUrl(course as string, file as string), `${course} ${file}`).toBeNull();
    }
  });

  it('keeps only valid clips in a manifest, once per id', () => {
    const m = cleanManifest({
      clips: [
        { id: 'ph-01', file: 'ph-01.opus', synthetic: false },
        { id: 'ph-01', file: 'ph-01b.opus', synthetic: false },
        { id: 'ph-02', file: 'ph-02.wav', synthetic: false },
        { id: 'ph-03', file: 'ph-03.opus' },
        { id: '', file: 'x.opus', synthetic: true },
        'x',
      ],
    });
    expect(m.clips).toEqual([{ id: 'ph-01', file: 'ph-01.opus', synthetic: false }]);
    expect(findClip(m, 'ph-01')?.file).toBe('ph-01.opus');
    expect(findClip(m, 'ph-09')).toBeUndefined();
    expect(cleanManifest(null)).toEqual({ clips: [] });
    expect(cleanManifest({ clips: 'x' })).toEqual({ clips: [] });
  });
});

describe('player', () => {
  it('plays one clip at a time, and stops the one before', async () => {
    FakeAudio.made = [];
    expect(await playClip('audio/en-from-ar/ph-01.opus', (u) => new FakeAudio(u))).toBe(true);
    expect(await playClip('audio/en-from-ar/ph-02.opus', (u) => new FakeAudio(u))).toBe(true);
    expect(FakeAudio.made.map((a) => a.url)).toEqual(['audio/en-from-ar/ph-01.opus', 'audio/en-from-ar/ph-02.opus']);
    expect(FakeAudio.made[0]?.paused).toBe(true);
    expect(FakeAudio.made[0]?.currentTime).toBe(0);
    stopAudio();
    expect(FakeAudio.made[1]?.paused).toBe(true);
  });

  it('reports a clip that cannot be played, and never plays a URL from another place', async () => {
    FakeAudio.made = [];
    expect(await playClip('audio/en-from-ar/ph-01.opus', (u) => new FakeAudio(u, true))).toBe(false);
    for (const url of ['https://example.org/a.opus', '/audio/en-from-ar/a.opus', 'audio/en-from-ar/a.mp3', 'blob:x', 'audio/../a.opus']) {
      expect(await playClip(url, (u) => new FakeAudio(u)), url).toBe(false);
    }
    expect(FakeAudio.made).toHaveLength(1);
  });
});

describe('download for offline', () => {
  const urls = ['audio/en-from-ar/ph-01.opus', 'audio/en-from-ar/ph-02.opus'];

  it('stores the clips in the audio cache, and asks the browser to keep the data', async () => {
    const c = new FakeCaches();
    let asked = 0;
    expect(await downloadClips(urls, c, async () => (asked++, true))).toBe('ok');
    expect(c.opened).toEqual([AUDIO_CACHE]);
    expect([...(c.store.get(AUDIO_CACHE) ?? [])]).toEqual(urls);
    expect(asked).toBe(1);
    expect(await countDownloaded(urls, c)).toBe(2);
    expect(await removeClips(urls, c)).toBe(true);
    expect(await countDownloaded(urls, c)).toBe(0);
  });

  it('does nothing for a course with no clips, and refuses anything that is not a relative clip path', async () => {
    const c = new FakeCaches();
    expect(await downloadClips([], c)).toBe('none');
    expect(await downloadClips(['https://example.org/a.opus'], c)).toBe('failed');
    expect(await downloadClips(['/audio/en-from-ar/a.opus'], c)).toBe('failed');
    expect(await downloadClips([...urls, 'index.html'], c)).toBe('failed');
    expect(c.opened).toEqual([]);
  });

  it('reports a browser without the Cache API, and a failed download', async () => {
    expect(await downloadClips(urls, null)).toBe('unavailable');
    const c = new FakeCaches();
    c.failAdd = true;
    expect(await downloadClips(urls, c, async () => true)).toBe('failed');
    expect(await countDownloaded(urls, null)).toBe(0);
  });
});
