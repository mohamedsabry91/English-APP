// The only file in the app that creates an audio element (checked by the repository scan).
// It plays speech clips that ship with the app, from relative paths on the app's own site.
// It never records: no microphone, no speech recognition, no speech synthesis.

/** One clip listed in content/<course>/audio.json. */
export interface AudioClip {
  /** The id of the content item the clip belongs to, for example a phrase id ("ph-01"). */
  id: string;
  /** File name inside public/audio/<course>/, for example "ph-01.opus". */
  file: string;
  /** A generated (AI) voice. The app shows a "computer voice" label for these. */
  synthetic: boolean;
  /** A teacher listened and checked the clip. The label says so, or says that no teacher has yet. */
  reviewed: boolean;
}

export interface AudioManifest {
  clips: AudioClip[];
}

const COURSE = /^[a-z]{2,3}-from-[a-z]{2,3}$/;
const FILE = /^[a-z0-9][a-z0-9-]*\.opus$/;

/** The relative URL of a clip, or null if the course id or file name is not safe. */
export function clipUrl(courseId: string, file: string): string | null {
  if (!COURSE.test(courseId) || !FILE.test(file)) return null;
  return `audio/${courseId}/${file}`;
}

/** Valid clips only, at most one per id. */
export function cleanManifest(raw: unknown): AudioManifest {
  const list = raw && typeof raw === 'object' && Array.isArray((raw as { clips?: unknown }).clips) ? (raw as { clips: unknown[] }).clips : [];
  const seen = new Set<string>();
  const clips: AudioClip[] = [];
  for (const c of list) {
    if (!c || typeof c !== 'object') continue;
    const { id, file, synthetic, reviewed } = c as Record<string, unknown>;
    if (typeof id !== 'string' || !id || typeof file !== 'string' || !FILE.test(file) || typeof synthetic !== 'boolean' || seen.has(id)) continue;
    seen.add(id);
    clips.push({ id, file, synthetic, reviewed: reviewed === true });
  }
  return { clips };
}

export function findClip(manifest: AudioManifest, id: string): AudioClip | undefined {
  return manifest.clips.find((c) => c.id === id);
}

/** The small part of HTMLAudioElement the player uses, so tests can pass a fake. */
export interface AudioLike {
  play(): Promise<void>;
  pause(): void;
  currentTime: number;
}
export type MakeAudio = (url: string) => AudioLike;

const defaultMake: MakeAudio = (url) => {
  const a = new Audio(url);
  a.preload = 'none';
  return a;
};

let current: AudioLike | null = null;

/** Stop the clip that is playing, if any. */
export function stopAudio(): void {
  if (!current) return;
  try {
    current.pause();
    current.currentTime = 0;
  } catch {
    /* ignore */
  }
  current = null;
}

/** Play one clip, stopping any other. Resolves to false if the clip could not be played (missing, offline, blocked). */
export async function playClip(url: string, make: MakeAudio = defaultMake): Promise<boolean> {
  if (!/^audio\/[a-z]{2,3}-from-[a-z]{2,3}\/[a-z0-9][a-z0-9-]*\.opus$/.test(url)) return false;
  stopAudio();
  let a: AudioLike | null = null;
  try {
    a = make(url);
    current = a;
    await a.play();
    return true;
  } catch {
    // Another tap started a newer clip while this one was starting: that is not a failure, and the
    // newer clip must stay the one that Next or leaving the screen stops.
    if (a !== null && current !== a) return true;
    current = null;
    return false;
  }
}
