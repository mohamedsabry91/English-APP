/**
 * Rules used by the repository scan (repo-scan.test.ts), kept apart so they can be tested on
 * generated data without adding any real media file to the repository.
 */

/** Folders skipped by the scan, only at the repository root (a folder with one of these names deeper down is scanned). */
export const ROOT_SKIP = new Set(['node_modules', '.git', 'dist', 'dev-dist', 'playwright-report', 'test-results', 'coverage']);

/** The only files allowed in public/, apart from audio clips. */
export const PUBLIC_FILES = ['public/icon-192.png', 'public/icon-512.png', 'public/icon.svg'];

/** An allowed audio clip: public/audio/<course>/<name>.opus */
export const ALLOWED_AUDIO = /^public\/audio\/([a-z0-9-]+)\/[a-z0-9][a-z0-9-]*\.opus$/;

/**
 * Audio and video file names, by extension. Anything matching outside ALLOWED_AUDIO fails the scan.
 * (.ts and .mts are left out on purpose: they are TypeScript here. MPEG transport streams are caught
 * by their content in sniffMedia instead.)
 */
export const MEDIA_EXT =
  /\.(mp3|mp2|mpga|wav|wave|ogg|oga|ogx|ogv|spx|opus|m4a|m4b|m4p|m4v|mp4|aac|flac|alac|mid|midi|kar|rmi|weba|webm|amr|awb|caf|aif|aiff|aifc|wma|wmv|asf|ra|ram|rm|au|snd|mka|mkv|mov|qt|3gp|3g2|avi|flv|f4a|f4v|m2ts|ac3|dts|ape|wv|mpc|tta|voc|gsm|sln|xm|mod|s3m|it)$/i;

/** Text files of the app that the source scans read. */
export const SOURCE_EXT = /\.(ts|tsx|mts|cts|js|jsx|mjs|cjs|html|json)$/;

const ascii = (b: Uint8Array, at: number, s: string) => s.split('').every((c, i) => b[at + i] === c.charCodeAt(0));

/** The kind of audio or video data at the start of a file, or null. Works on the first 64 bytes or more. */
export function sniffMedia(b: Uint8Array): string | null {
  if (b.length < 4) return null;
  if (ascii(b, 0, 'ID3')) return 'mp3';
  // MPEG audio frame sync (11 bits set), as at the start of an MP3 or AAC (ADTS) file without a tag.
  if (b[0] === 0xff && ((b[1] ?? 0) & 0xe0) === 0xe0) return 'mpeg-audio';
  if (ascii(b, 0, 'OggS')) return 'ogg';
  if (ascii(b, 0, 'RIFF') && (ascii(b, 8, 'WAVE') || ascii(b, 8, 'AVI '))) return 'riff';
  if (ascii(b, 0, 'fLaC')) return 'flac';
  if (ascii(b, 4, 'ftyp')) return 'mp4';
  if (b[0] === 0x1a && b[1] === 0x45 && b[2] === 0xdf && b[3] === 0xa3) return 'matroska';
  if (ascii(b, 0, 'MThd')) return 'midi';
  if (ascii(b, 0, '#!AMR')) return 'amr';
  if (ascii(b, 0, 'caff')) return 'caf';
  if (ascii(b, 0, 'FORM') && (ascii(b, 8, 'AIFF') || ascii(b, 8, 'AIFC'))) return 'aiff';
  if (ascii(b, 0, '.snd')) return 'au';
  if (b[0] === 0x30 && b[1] === 0x26 && b[2] === 0xb2 && b[3] === 0x75) return 'asf';
  // MPEG transport stream: a sync byte every 188 bytes (needs at least 189 bytes to check).
  if (b.length > 188 && b[0] === 0x47 && b[188] === 0x47) return 'mpeg-ts';
  return null;
}

/** A real Ogg Opus file: an Ogg page whose first packet is the Opus header (OpusHead at byte 28). */
export function isOggOpus(b: Uint8Array): boolean {
  return b.length >= 36 && ascii(b, 0, 'OggS') && ascii(b, 28, 'OpusHead');
}

/**
 * Media and recording APIs banned everywhere in the app source, including the player:
 * Web Audio, speech synthesis and recognition, the microphone or camera (any prefix), screen capture,
 * recording, video elements, file inputs that capture from a camera or microphone, and inline media data.
 */
export const BANNED_MEDIA_API =
  /AudioContext|speechSynthesis|SpeechSynthesisUtterance|SpeechRecognition|getUserMedia|getDisplayMedia|mediaDevices|MediaRecorder|MediaStream|<video\b|createElement\(\s*['"`]video['"`]\s*\)|\bnew\s+(?:window\.|globalThis\.|self\.)?Video|<input\b[^>]*\bcapture\b|\bcapture\s*[:=]\s*["'`{]|data:(?:audio|video)\//i;

/** Creating an audio element: allowed in src/audio/player.ts only. */
export const AUDIO_ELEMENT = /<audio\b|\bnew\s+(?:window\.|globalThis\.|self\.)?Audio\s*\(|createElement\(\s*['"`]audio['"`]\s*\)/;

/** A quoted URL that starts with // (protocol-relative): a request to another host. */
export const PROTOCOL_RELATIVE_URL = /["'`(]\/\/[a-z0-9-]+(?:\.[a-z0-9-]+)+/i;

/** A quoted path or URL to an audio or video file. Such paths must be relative (no leading /, no scheme, no //). */
export const MEDIA_PATH = /["'`]([^"'`\s]*\.(?:opus|mp3|wav|ogg|oga|m4a|aac|flac|webm|weba|mp4|mid|midi|spx|mka|mkv|mov))["'`]/gi;
export const isAbsoluteMediaPath = (p: string) => /^(?:\/|[a-z][a-z0-9+.-]*:)/i.test(p);
