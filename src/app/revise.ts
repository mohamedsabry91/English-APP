import type { Finding } from '../checker';

/** One flag from a check, with the words it marked. */
export interface MarkedFlag {
  finding: Finding;
  words: string;
}

export interface Revision {
  /** Flags from the first check that the second check no longer shows. */
  fixed: MarkedFlag[];
  /** Flags that both checks show. */
  remaining: MarkedFlag[];
  /** Flags that only the second check shows. */
  added: MarkedFlag[];
}

const marked = (text: string, f: Finding): MarkedFlag => ({ finding: f, words: text.slice(f.start, f.end) });
const key = (m: MarkedFlag) => `${m.finding.rule}\u0000${m.words.trim().toLowerCase()}`;

/**
 * Compare the flags of a first check with the flags of a second check on the revised text.
 * A flag counts as the same when the same rule marks the same words (ignoring case), wherever
 * they are in the text. So a rewritten sentence with the same mistake in different words shows
 * the old flag as gone and the new one as added.
 */
export function compareChecks(beforeText: string, before: Finding[], afterText: string, after: Finding[]): Revision {
  const left = after.map((f) => marked(afterText, f));
  const fixed: MarkedFlag[] = [];
  const remaining: MarkedFlag[] = [];
  for (const b of before.map((f) => marked(beforeText, f))) {
    const i = left.findIndex((a) => key(a) === key(b));
    if (i === -1) fixed.push(b);
    else remaining.push(...left.splice(i, 1));
  }
  return { fixed, remaining, added: left };
}
