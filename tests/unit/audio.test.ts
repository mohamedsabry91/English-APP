import { describe, expect, it } from 'vitest';
import { cleanManifest, clipUrl, exampleClipId, findClip, playClip, stopAudio, type AudioLike } from '../../src/audio/player';
import { AUDIO_CACHE, countDownloaded, downloadClips, removeCourseAudio, type CachesLike } from '../../src/audio/offline';
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

/** Stores entries under full URLs, as a browser does. `failAfter` stores that many clips, then fails. */
class FakeCaches implements CachesLike {
  store = new Map<string, Set<string>>();
  opened: string[] = [];
  failAdd: Error | null = null;
  failAfter = Infinity;
  async open(name: string) {
    this.opened.push(name);
    const set = this.store.get(name) ?? new Set<string>();
    this.store.set(name, set);
    const full = (u: string) => `http://localhost:4173/${u}`;
    return {
      addAll: async (urls: string[]) => {
        urls.slice(0, this.failAfter).forEach((u) => set.add(full(u)));
        if (this.failAdd) throw this.failAdd;
        urls.forEach((u) => set.add(full(u)));
      },
      keys: async () => [...set].map((url) => ({ url })),
      delete: async (r: string | { url: string }) => set.delete(typeof r === 'string' ? r : r.url),
    };
  }
}

describe('audio clips', () => {
  it('has computer-voice clips for the phrase cards and lesson examples, none checked by a teacher yet', () => {
    const course = loadCourse('en-from-ar');
    const phraseIds = new Set(course?.phrases.map((p) => p.id));
    const exampleIds = new Set(course?.lessons.flatMap((l) => l.examples.map((_, i) => exampleClipId(l.id, i))));
    const ids = AUDIO.clips.map((c) => c.id);
    expect(AUDIO.clips.every((c) => c.synthetic && !c.reviewed && c.file === `${c.id}.opus`)).toBe(true);
    // Every clip belongs to a real phrase or lesson example.
    for (const id of ids) expect(phraseIds.has(id) || exampleIds.has(id), id).toBe(true);
    // Left out because a word is not in the voice's pronunciation dictionary (see docs/CONTENT_REVIEW.md).
    expect(ids.filter((id) => phraseIds.has(id))).toHaveLength(47);
    expect(ids).not.toContain('ph-41');
    expect(ids.filter((id) => exampleIds.has(id))).toHaveLength(126);
    expect(ids).not.toContain('e-06-ex-4');
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
    expect(m.clips).toEqual([{ id: 'ph-01', file: 'ph-01.opus', synthetic: false, reviewed: false }]);
    // "reviewed" is true only when the manifest says exactly true; anything else counts as not checked.
    expect(cleanManifest({ clips: [{ id: 'a', file: 'a.opus', synthetic: true, reviewed: true }] }).clips[0]?.reviewed).toBe(true);
    expect(cleanManifest({ clips: [{ id: 'a', file: 'a.opus', synthetic: true, reviewed: 'yes' }] }).clips[0]?.reviewed).toBe(false);
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

  it('a second tap while the first clip is starting keeps the second clip as the one playing', async () => {
    // The first play() is interrupted by the second tap (as a browser rejects play() after pause()).
    class SlowAudio implements AudioLike {
      currentTime = 0;
      paused = false;
      private reject: ((e: Error) => void) | null = null;
      play() {
        return new Promise<void>((resolve, reject) => {
          this.reject = reject;
          if (FakeAudio.made.length > 1) resolve();
        });
      }
      pause() {
        this.paused = true;
        this.reject?.(Object.assign(new Error('interrupted'), { name: 'AbortError' }));
      }
    }
    FakeAudio.made = [];
    const made: SlowAudio[] = [];
    const make = () => {
      const a = new SlowAudio();
      made.push(a);
      FakeAudio.made.push(a as unknown as FakeAudio);
      return a;
    };
    const first = playClip('audio/en-from-ar/ph-01.opus', make);
    const second = playClip('audio/en-from-ar/ph-02.opus', make);
    // The interrupted first tap is not a failure, and the second clip is still the current one.
    expect(await first).toBe(true);
    expect(await second).toBe(true);
    stopAudio();
    expect(made[1]?.paused).toBe(true);
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
    expect(asked).toBe(1);
    expect(await countDownloaded(urls, 'en-from-ar', c)).toEqual({ listed: 2, course: 2 });
    expect(await removeCourseAudio('en-from-ar', c)).toBe(true);
    expect(await countDownloaded(urls, 'en-from-ar', c)).toEqual({ listed: 0, course: 0 });
  });

  it('counts what is really stored after a failed download, so Remove is offered', async () => {
    const c = new FakeCaches();
    c.failAdd = new Error('network');
    c.failAfter = 1;
    expect(await downloadClips(urls, c, async () => true)).toBe('failed');
    expect(await countDownloaded(urls, 'en-from-ar', c)).toEqual({ listed: 1, course: 1 });
    expect(await removeCourseAudio('en-from-ar', c)).toBe(true);
    expect(await countDownloaded(urls, 'en-from-ar', c)).toEqual({ listed: 0, course: 0 });
  });

  it('removes every stored clip of the course, also files no longer listed, and only that course', async () => {
    const c = new FakeCaches();
    await downloadClips([...urls, 'audio/en-from-ar/old-name.opus', 'audio/zh-from-ar/x.opus'], c, async () => true);
    expect(await countDownloaded(urls, 'en-from-ar', c)).toEqual({ listed: 2, course: 3 });
    await removeCourseAudio('en-from-ar', c);
    expect(await countDownloaded(['audio/zh-from-ar/x.opus'], 'zh-from-ar', c)).toEqual({ listed: 1, course: 1 });
    expect(await removeCourseAudio('../x', c)).toBe(false);
  });

  it('says when the device is full', async () => {
    const c = new FakeCaches();
    const e = new Error('full');
    e.name = 'QuotaExceededError';
    c.failAdd = e;
    expect(await downloadClips(urls, c, async () => true)).toBe('full');
  });

  it('does nothing for a course with no clips, and refuses anything that is not a relative clip path', async () => {
    const c = new FakeCaches();
    expect(await downloadClips([], c)).toBe('none');
    expect(await downloadClips(['https://example.org/a.opus'], c)).toBe('failed');
    expect(await downloadClips(['/audio/en-from-ar/a.opus'], c)).toBe('failed');
    expect(await downloadClips([...urls, 'index.html'], c)).toBe('failed');
    expect(c.opened).toEqual([]);
  });

  it('reports a browser without the Cache API', async () => {
    expect(await downloadClips(urls, null)).toBe('unavailable');
    expect(await countDownloaded(urls, 'en-from-ar', null)).toEqual({ listed: 0, course: 0 });
    expect(await removeCourseAudio('en-from-ar', null)).toBe(false);
  });
});
