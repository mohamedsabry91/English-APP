import { Fragment } from 'react';

// Latin runs inside Arabic text: start with a Latin letter or digit, may contain spaces and
// punctuation, and end with a letter, digit, ')' , '?' or '...'. Final . , ; : stay in the Arabic flow.
const RUN = /\(?[A-Za-z0-9][A-Za-z0-9'’"\-+/%(),.:;!?…\s]*(?:[A-Za-z0-9)%?]|\.\.\.)/g;

export function splitLatin(text: string): { latin: boolean; text: string }[] {
  const out: { latin: boolean; text: string }[] = [];
  let last = 0;
  for (const m of text.matchAll(RUN)) {
    const start = m.index ?? 0;
    if (start > last) out.push({ latin: false, text: text.slice(last, start) });
    out.push({ latin: true, text: m[0] });
    last = start + m[0].length;
  }
  if (last < text.length) out.push({ latin: false, text: text.slice(last) });
  return out;
}

/** Arabic text with English parts isolated as LTR, so word order and punctuation display correctly. */
export function ArText({ children }: { children: string }) {
  return (
    <>
      {splitLatin(children).map((p, i) =>
        p.latin ? (
          <bdi key={i} dir="ltr" lang="en">
            {p.text}
          </bdi>
        ) : (
          <Fragment key={i}>{p.text}</Fragment>
        ),
      )}
    </>
  );
}
