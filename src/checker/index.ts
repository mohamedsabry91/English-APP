// Rule-based writing checker. No AI, no network. It flags only what it is confident about:
// missing a mistake is better than marking a correct sentence as wrong.
import type { Level, TagId } from '../core/types';
import { tokenize, words, type Token } from './tokenize';
import * as L from './lexicon';

export interface Finding {
  start: number;
  end: number;
  tag: TagId;
  explanationAr: string;
  explanationEn: string;
  /** Replacement for text[start..end], only when it is safe. */
  suggestion?: string;
  rule: string;
}

type Add = (f: Omit<Finding, 'start' | 'end'> & { from: Token; to?: Token }) => void;

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function isWord(t: Token | undefined): t is Token {
  return !!t && t.kind === 'word';
}

/** Does this word start with a vowel sound? null = not sure. */
export function startsWithVowelSound(word: string): boolean | null {
  if (!word) return null;
  const lower = word.toLowerCase();
  const letters = word.replace(/[^A-Za-z]/g, '');
  // Acronyms said letter by letter.
  if (L.AN_ACRONYMS.has(lower)) return true;
  if (letters.length >= 2 && letters === letters.toUpperCase()) return null;
  if (/[a-z][A-Z]/.test(word)) return null;
  if (word.length === 1) return null;
  if (L.SILENT_H.some((h) => lower.startsWith(h))) return true;
  if (/^[ai]/.test(lower)) return true;
  if (/^e/.test(lower)) return !/^(eu|ewe)/.test(lower);
  if (/^o/.test(lower)) return !/^(one|once)/.test(lower);
  if (/^u/.test(lower)) {
    if (L.VOWEL_LETTER_CONSONANT_SOUND.test(lower)) return false;
    if (L.U_VOWEL.test(lower)) return true;
    return null;
  }
  if (/^[bcdfgjklmnpqrstvwxyz]/.test(lower)) return lower.startsWith('h') ? null : false;
  return null;
}

function ruleArticleSound(ws: Token[], add: Add) {
  for (let i = 0; i < ws.length - 1; i++) {
    const a = ws[i] as Token;
    const next = ws[i + 1] as Token;
    if (a.sentence !== next.sentence || !isWord(next)) continue;
    if (a.lower !== 'a' && a.lower !== 'an') continue;
    // "Block A", "option a": a label, not an article.
    if (a.text === 'A' && !a.sentenceStart) continue;
    const prev = ws[i - 1];
    if (prev && L.LABEL_WORDS.has(prev.lower)) continue;
    let vowel: boolean | null;
    if (/^h/i.test(next.text) && !L.SILENT_H.some((h) => next.lower.startsWith(h))) vowel = L.AN_ACRONYMS.has(next.lower) ? true : false;
    else vowel = startsWithVowelSound(next.text);
    if (vowel === null) continue;
    if (a.lower === 'a' && vowel) {
      add({ from: a, tag: 'ARTICLE', rule: 'a-an', suggestion: a.text === 'A' ? 'An' : 'an', explanationAr: `نستخدم an قبل الكلمة التي تبدأ بصوت علّة، مثل an ${next.lower === 'hour' ? 'hour' : next.text}.`, explanationEn: `Use "an" before a vowel sound: an ${next.text}.` });
    } else if (a.lower === 'an' && !vowel) {
      add({ from: a, tag: 'ARTICLE', rule: 'an-a', suggestion: a.text === 'An' ? 'A' : 'a', explanationAr: `نستخدم a قبل الكلمة التي تبدأ بصوت ساكن، مثل a ${next.text}.`, explanationEn: `Use "a" before a consonant sound: a ${next.text}.` });
    }
  }
}

const BE_SUBJECT: Record<string, string[]> = {
  am: ['i'],
  is: ['he', 'she'],
  "'m": [],
};

function ruleMissingArticleJob(ws: Token[], add: Add) {
  for (let i = 0; i < ws.length; i++) {
    const t = ws[i] as Token;
    let jobIndex = -1;
    // "I am engineer", "She is teacher", "He's doctor", "My brother is doctor"
    if (t.lower === "i'm" || t.lower === "he's" || t.lower === "she's") jobIndex = i + 1;
    else if ((t.lower === 'am' && ws[i - 1]?.lower === 'i') || (t.lower === 'is' && i > 0 && ws[i - 1]?.sentence === t.sentence && (BE_SUBJECT.is?.includes(ws[i - 1]?.lower ?? '') || (ws[i - 2] && L.POSSESSIVES.has(ws[i - 2]?.lower ?? '') && L.PERSON_NOUNS.has(ws[i - 1]?.lower ?? ''))))) jobIndex = i + 1;
    // "works as engineer"
    else if (t.lower === 'as' && /^(work|works|worked|working)$/.test(ws[i - 1]?.lower ?? '')) jobIndex = i + 1;
    if (jobIndex < 0) continue;
    let j = jobIndex;
    if (ws[j] && L.JOB_ADJ.has(ws[j]?.lower ?? '') && ws[j + 1] && L.JOBS.has(ws[j + 1]?.lower ?? '')) j += 1;
    const job = ws[j];
    if (!job || job.sentence !== t.sentence || !L.JOBS.has(job.lower) || job.text[0] !== job.lower[0]) continue;
    const first = ws[jobIndex] as Token;
    const an = startsWithVowelSound(first.text) ? 'an' : 'a';
    add({ from: first, to: job, tag: 'ARTICLE', rule: 'job-article', suggestion: `${an} ${first.text}${j > jobIndex ? ' ' + job.text : ''}`, explanationAr: `نضع a أو an قبل المهنة في الإنجليزية: ${an} ${job.text}.`, explanationEn: `Use "a" or "an" before a job: ${an} ${job.text}.` });
  }
}

function prevIsAux(ws: Token[], i: number): boolean {
  const p = ws[i - 1];
  return !!p && p.sentence === (ws[i] as Token).sentence && L.AUX.has(p.lower);
}

function isSubjectAt(ws: Token[], i: number): boolean {
  const t = ws[i] as Token;
  if (L.SUBJECT_PRONOUNS.has(t.lower)) return !prevIsAux(ws, i) && ws[i - 1]?.lower !== 'than' && ws[i - 1]?.lower !== 'as';
  if (L.MAYBE_SUBJECT.has(t.lower)) return t.clauseStart || /^(and|but|so|because|when|if|then)$/.test(ws[i - 1]?.lower ?? '');
  return false;
}

function ruleMissingBe(ws: Token[], add: Add) {
  for (let i = 0; i < ws.length - 1; i++) {
    const s = ws[i] as Token;
    if (!isSubjectAt(ws, i) || s.lower === 'you') continue;
    let j = i + 1;
    if (L.DEGREE.has(ws[j]?.lower ?? '')) j += 1;
    const n = ws[j];
    const after = ws[j + 1];
    if (!n || n.sentence !== s.sentence) continue;
    const be = s.lower === 'i' ? 'am' : s.lower === 'he' || s.lower === 'she' || s.lower === 'it' ? 'is' : 'are';
    let hit = false;
    if (L.ADJ_STRICT.has(n.lower) && !L.ADJ_ALSO_VERB.has(n.lower)) hit = true;
    else if (L.JOBS.has(n.lower)) hit = true;
    else if (j === i + 1 && (n.lower === 'a' || n.lower === 'an') && after && L.JOBS.has(after.lower)) hit = true;
    else if (j === i + 1 && L.PLACE_PREPS.has(n.lower) && after && after.sentence === s.sentence && (L.AFTER_PLACE_PREP.has(after.lower) || (n.lower === 'from' && /^[A-Z]/.test(after.text)))) hit = true;
    if (!hit) continue;
    // Not a question like "Is she ready?" and not "I very much ..." (handled by ORDER).
    add({ from: s, tag: 'BE', rule: 'missing-be', suggestion: `${s.text} ${be}`, explanationAr: `الجملة تحتاج فعلًا. أضف ${be} بعد ${s.text}: ${s.text} ${be} ...`, explanationEn: `This sentence needs a verb. Add "${be}": ${s.text} ${be} ...` });
  }
  // "There a problem"
  for (let i = 0; i < ws.length - 1; i++) {
    const t = ws[i] as Token;
    const n = ws[i + 1] as Token;
    if (t.lower === 'there' && t.clauseStart && n.sentence === t.sentence && /^(a|an|many|some|no|two|three|several)$/.test(n.lower)) {
      add({ from: t, tag: 'BE', rule: 'there-be', suggestion: `${t.text} ${n.lower === 'a' || n.lower === 'an' ? 'is' : 'are'}`, explanationAr: 'نقول There is أو There are، ولا نحذف الفعل.', explanationEn: 'Say "There is" or "There are". Do not leave out the verb.' });
    }
  }
  // Sentence start: "My brother a doctor", "The weather hot today"
  for (let i = 0; i < ws.length - 2; i++) {
    const d = ws[i] as Token;
    if (!d.sentenceStart || !L.DETERMINERS.has(d.lower)) continue;
    const noun = ws[i + 1] as Token;
    const x = ws[i + 2] as Token;
    if (noun.sentence !== d.sentence || x.sentence !== d.sentence) continue;
    if (L.ADJ_STRICT.has(noun.lower) || L.DEGREE.has(noun.lower) || noun.lower.endsWith('s')) continue;
    const after = ws[i + 3];
    const ok =
      ((x.lower === 'a' || x.lower === 'an') && L.POSSESSIVES.has(d.lower) && L.PERSON_NOUNS.has(noun.lower)) ||
      (L.ADJ_STRICT.has(x.lower) && !L.ADJ_ALSO_VERB.has(x.lower) && x.lower !== 'broken' && (!after || after.sentence !== d.sentence || /^(today|now|again|and|because|but|so|in|at|this|very)$/.test(after.lower)));
    if (!ok) continue;
    add({ from: noun, tag: 'BE', rule: 'missing-be-noun', suggestion: `${noun.text} is`, explanationAr: `الجملة تحتاج فعلًا: ${d.text} ${noun.text} is ...`, explanationEn: `This sentence needs a verb: ${d.text} ${noun.text} is ...` });
  }
}

function ruleOrder(ws: Token[], add: Add) {
  for (let i = 0; i < ws.length - 2; i++) {
    const s = ws[i] as Token;
    if (!L.SUBJECT_PRONOUNS.has(s.lower) && !(L.MAYBE_SUBJECT.has(s.lower) && s.clauseStart)) continue;
    const a = ws[i + 1] as Token;
    const b = ws[i + 2] as Token;
    if (a.sentence !== s.sentence || b.sentence !== s.sentence) continue;
    // "I yesterday went", "They tomorrow will finish"
    if (L.TIME_ADVERBS.has(a.lower) && b.kind === 'word' && !/^(and|or|but|is|was)$/.test(b.lower)) {
      add({ from: a, tag: 'ORDER', rule: 'time-adverb', explanationAr: `كلمة ${a.text} تأتي عادة في أول الجملة أو آخرها، لا بين الفاعل والفعل.`, explanationEn: `Put "${a.text}" at the start or the end of the sentence, not between the subject and the verb.` });
      continue;
    }
    // "He every day drinks", "She last week visited"
    const c = ws[i + 3];
    if (c && c.sentence === s.sentence && c.kind === 'word' && ((a.lower === 'every' && /^(day|week|month|morning|evening|year)$/.test(b.lower)) || (a.lower === 'last' && /^(week|month|year|night)$/.test(b.lower)))) {
      add({ from: a, to: b, tag: 'ORDER', rule: 'time-phrase', explanationAr: `عبارة الوقت ${a.text} ${b.text} تأتي في أول الجملة أو آخرها.`, explanationEn: `Put "${a.text} ${b.text}" at the start or the end of the sentence.` });
      continue;
    }
    // "I very much like it"
    if (a.lower === 'very' && b.lower === 'much' && c && c.sentence === s.sentence && c.kind === 'word') {
      add({ from: a, to: b, tag: 'ORDER', rule: 'very-much', explanationAr: 'نضع very much في آخر الجملة: I like it very much.', explanationEn: 'Put "very much" at the end: I like it very much.' });
      continue;
    }
    // "I very like"
    if (a.lower === 'very' && L.LIKE_VERBS.has(b.lower)) {
      add({ from: a, to: b, tag: 'ORDER', rule: 'very-verb', explanationAr: 'لا نضع very قبل الفعل. نقول: I like it very much.', explanationEn: 'Do not put "very" before a verb. Say: I like it very much.' });
    }
  }
  // "a car new." (adjective after the noun, at the end of a clause)
  for (let i = 0; i < ws.length - 2; i++) {
    const a = ws[i] as Token;
    const n = ws[i + 1] as Token;
    const adj = ws[i + 2] as Token;
    if ((a.lower !== 'a' && a.lower !== 'an') || n.sentence !== a.sentence || adj.sentence !== a.sentence) continue;
    if (!L.POST_ADJ.has(adj.lower) || L.POST_ADJ.has(n.lower) || L.DEGREE.has(n.lower) || L.JOB_ADJ.has(n.lower)) continue;
    const after = ws[i + 3];
    const endOfClause = !after || after.sentence !== a.sentence || after.clauseStart;
    if (!endOfClause) continue;
    add({ from: n, to: adj, tag: 'ORDER', rule: 'adj-after-noun', suggestion: `${adj.text} ${n.text}`, explanationAr: `في الإنجليزية تأتي الصفة قبل الاسم: ${a.lower} ${adj.text} ${n.text}.`, explanationEn: `In English the adjective comes before the noun: ${a.lower} ${adj.text} ${n.text}.` });
  }
}

function ruleSpelling(ws: Token[], add: Add) {
  for (const t of ws) {
    if (t.kind !== 'word') continue;
    const pb = L.PB_MISSPELLINGS[t.lower];
    if (pb) {
      const sug = t.text[0] === t.text[0]?.toUpperCase() ? capitalize(pb) : pb;
      add({ from: t, tag: 'PB', rule: 'pb-spelling', suggestion: sug, explanationAr: `الكلمة الصحيحة ${pb}. انتبه إلى الفرق بين p و b.`, explanationEn: `The correct word is "${pb}". Check p and b.` });
      continue;
    }
    const fix = L.MISSPELLINGS[t.lower];
    if (fix) {
      const sug = t.text[0] === t.text[0]?.toUpperCase() ? capitalize(fix) : fix;
      add({ from: t, tag: 'SPELLING', rule: 'spelling', suggestion: sug, explanationAr: `الإملاء الصحيح: ${fix}.`, explanationEn: `Correct spelling: ${fix}.` });
    }
  }
}

function ruleSva(ws: Token[], add: Add, level: Level, tenseHits: Set<number>) {
  for (let i = 0; i < ws.length - 1; i++) {
    const s = ws[i] as Token;
    const v = ws[i + 1] as Token;
    if (v.sentence !== s.sentence || v.kind !== 'word' || tenseHits.has(v.start)) continue;
    const third = s.lower === 'he' || s.lower === 'she' || (s.lower === 'it' && isSubjectAt(ws, i));
    if (third && !prevIsAux(ws, i) && ws[i - 1]?.lower !== 'that') {
      if (L.BASE_VERBS.has(v.lower)) {
        const fixed = v.lower === 'have' ? 'has' : v.lower === 'do' ? 'does' : v.lower === 'go' ? 'goes' : /(s|sh|ch|x|o)$/.test(v.lower) ? v.lower + 'es' : /[^aeiou]y$/.test(v.lower) ? v.lower.slice(0, -1) + 'ies' : v.lower + 's';
        add({ from: v, tag: 'SVA', rule: 'he-go', suggestion: fixed, explanationAr: `مع ${s.text} نضيف s إلى الفعل في المضارع البسيط: ${s.text} ${fixed}.`, explanationEn: `After "${s.text}", the present simple verb takes -s: ${s.text} ${fixed}.` });
        continue;
      }
      if (v.lower === "don't") {
        add({ from: v, tag: 'SVA', rule: 'he-dont', suggestion: "doesn't", explanationAr: `مع ${s.text} نستخدم doesn't وليس don't.`, explanationEn: `After "${s.text}", use "doesn't", not "don't".` });
        continue;
      }
    }
    if ((s.lower === 'they' || s.lower === 'we') && v.lower === 'was' && !prevIsAux(ws, i)) {
      add({ from: v, tag: 'SVA', rule: 'they-was', suggestion: 'were', explanationAr: `مع ${s.text} نستخدم were وليس was.`, explanationEn: `After "${s.text}", use "were", not "was".` });
    }
    // "doesn't works"
    if (/^(doesn't|does|didn't|did|don't|do)$/.test(s.lower) && L.THIRD_PERSON_S.has(v.lower)) {
      const base = v.lower === 'has' ? 'have' : v.lower === 'does' ? 'do' : v.lower === 'goes' ? 'go' : v.lower === 'studies' ? 'study' : /(ches|shes|sses|xes)$/.test(v.lower) ? v.lower.slice(0, -2) : v.lower.slice(0, -1);
      add({ from: v, tag: 'SVA', rule: 'does-verb-s', suggestion: base, explanationAr: `بعد ${s.text} يأتي الفعل دون s: ${s.text} ${base}.`, explanationEn: `After "${s.text}", use the base verb: ${s.text} ${base}.` });
    }
  }
  // Noun subject at the start of a sentence: "The report show", "My father work"
  for (let i = 0; i < ws.length - 3; i++) {
    const d = ws[i] as Token;
    if (!d.sentenceStart || !L.DETERMINERS.has(d.lower)) continue;
    const n = ws[i + 1] as Token;
    const v = ws[i + 2] as Token;
    const after = ws[i + 3] as Token;
    if (n.sentence !== d.sentence || v.sentence !== d.sentence || after.sentence !== d.sentence) continue;
    if (n.lower.endsWith('s') || L.COLLECTIVE.has(n.lower) || L.ADJ_STRICT.has(n.lower)) continue;
    const person = L.POSSESSIVES.has(d.lower) && L.PERSON_NOUNS.has(n.lower);
    if (!(L.BASE_VERBS_AFTER_NOUN.has(v.lower) || (person && L.BASE_VERBS.has(v.lower)))) continue;
    if (tenseHits.has(v.start)) continue;
    const fixed = v.lower === 'have' ? 'has' : v.lower === 'do' ? 'does' : v.lower === 'go' ? 'goes' : /(s|sh|ch|x|o)$/.test(v.lower) ? v.lower + 'es' : /[^aeiou]y$/.test(v.lower) ? v.lower.slice(0, -1) + 'ies' : v.lower + 's';
    add({ from: v, tag: 'SVA', rule: 'noun-verb', suggestion: fixed, explanationAr: `${d.text} ${n.text} مفرد مثل he أو it، فنضيف s إلى الفعل: ${fixed}.`, explanationEn: `"${d.text} ${n.text}" is singular, so the verb takes -s: ${fixed}.` });
  }
  void level;
}

function rulePronoun(ws: Token[], add: Add) {
  for (let i = 0; i < ws.length - 3; i++) {
    const d = ws[i] as Token;
    if (!d.clauseStart || !L.POSSESSIVES.has(d.lower)) continue;
    const n = ws[i + 1] as Token;
    const p = ws[i + 2] as Token;
    const v = ws[i + 3] as Token;
    if (n.sentence !== d.sentence || p.sentence !== d.sentence || v.sentence !== d.sentence || v.kind !== 'word') continue;
    if (!L.PERSON_NOUNS.has(n.lower)) continue;
    const plural = n.lower === 'parents' || n.lower === 'children';
    const okPronoun = plural ? p.lower === 'they' : p.lower === 'he' || p.lower === 'she' || (p.lower === 'they' && n.lower === 'team');
    if (!okPronoun) continue;
    add({ from: p, tag: 'PRONOUN', rule: 'double-subject', explanationAr: `لا نكرر الفاعل بضمير. نقول: ${d.text} ${n.text} ${v.text} ...، دون ${p.text}.`, explanationEn: `Do not repeat the subject with a pronoun. Say: ${d.text} ${n.text} ${v.text} ..., without "${p.text}".` });
  }
  // "the engineer who I met him", "the report which I wrote it"
  const OBJ_VERBS = /^(wrote|write|met|meet|saw|see|bought|buy|built|build|designed|design|checked|check|fixed|fix|visited|visit|finished|finish|installed|install|prepared|prepare|repaired|repair|tested|test|used|use|need|needed|like|liked|want|wanted|sent|read|found|made|chose)$/;
  for (let i = 0; i < ws.length - 3; i++) {
    const r = ws[i] as Token;
    if (!/^(who|whom|which|that)$/.test(r.lower)) continue;
    const s = ws[i + 1] as Token;
    const v = ws[i + 2] as Token;
    const o = ws[i + 3] as Token;
    if (s.sentence !== r.sentence || v.sentence !== r.sentence || o.sentence !== r.sentence) continue;
    if (!/^(i|we|you|they|he|she)$/.test(s.lower) || !OBJ_VERBS.test(v.lower) || !/^(it|him|her|them)$/.test(o.lower)) continue;
    const after = ws[i + 4];
    // The object pronoun must end the clause or be followed by a time word.
    if (after && after.sentence === r.sentence && !after.clauseStart && !/^(yesterday|today|last|this|in|on|at|and|before|after)$/.test(after.lower)) continue;
    add({ from: o, tag: 'PRONOUN', rule: 'resumptive', explanationAr: `في العربية نقول «الذي قابلتُه»، أما في الإنجليزية فلا نكرر الضمير بعد ${r.text}. احذف ${o.text}.`, explanationEn: `Do not repeat the object after "${r.text}". Remove "${o.text}".` });
  }
}

function ruleUncountable(ws: Token[], add: Add) {
  for (let i = 0; i < ws.length; i++) {
    const t = ws[i] as Token;
    const fix = L.UNCOUNTABLE_PLURALS[t.lower];
    if (fix) {
      add({ from: t, tag: 'UNCOUNTABLE', rule: 'uncountable-plural', suggestion: fix, explanationAr: `${fix} اسم غير معدود في الإنجليزية، فلا نضيف إليه s.`, explanationEn: `"${fix}" is uncountable in English, so it has no -s.` });
      continue;
    }
    const n = ws[i + 1];
    if ((t.lower === 'a' || t.lower === 'an') && n && n.sentence === t.sentence && L.UNCOUNTABLE.has(n.lower) && n.lower !== 'research' && n.lower !== 'progress') {
      add({ from: t, to: n, tag: 'UNCOUNTABLE', rule: 'uncountable-article', suggestion: n.lower === 'advice' || n.lower === 'information' ? `a piece of ${n.text}` : undefined, explanationAr: `${n.text} اسم غير معدود، فلا نضع قبله a أو an. يمكن أن نقول some ${n.text}.`, explanationEn: `"${n.text}" is uncountable, so do not use "a" or "an". You can say "some ${n.text}".` });
    }
  }
}

function rulePreposition(ws: Token[], add: Add) {
  for (let i = 0; i < ws.length - 1; i++) {
    const t = ws[i] as Token;
    const n = ws[i + 1] as Token;
    if (n.sentence !== t.sentence) continue;
    for (const vp of L.VERB_PREP) {
      if (vp.re.test(t.lower) && n.lower === vp.fix) add({ from: n, tag: 'PREPOSITION', rule: 'verb-extra-prep', suggestion: '', explanationAr: vp.ar, explanationEn: vp.en });
    }
    if (/^(explain|explains|explained|explaining)$/.test(t.lower) && /^(me|him|her|us|them)$/.test(n.lower)) {
      add({ from: t, to: n, tag: 'PREPOSITION', rule: 'explain-me', explanationAr: `لا نقول explain ${n.text}. نقول: explain something to ${n.text}.`, explanationEn: `Do not say "explain ${n.text}". Say: explain something to ${n.text}.` });
    }
    if (t.lower === 'since') {
      const unit = ws[i + 2];
      if ((n.kind === 'num' || L.NUMBER_WORDS.has(n.lower)) && unit && unit.sentence === t.sentence && L.DURATION_UNITS.has(unit.lower) && !(n.kind === 'num' && /^\d{4}$/.test(n.text))) {
        add({ from: t, tag: 'PREPOSITION', rule: 'since-for', suggestion: t.text === 'Since' ? 'For' : 'for', explanationAr: 'مع المدة (three years) نستخدم for. ونستخدم since مع نقطة البداية (since 2019).', explanationEn: 'Use "for" with a length of time (for three years) and "since" with a starting point (since 2019).' });
      }
    }
    if ((t.lower === 'in' || t.lower === 'at') && L.DAYS.has(n.lower)) {
      add({ from: t, tag: 'PREPOSITION', rule: 'on-day', suggestion: 'on', explanationAr: 'مع أيام الأسبوع نستخدم on: on Monday.', explanationEn: 'Use "on" with days: on Monday.' });
    }
    if (t.lower === 'in' && n.lower === 'night') {
      add({ from: t, tag: 'PREPOSITION', rule: 'at-night', suggestion: 'at', explanationAr: 'نقول at night.', explanationEn: 'Say "at night".' });
    }
    if (t.lower === 'at' && n.lower === 'the' && /^(morning|afternoon|evening)$/.test(ws[i + 2]?.lower ?? '')) {
      add({ from: t, tag: 'PREPOSITION', rule: 'in-the-morning', suggestion: 'in', explanationAr: 'نقول in the morning و in the evening.', explanationEn: 'Say "in the morning" and "in the evening".' });
    }
    if (/^(arrive|arrives|arrived|arriving)$/.test(t.lower) && n.lower === 'to') {
      add({ from: n, tag: 'PREPOSITION', rule: 'arrive-at', suggestion: 'at', explanationAr: 'نقول arrive at لمكان محدد، و arrive in لمدينة أو بلد. لا نقول arrive to.', explanationEn: 'Say "arrive at" a place or "arrive in" a city. Not "arrive to".' });
    }
    if (/^(depend|depends|depended|depending)$/.test(t.lower) && (n.lower === 'of' || n.lower === 'from')) {
      add({ from: n, tag: 'PREPOSITION', rule: 'depend-on', suggestion: 'on', explanationAr: 'نقول depend on.', explanationEn: 'Say "depend on".' });
    }
    if (/^(consist|consists|consisted)$/.test(t.lower) && n.lower === 'from') {
      add({ from: n, tag: 'PREPOSITION', rule: 'consist-of', suggestion: 'of', explanationAr: 'نقول consist of.', explanationEn: 'Say "consist of".' });
    }
    if (t.lower === 'interested' && (n.lower === 'about' || n.lower === 'on' || n.lower === 'with')) {
      add({ from: n, tag: 'PREPOSITION', rule: 'interested-in', suggestion: 'in', explanationAr: 'نقول interested in.', explanationEn: 'Say "interested in".' });
    }
    if (t.lower === 'afraid' && n.lower === 'from') {
      add({ from: n, tag: 'PREPOSITION', rule: 'afraid-of', suggestion: 'of', explanationAr: 'نقول afraid of.', explanationEn: 'Say "afraid of".' });
    }
    if (t.lower === 'responsible' && (n.lower === 'of' || n.lower === 'about')) {
      add({ from: n, tag: 'PREPOSITION', rule: 'responsible-for', suggestion: 'for', explanationAr: 'نقول responsible for.', explanationEn: 'Say "responsible for".' });
    }
    if (t.lower === 'married' && n.lower === 'with') {
      add({ from: n, tag: 'PREPOSITION', rule: 'married-to', suggestion: 'to', explanationAr: 'نقول married to.', explanationEn: 'Say "married to".' });
    }
  }
}

function ruleTense(ws: Token[], add: Add, level: Level): Set<number> {
  const hits = new Set<number>();
  if (level === 'A1') return hits;
  // did + past form: "did not finished", "didn't went"
  for (let i = 0; i < ws.length - 1; i++) {
    const t = ws[i] as Token;
    let j = i + 1;
    if (t.lower === 'did' && ws[j]?.lower === 'not') j += 1;
    else if (t.lower === 'did' && L.SUBJECT_PRONOUNS.has(ws[j]?.lower ?? '')) j += 1;
    else if (t.lower !== "didn't") continue;
    const v = ws[j];
    if (!v || v.sentence !== t.sentence || v.kind !== 'word') continue;
    const isPast = L.PAST_FORMS.has(v.lower) || (/[a-z]{2,}ed$/.test(v.lower) && !L.ED_NOT_PAST.has(v.lower));
    if (!isPast) continue;
    hits.add(v.start);
    add({ from: v, tag: 'TENSE', rule: 'did-past', explanationAr: 'بعد did أو didn’t يأتي الفعل في صورته الأساسية: didn’t go، did not finish.', explanationEn: 'After "did" or "didn’t", use the base verb: didn’t go, did not finish.' });
  }
  // Past time marker + pronoun + base verb in the same sentence.
  const bySentence = new Map<number, Token[]>();
  for (const t of ws) bySentence.set(t.sentence, [...(bySentence.get(t.sentence) ?? []), t]);
  for (const sent of bySentence.values()) {
    const lowers = sent.map((t) => t.lower);
    const past =
      lowers.includes('yesterday') ||
      lowers.includes('ago') ||
      lowers.some((w, k) => w === 'last' && /^(week|month|year|night|time)$/.test(lowers[k + 1] ?? ''));
    if (!past || lowers.some((w) => /^(will|can|could|would|should|must|may|might|do|does|don't|doesn't|usually|always|often|every)$/.test(w))) continue;
    for (let k = 0; k < sent.length - 1; k++) {
      const s = sent[k] as Token;
      const v = sent[k + 1] as Token;
      if (!/^(i|we|they|you|he|she)$/.test(s.lower)) continue;
      if (k > 0 && L.AUX.has((sent[k - 1] as Token).lower)) continue;
      if (!L.BASE_VERBS.has(v.lower) && !L.THIRD_PERSON_S.has(v.lower)) continue;
      hits.add(v.start);
      add({ from: v, tag: 'TENSE', rule: 'past-marker', explanationAr: 'في الجملة كلمة تدل على الماضي (مثل yesterday أو ago)، فنستخدم الفعل الماضي.', explanationEn: 'The sentence talks about the past (yesterday, ago, last week), so use the past tense.' });
    }
  }
  return hits;
}

function ruleBasics(text: string, tokens: Token[], ws: Token[], add: Add) {
  // Lowercase "i" as a word.
  for (const t of ws) {
    if (t.text === 'i' || /^i'(m|ve|ll|d)$/.test(t.text)) {
      add({ from: t, tag: 'CAPITAL', rule: 'lowercase-i', suggestion: 'I' + t.text.slice(1), explanationAr: 'الضمير I يُكتب دائمًا بحرف كبير.', explanationEn: 'Always write "I" as a capital letter.' });
    }
  }
  // Capital letter at the start of each sentence.
  for (const t of ws) {
    if (!t.sentenceStart || t.kind !== 'word' || t.text === 'i') continue;
    if (/^[a-z]/.test(t.text) && !/^(e\.g|i\.e|etc)$/.test(t.lower)) {
      add({ from: t, tag: 'CAPITAL', rule: 'sentence-capital', suggestion: capitalize(t.text), explanationAr: 'تبدأ الجملة بحرف كبير.', explanationEn: 'Start a sentence with a capital letter.' });
    }
  }
  // Final punctuation.
  const trimmed = text.replace(/\s+$/, '');
  if (!trimmed) return;
  const lines = trimmed.split('\n').map((l) => l.trim()).filter(Boolean);
  const last = lines[lines.length - 1] ?? '';
  const beforeLast = lines[lines.length - 2] ?? '';
  const signOff = beforeLast.endsWith(',') && last.split(/\s+/).length <= 4;
  if (!signOff && !/[.!?]["')\]]?$/.test(trimmed) && !last.endsWith(',')) {
    const lastTok = [...tokens].reverse().find((t) => t.kind !== 'punct');
    if (lastTok) add({ from: lastTok, tag: 'PUNCTUATION', rule: 'final-punctuation', explanationAr: 'ضع نقطة (.) أو علامة استفهام (?) في نهاية الجملة.', explanationEn: 'End the sentence with a period (.) or a question mark (?).' });
  }
}

const PRIORITY: TagId[] = ['TENSE', 'PRONOUN', 'UNCOUNTABLE', 'PB', 'SPELLING', 'PREPOSITION', 'ARTICLE', 'ORDER', 'SVA', 'BE', 'CAPITAL', 'PUNCTUATION'];

export function check(text: string, level: Level = 'B1'): Finding[] {
  const tokens = tokenize(text);
  const ws = words(tokens);
  const found: Finding[] = [];
  const add: Add = ({ from, to, ...rest }) => {
    found.push({ ...rest, start: from.start, end: (to ?? from).end });
  };
  const tenseHits = ruleTense(ws, add, level);
  rulePronoun(ws, add);
  ruleUncountable(ws, add);
  ruleSpelling(ws, add);
  rulePreposition(ws, add);
  ruleMissingArticleJob(ws, add);
  ruleArticleSound(ws, add);
  ruleOrder(ws, add);
  ruleSva(ws, add, level, tenseHits);
  ruleMissingBe(ws, add);
  ruleBasics(text, tokens, ws, add);

  // Keep one finding per stretch of text, by priority; then sort by position.
  const sorted = found.sort((a, b) => PRIORITY.indexOf(a.tag) - PRIORITY.indexOf(b.tag));
  const kept: Finding[] = [];
  for (const f of sorted) {
    const overlaps = kept.some((k) => f.start < k.end && k.start < f.end && !(isBasic(f) !== isBasic(k)));
    if (!overlaps) kept.push(f);
  }
  return kept.sort((a, b) => a.start - b.start || a.end - b.end);
}

function isBasic(f: Finding): boolean {
  return f.tag === 'CAPITAL' || f.tag === 'PUNCTUATION';
}

/** Tags of findings, for My Mistakes. */
export function findingTags(findings: readonly Finding[]): TagId[] {
  return findings.map((f) => f.tag);
}
