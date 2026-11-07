/**
 * Schema and rules for AUDIO_CREDITS.json (repository root). Every audio clip in the repository must
 * have exactly one entry here. The rules are documented in docs/AUDIO.md.
 */

export const AUDIO_LIMITS = {
  /** A short phrase in Opus at speech quality is a few KB to a few tens of KB. */
  maxFileBytes: 200_000,
  /** Budget for all clips together, across all courses. */
  maxTotalBytes: 30_000_000,
  maxTextLength: 300,
} as const;

export const AUDIO_SOURCES = ['own-recording', 'kokoro', 'open-licence'] as const;
export type AudioSource = (typeof AUDIO_SOURCES)[number];

/**
 * Licences that allow commercial use and changes. Non-commercial (NC) and no-derivatives (ND) are not
 * allowed. Share-alike (CC-BY-SA) was removed by the owner's decision; it can return later if needed.
 */
export const AUDIO_LICENCES = ['own', 'Apache-2.0', 'CC0-1.0', 'CC-BY-4.0'] as const;

export interface AudioClipCredit {
  /** Repository path, for example "public/audio/en-from-ar/ph-01.opus". */
  file: string;
  /** The exact words spoken in the clip. */
  text: string;
  source: AudioSource;
  licence: (typeof AUDIO_LICENCES)[number];
  /** https:// link to the source or licence. Empty for our own recordings. */
  link: string;
  /** Who speaks: a teacher's first name or role for our own recordings, or the voice name for Kokoro. */
  speaker: string;
  /** For our own recordings: the speaker agreed in writing to publish the clip. */
  consent: boolean;
  /** true for a generated (AI) voice. The app labels these as synthetic. */
  synthetic: boolean;
  /** A person (a teacher for the course language) has listened to the clip and checked it against the text. */
  reviewed: boolean;
}

export interface AudioCredits {
  version: 1;
  clips: AudioClipCredit[];
}

const FILE = /^public\/audio\/([a-z0-9-]+)\/[a-z0-9][a-z0-9-]*\.opus$/;
const KEYS = ['file', 'text', 'source', 'licence', 'link', 'speaker', 'consent', 'synthetic', 'reviewed'];

/** Returns a list of problems; an empty list means the credits file is valid. */
export function validateAudioCredits(raw: unknown, courses: string[]): string[] {
  const errs: string[] = [];
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return ['not an object'];
  const r = raw as Record<string, unknown>;
  const allowedTop = ['$comment', 'version', 'clips'];
  for (const k of Object.keys(r)) if (!allowedTop.includes(k)) errs.push(`unknown key ${k}`);
  if (r.version !== 1) errs.push('version must be 1');
  if (!Array.isArray(r.clips)) return [...errs, 'clips must be an array'];
  const seen = new Set<string>();
  r.clips.forEach((c: unknown, i: number) => {
    const at = `clips[${i}]`;
    if (!c || typeof c !== 'object' || Array.isArray(c)) return errs.push(`${at}: not an object`);
    const e = c as Record<string, unknown>;
    for (const k of Object.keys(e)) if (!KEYS.includes(k)) errs.push(`${at}: unknown key ${k}`);
    for (const k of KEYS) if (!(k in e)) errs.push(`${at}: missing ${k}`);
    const file = typeof e.file === 'string' ? e.file : '';
    const m = FILE.exec(file);
    if (!m) errs.push(`${at}: file must be public/audio/<course>/<name>.opus`);
    else if (!courses.includes(m[1] ?? "")) errs.push(`${at}: unknown course ${m[1]}`);
    if (seen.has(file)) errs.push(`${at}: duplicate file ${file}`);
    seen.add(file);
    if (typeof e.text !== 'string' || !e.text.trim() || e.text.length > AUDIO_LIMITS.maxTextLength) errs.push(`${at}: text`);
    if (!AUDIO_SOURCES.includes(e.source as AudioSource)) errs.push(`${at}: source`);
    if (!(AUDIO_LICENCES as readonly unknown[]).includes(e.licence)) errs.push(`${at}: licence not allowed`);
    if (typeof e.link !== 'string') errs.push(`${at}: link`);
    if (typeof e.speaker !== 'string' || !e.speaker.trim()) errs.push(`${at}: speaker`);
    for (const k of ['consent', 'synthetic', 'reviewed']) if (typeof e[k] !== 'boolean') errs.push(`${at}: ${k} must be true or false`);
    const link = typeof e.link === 'string' ? e.link : '';
    if (e.source === 'own-recording') {
      if (e.licence !== 'own') errs.push(`${at}: own recordings use licence "own"`);
      if (e.consent !== true) errs.push(`${at}: own recordings need the speaker's consent`);
      if (e.synthetic !== false) errs.push(`${at}: own recordings are not synthetic`);
      if (link !== '' && !/^https:\/\/\S+$/.test(link)) errs.push(`${at}: link must be empty or https://`);
    } else {
      if (!/^https:\/\/\S+$/.test(link)) errs.push(`${at}: link must be an https:// source link`);
    }
    if (e.source === 'kokoro') {
      if (e.licence !== 'Apache-2.0') errs.push(`${at}: Kokoro clips use licence Apache-2.0`);
      if (e.synthetic !== true) errs.push(`${at}: Kokoro clips must be marked synthetic`);
    }
    // A generated voice may ship before a teacher's check (reviewed: false); the app's label then says so.
    if (e.source === 'open-licence' && e.licence === 'own') errs.push(`${at}: open-licence clips need their real licence`);
    // Generated voices are for English only: tone and sound accuracy in other languages needs a teacher's own recording.
    if (e.synthetic === true && m && !/^en-/.test(m[1] ?? "")) errs.push(`${at}: no synthetic voice for course ${m[1]}`);
  });
  return errs;
}
