import { describe, expect, it } from 'vitest';
import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { ALL_PLANS, COURSE_IDS, COURSE_ID_PATTERN, DEFAULT_COURSE_ID, LESSONS, PHRASES, PLACEMENT, SAY_PROMPTS, STORIES, TAGS, WRITING_TASKS, getPhrase, getPlanIn, getSayPrompt, getStory, getTask, lessonsForTrack, loadCourse } from '../../src/core/content';
import { check } from '../../src/checker';
import { tagHints } from '../../src/app/tagHints';
import phraseFile from '../../content/en-from-ar/phrases.json';
import storyFile from '../../content/en-from-ar/stories.json';
import sayFile from '../../content/en-from-ar/say-aloud.json';
import { normalizeAnswer } from '../../src/core/answers';
import { LEVELS, type TagId } from '../../src/core/types';
import ar from '../../src/i18n/ar.json';
import en from '../../src/i18n/en.json';

const ARABIC = /[؀-ۿ]/;
const tagIds = new Set<string>(TAGS.map((t) => t.id));
const FIRST_FIVE: TagId[] = ['ARTICLE', 'BE', 'ORDER', 'SPELLING', 'PB'];

describe('content schema and counts', () => {
  it('has 24 General lessons (6 per level) and 8 Engineers lessons', () => {
    const general = lessonsForTrack('general');
    expect(general).toHaveLength(24);
    for (const level of LEVELS) expect(general.filter((l) => l.level === level), level).toHaveLength(6);
    const eng = lessonsForTrack('engineers');
    expect(eng).toHaveLength(8);
    for (const l of eng) expect(['B1', 'B2']).toContain(l.level);
  });

  it('has at least 24 writing tasks across levels and both tracks', () => {
    expect(WRITING_TASKS.length).toBeGreaterThanOrEqual(24);
    for (const level of LEVELS) expect(WRITING_TASKS.some((t) => t.level === level), level).toBe(true);
    expect(WRITING_TASKS.some((t) => t.track === 'general')).toBe(true);
    expect(WRITING_TASKS.some((t) => t.track === 'engineers')).toBe(true);
  });

  it('every id is unique across lessons, exercises, tasks and placement', () => {
    const ids = [
      ...LESSONS.map((l) => l.id),
      ...LESSONS.flatMap((l) => l.exercises.map((e) => e.id)),
      ...WRITING_TASKS.map((t) => t.id),
      ...PLACEMENT.map((q) => q.id),
    ];
    const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
    expect(dupes).toEqual([]);
  });

  it('every lesson has the required fields and is marked unreviewed', () => {
    for (const l of LESSONS) {
      expect(['general', 'engineers'], l.id).toContain(l.track);
      expect(LEVELS, l.id).toContain(l.level);
      expect(l.titleEn && l.titleAr && l.explanationAr && l.explanationEn, l.id).toBeTruthy();
      expect(l.examples.length, l.id).toBeGreaterThanOrEqual(2);
      expect(l.exercises.length, l.id).toBeGreaterThanOrEqual(6);
      expect(l.exercises.length, l.id).toBeLessThanOrEqual(8);
      expect(getTask(l.writingTaskId), `${l.id} writing task`).toBeDefined();
      expect(l.reviewed, l.id).toBe(false);
      for (const t of l.tags) expect(tagIds, `${l.id} tag ${t}`).toContain(t);
    }
    for (const t of WRITING_TASKS) {
      expect(t.reviewed, t.id).toBe(false);
      expect(t.wordLimit, t.id).toBeLessThanOrEqual(100);
      expect(t.selfCheckAr.length, t.id).toBeGreaterThanOrEqual(3);
      expect(t.selfCheckAr.length, t.id).toBeLessThanOrEqual(4);
      expect(t.modelAnswer.trim().split(/\s+/).length, `${t.id} model answer within limit`).toBeLessThanOrEqual(t.wordLimit);
      if (t.lessonId) expect(LESSONS.some((l) => l.id === t.lessonId), t.id).toBe(true);
    }
  });

  it('each of the first five tags appears in at least 3 General lessons', () => {
    for (const tag of FIRST_FIVE) {
      const n = lessonsForTrack('general').filter((l) => l.tags.includes(tag) && l.exercises.some((e) => e.tags.includes(tag))).length;
      expect(n, tag).toBeGreaterThanOrEqual(3);
    }
  });
});

describe('exercises', () => {
  const all = LESSONS.flatMap((l) => l.exercises.map((e) => ({ e, l })));

  it('only uses the four allowed types, with known tags and an Arabic explanation', () => {
    for (const { e } of all) {
      expect(['mc', 'fill', 'reorder', 'fix'], e.id).toContain(e.type);
      expect(e.tags.length, e.id).toBeGreaterThanOrEqual(1);
      for (const t of e.tags) expect(tagIds, `${e.id} tag ${t}`).toContain(t);
      expect(e.explanationAr, e.id).toMatch(ARABIC);
    }
  });

  it('has an accepted answer, exactly one right option, and no duplicate options', () => {
    for (const { e } of all) {
      if (e.type === 'mc') {
        expect(Number.isInteger(e.answer) && e.answer >= 0 && e.answer < e.options.length, e.id).toBe(true);
        const norm = e.options.map((o) => normalizeAnswer(o));
        expect(new Set(norm).size, `${e.id} duplicate options`).toBe(e.options.length);
        expect(e.options.length, e.id).toBeGreaterThanOrEqual(2);
      } else if (e.type === 'fill') {
        expect(e.accepted.length, e.id).toBeGreaterThanOrEqual(1);
        expect(e.prompt.split('___').length - 1, `${e.id} one gap`).toBe(1);
        for (const a of e.accepted) expect(a.trim(), e.id).not.toBe('');
      } else if (e.type === 'fix') {
        expect(e.accepted.length, e.id).toBeGreaterThanOrEqual(1);
        const wrong = normalizeAnswer(e.sentence);
        for (const a of e.accepted) expect(normalizeAnswer(a), `${e.id} accepted differs from the wrong sentence`).not.toBe(wrong);
      } else {
        expect(e.words.length, e.id).toBeGreaterThanOrEqual(3);
      }
    }
  });
});

/** Every Arabic field and every English field in the content and interface. */
function fields() {
  const arabic: [string, string][] = [];
  const english: [string, string][] = [];
  for (const t of TAGS) {
    arabic.push([`tag ${t.id}`, t.nameAr]);
    english.push([`tag ${t.id}`, t.nameEn]);
    if (t.hint) arabic.push([`tag hint ${t.id}`, t.hint.ar]);
  }
  for (const q of PLACEMENT) {
    english.push([q.id, q.prompt]);
    q.options.forEach((o) => english.push([q.id, o]));
  }
  for (const l of LESSONS) {
    arabic.push([l.id, l.titleAr], [l.id, l.explanationAr]);
    english.push([l.id, l.titleEn], [l.id, l.explanationEn]);
    for (const c of l.comparison) {
      arabic.push([l.id, c.ar], [l.id, c.noteAr]);
      english.push([l.id, c.en]);
    }
    for (const x of l.examples) {
      arabic.push([l.id, x.ar]);
      english.push([l.id, x.en]);
    }
    for (const e of l.exercises) {
      arabic.push([e.id, e.explanationAr]);
      if (e.type === 'mc') english.push([e.id, e.prompt], ...e.options.map((o): [string, string] => [e.id, o]));
      if (e.type === 'fill') english.push([e.id, e.prompt], ...e.accepted.map((o): [string, string] => [e.id, o]));
      if (e.type === 'fix') english.push([e.id, e.sentence], ...e.accepted.map((o): [string, string] => [e.id, o]));
      if (e.type === 'reorder') english.push([e.id, e.words.join(' ')]);
    }
  }
  for (const t of WRITING_TASKS) {
    arabic.push([t.id, t.titleAr], [t.id, t.promptAr], ...t.selfCheckAr.map((s): [string, string] => [t.id, s]));
    english.push([t.id, t.titleEn], [t.id, t.promptEn], [t.id, t.modelAnswer]);
  }
  for (const ph of PHRASES) {
    english.push([ph.id, ph.en]);
    arabic.push([ph.id, ph.ar], [ph.id, ph.noteAr]);
  }
  for (const st of STORIES) {
    english.push([st.id, st.titleEn], [st.id, st.retell.promptEn], [st.id, st.retell.sample]);
    arabic.push([st.id, st.titleAr], [st.id, st.retell.promptAr]);
    for (const l of st.lines) {
      english.push([st.id, l.en]);
      arabic.push([st.id, l.ar]);
    }
    for (const q of st.questions) {
      english.push([q.id, q.prompt], ...q.options.map((o): [string, string] => [q.id, o]));
      arabic.push([q.id, q.explanationAr]);
    }
  }
  for (const sa of SAY_PROMPTS) {
    english.push([sa.id, sa.promptEn], [sa.id, sa.sample]);
    arabic.push([sa.id, sa.promptAr]);
  }
  for (const pl of ALL_PLANS) {
    english.push([pl.id, pl.titleEn], [pl.id, pl.summaryEn], [pl.id, pl.honestEn], [pl.id, pl.howItWorksEn], ...pl.canDoEn.map((x): [string, string] => [pl.id, x]), ...pl.cannotYetEn.map((x): [string, string] => [pl.id, x]));
    arabic.push([pl.id, pl.titleAr], [pl.id, pl.summaryAr], [pl.id, pl.honestAr], [pl.id, pl.howItWorksAr], ...pl.canDoAr.map((x): [string, string] => [pl.id, x]), ...pl.cannotYetAr.map((x): [string, string] => [pl.id, x]));
    for (const x of [...pl.routine, ...pl.goals, ...pl.selfCheck]) {
      english.push([pl.id, x.en]);
      arabic.push([pl.id, x.ar]);
    }
  }
  for (const [k, v] of Object.entries(ar)) arabic.push([`ar.json ${k}`, v]);
  for (const [k, v] of Object.entries(en)) english.push([`en.json ${k}`, v]);
  return { arabic, english };
}

describe('languages', () => {
  const { arabic, english } = fields();
  // Interface strings that are names of the languages themselves.
  const ARABIC_EXCEPTIONS = new Set(['ar.json welcome.langEn', 'ar.json result.A1', 'ar.json result.A2', 'ar.json result.B1', 'ar.json result.B2']);
  const ENGLISH_EXCEPTIONS = new Set(['en.json welcome.langAr']);

  it('all Arabic fields contain Arabic letters', () => {
    const bad = arabic.filter(([k, v]) => !ARABIC_EXCEPTIONS.has(k) && !ARABIC.test(v));
    expect(bad).toEqual([]);
  });

  it('no English field contains Arabic letters', () => {
    const bad = english.filter(([k, v]) => !ENGLISH_EXCEPTIONS.has(k) && ARABIC.test(v));
    expect(bad).toEqual([]);
  });
});

export const BANNED_EN = [
  'music', 'musical', 'musician', 'song', 'songs', 'sing', 'sings', 'singing', 'singer', 'dance', 'dances', 'dancing', 'dancer', 'concert',
  'wine', 'beer', 'alcohol', 'alcoholic', 'pork', 'bacon', 'ham', 'casino', 'lottery', 'gamble', 'gambling', 'bet', 'betting', 'girlfriend',
  'boyfriend', 'dating', 'kiss', 'kissing', 'sexy', 'sex', 'romance', 'romantic', 'nightclub', 'club', 'pub', 'bar', 'bars', 'drugs', 'magic',
  'witch', 'horoscope', 'loan', 'loans', 'mortgage', 'christmas', 'easter', 'halloween', 'valentine', 'diwali', 'hanukkah', 'election',
  'politics', 'political', 'president', 'parliament', 'party', 'pig', 'pigs', 'jingle', 'melody', 'guitar', 'piano', 'drum',
];
/** "date" only when it means romance. */
const BANNED_EN_PHRASES = [/\bon a date\b/i, /\ba date with\b/i, /\bgo on dates?\b/i, /\binterest rate\b/i];
/**
 * Allow-list for real engineering uses, with the reason:
 * - "bars on the chart": a bar chart (also a checker test sentence).
 * - "bar chart": the chart type on the My Mistakes page.
 * - "steel bar(s)" / "reinforcing bar(s)": construction material.
 */
const ALLOW = [/\bbars on the chart\b/i, /\bbar chart\b/i, /\b(steel|reinforcing|reinforcement) bars?\b/i];

const BANNED_AR = ['موسيق', 'أغني', 'أغان', 'غناء', 'رقص', 'خمر', 'كحول', 'بيرة', 'نبيذ', 'خنزير', 'قمار', 'يانصيب', 'مراهن', 'حبيب', 'مواعدة', 'سحر', 'ملهى', 'ربوي', 'انتخاب', 'عيد الميلاد'];

export function bannedHits(text: string): string[] {
  let t = text;
  for (const a of ALLOW) t = t.replace(new RegExp(a.source, 'gi'), ' ');
  const hits: string[] = [];
  for (const w of BANNED_EN) if (new RegExp(`\\b${w}\\b`, 'i').test(t)) hits.push(w);
  for (const p of BANNED_EN_PHRASES) if (p.test(t)) hits.push(p.source);
  // Arabic: the word may carry a prefix (و ف ب ل and ال), but must not be inside a longer word (كبيرة is not بيرة).
  for (const w of BANNED_AR) if (new RegExp(`(?<![\\u0600-\\u06FF])[وفبل]?(?:ال)?${w}`).test(t)) hits.push(w);
  return hits;
}

describe('banned words', () => {
  it('the scanner itself works', () => {
    expect(bannedHits('We went to a concert.')).toEqual(['concert']);
    expect(bannedHits('The bars on the chart show flow.')).toEqual([]);
    expect(bannedHits('The steel bars arrived.')).toEqual([]);
    expect(bannedHits('the delivery date')).toEqual([]);
    expect(bannedHits('a date with her')).not.toEqual([]);
    expect(bannedHits('سمعتُ الموسيقى')).toEqual(['موسيق']);
    expect(bannedHits('A betting shop')).toEqual(['betting']);
    expect(bannedHits('a better plan')).toEqual([]);
    expect(bannedHits('غرفة كبيرة')).toEqual([]);
    expect(bannedHits('والموسيقى')).toEqual(['موسيق']);
  });

  it('no banned words in any content or interface text', () => {
    const { arabic, english } = fields();
    const bad = [...arabic, ...english].map(([k, v]) => [k, bannedHits(v)] as const).filter(([, h]) => h.length > 0);
    expect(bad).toEqual([]);
  });
});

describe('15-Day Start content', () => {
  it('is all marked unreviewed', () => {
    expect(phraseFile.reviewed).toBe(false);
    expect(storyFile.reviewed).toBe(false);
    expect(sayFile.reviewed).toBe(false);
    for (const p of ALL_PLANS) expect(p.reviewed, p.id).toBe(false);
  });

  it('has 48 phrases, 12 stories and 15 say-aloud prompts, with unique ids', () => {
    expect(PHRASES).toHaveLength(48);
    expect(STORIES).toHaveLength(12);
    expect(SAY_PROMPTS).toHaveLength(15);
    const ids = [...PHRASES.map((p) => p.id), ...STORIES.map((s) => s.id), ...STORIES.flatMap((s) => s.questions.map((q) => q.id)), ...SAY_PROMPTS.map((s) => s.id), ...ALL_PLANS.map((p) => p.id)];
    expect(ids.filter((id, i) => ids.indexOf(id) !== i)).toEqual([]);
  });

  it('every story has 4 lines and 3 questions with exactly one right, unique option', () => {
    for (const st of STORIES) {
      expect(st.lines, st.id).toHaveLength(4);
      expect(st.questions, st.id).toHaveLength(3);
      for (const q of st.questions) {
        expect(q.answer >= 0 && q.answer < q.options.length, q.id).toBe(true);
        expect(new Set(q.options.map((o) => normalizeAnswer(o))).size, q.id).toBe(q.options.length);
      }
    }
  });

  it('every plan day points to content that exists', () => {
    for (const pl of ALL_PLANS) {
      for (const d of pl.schedule) {
        for (const id of d.phrases) expect(getPhrase(id), `${pl.id} day ${d.day} ${id}`).toBeDefined();
        expect(getSayPrompt(d.sayId), `${pl.id} day ${d.day}`).toBeDefined();
        if (d.type === 'learn') expect(getStory(d.storyId), `${pl.id} day ${d.day}`).toBeDefined();
        else expect(getTask(d.writingTaskId), `${pl.id} day ${d.day}`).toBeDefined();
      }
      expect(pl.selfCheck.length).toBeGreaterThanOrEqual(3);
      expect(pl.canDoEn.length).toBe(pl.canDoAr.length);
      expect(pl.cannotYetEn.length).toBe(pl.cannotYetAr.length);
      expect(pl.cannotYetEn.length).toBeGreaterThan(0);
    }
  });

  it('makes no false promises: no "learn in N days", no fluency promise, and it says it is below A1', () => {
    for (const pl of ALL_PLANS) {
      const all = JSON.stringify(pl);
      expect(all).not.toMatch(/learn (english )?in \d+ days/i);
      expect(all).not.toMatch(/fluent in/i);
      expect(all).not.toMatch(/(تتعلم|تعلّم|تعلم) الإنجليزية في \d+/);
      expect(pl.honestEn).toMatch(/will not make you fluent/i);
      expect(pl.honestEn).toMatch(/below A1/);
      expect(pl.honestAr).toMatch(/أقل من مستوى A1/);
      expect(pl.honestEn).toMatch(/hundreds of hours/);
    }
  });

  it('has no religious references', () => {
    const texts = [JSON.stringify(phraseFile), JSON.stringify(storyFile), JSON.stringify(sayFile), ...ALL_PLANS.map((p) => JSON.stringify(p))].join(' ');
    expect(texts).not.toMatch(/\b(quran|koran|hadith|prophet|zayd|zaid|sahaba|mosque|church|prayer|pray)\b/i);
    for (const w of ['القرآن', 'حديث شريف', 'زيد بن ثابت', 'الصحابة', 'النبي', 'صلاة']) expect(texts.includes(w), w).toBe(false);
  });

  it('the writing checker finds nothing in our own correct English (phrases, stories, samples)', () => {
    const own = [
      ...PHRASES.map((p) => [p.id, p.en]),
      ...STORIES.flatMap((s) => [...s.lines.map((l) => [s.id, l.en]), [s.id, s.retell.sample]]),
      ...SAY_PROMPTS.map((s) => [s.id, s.sample]),
    ];
    const bad = own.flatMap(([id, text]) => check(text as string, 'A2').map((f) => `${id}: ${f.tag} "${(text as string).slice(f.start, f.end)}" in "${text}"`));
    expect(bad).toEqual([]);
  });
});

describe('course loader', () => {
  it('finds exactly one course, en-from-ar, from the content folders', () => {
    expect(COURSE_IDS).toEqual(['en-from-ar']);
    expect(DEFAULT_COURSE_ID).toBe('en-from-ar');
    const dirs = readdirSync(join(__dirname, '..', '..', 'content')).filter((n) => statSync(join(__dirname, '..', '..', 'content', n)).isDirectory());
    expect(dirs).toEqual(COURSE_IDS);
    for (const id of COURSE_IDS) expect(id).toMatch(COURSE_ID_PATTERN);
  });

  it('loads a course by id, and the app content is that course', () => {
    const c = loadCourse('en-from-ar');
    expect(c).toBeDefined();
    if (!c) return;
    expect(c).toMatchObject({ id: 'en-from-ar', target: 'en', learner: 'ar' });
    expect(c.lessons).toBe(LESSONS);
    expect(c.writingTasks).toBe(WRITING_TASKS);
    expect(c.placement).toBe(PLACEMENT);
    expect(c.tags).toBe(TAGS);
    expect(c.phrases).toBe(PHRASES);
    expect(c.stories).toBe(STORIES);
    expect(c.sayPrompts).toBe(SAY_PROMPTS);
    expect(c.allPlans).toBe(ALL_PLANS);
    expect(loadCourse('en-from-ar')).toBe(c);
    expect(c.lessons).toHaveLength(32);
    expect(c.placement.length).toBeGreaterThan(0);
    expect(c.phrases).toHaveLength(48);
    expect(getPlanIn('en-from-ar', '15-day-start')?.days).toBe(15);
  });

  it('returns nothing for an unknown course id', () => {
    expect(loadCourse('zh-from-ar')).toBeUndefined();
    expect(loadCourse('')).toBeUndefined();
    expect(loadCourse('../en-from-ar')).toBeUndefined();
    expect(getPlanIn('zh-from-ar', '15-day-start')).toBeUndefined();
  });
});

describe('Arabic-speaker hints for mistake tags', () => {
  it('has a hint for every tag in the English course, not reviewed yet, worded with "may"', () => {
    for (const t of TAGS) {
      expect(t.hint, t.id).toBeDefined();
      if (!t.hint) continue;
      expect(t.hint.reviewed, t.id).toBe(false);
      expect(t.hint.ar, t.id).toMatch(/[\u0600-\u06FF]/);
      // "you may say X because Arabic does Y": a possibility, never a fact about learners.
      expect(t.hint.ar.startsWith('قد '), t.id).toBe(true);
      expect(t.hint.ar, t.id).toMatch(/لأن/);
      expect(t.hint.ar.length, t.id).toBeLessThanOrEqual(220);
      expect(bannedHits(t.hint.ar), t.id).toEqual([]);
    }
  });

  it('shows hints only for tags that have one, once each, so a course without hints shows nothing', () => {
    const withHint = TAGS.filter((t) => t.hint);
    const first = withHint[0];
    expect(first).toBeDefined();
    if (!first) return;
    expect(tagHints([first.id, first.id], TAGS)).toEqual([{ id: first.id, ar: first.hint?.ar }]);
    const noHints = TAGS.map((t) => ({ id: t.id, nameEn: t.nameEn, nameAr: t.nameAr }));
    expect(tagHints(TAGS.map((t) => t.id), noHints)).toEqual([]);
    expect(tagHints([], TAGS)).toEqual([]);
  });
});
