export interface Token {
  text: string;
  lower: string;
  start: number;
  end: number;
  kind: 'word' | 'num' | 'punct';
  /** Index of the sentence this token belongs to. */
  sentence: number;
  /** First word of a sentence (after . ! ? or at the start of the text). */
  sentenceStart: boolean;
  /** First word of a line or a clause (sentence start, line start, after a comma, ; or :). */
  clauseStart: boolean;
}

const ABBREVIATIONS = new Set(['mr', 'mrs', 'ms', 'dr', 'eng', 'st', 'no', 'approx', 'etc', 'vs', 'e.g', 'i.e', 'fig', 'dept', 'min', 'max', 'jan', 'feb', 'mar', 'apr', 'jun', 'jul', 'aug', 'sep', 'sept', 'oct', 'nov', 'dec']);

const TOKEN_RE = /(\d+(?:[.,:]\d+)*%?)|([A-Za-z]+(?:[.][A-Za-z](?=\.))*(?:['’][A-Za-z]+)*(?:-[A-Za-z]+)*)|([^\sA-Za-z\d])/g;

export function tokenize(text: string): Token[] {
  const tokens: Token[] = [];
  let sentence = 0;
  let newSentence = true;
  let newClause = true;
  let lastEnd = 0;
  let m: RegExpExecArray | null;
  TOKEN_RE.lastIndex = 0;
  while ((m = TOKEN_RE.exec(text))) {
    const raw = m[0];
    const kind: Token['kind'] = m[1] ? 'num' : m[2] ? 'word' : 'punct';
    const between = text.slice(lastEnd, m.index);
    if (between.includes('\n')) newClause = true;
    lastEnd = m.index + raw.length;
    const tok: Token = {
      text: raw,
      lower: raw.toLowerCase().replace(/’/g, "'"),
      start: m.index,
      end: m.index + raw.length,
      kind,
      sentence,
      sentenceStart: false,
      clauseStart: false,
    };
    if (kind !== 'punct') {
      tok.sentenceStart = newSentence;
      tok.clauseStart = newSentence || newClause;
      newSentence = false;
      newClause = false;
    }
    tokens.push(tok);
    if (kind === 'punct') {
      if (raw === '.' || raw === '!' || raw === '?') {
        const prev = tokens[tokens.length - 2];
        const isAbbrev = raw === '.' && prev && prev.kind === 'word' && (ABBREVIATIONS.has(prev.lower) || (prev.text.length === 1 && prev.text === prev.text.toUpperCase()));
        if (!isAbbrev) {
          sentence += 1;
          newSentence = true;
        }
      } else if (raw === ',' || raw === ';' || raw === ':' || raw === '(' || raw === '-') {
        newClause = true;
      }
    }
  }
  return tokens;
}

/** Words only, keeping their sentence and position info. */
export function words(tokens: Token[]): Token[] {
  return tokens.filter((t) => t.kind !== 'punct');
}
