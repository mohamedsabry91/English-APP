// Loads course content by course id. Each course lives in content/<target>-from-<learner>/.
// Today there is one course, en-from-ar; the exports below the loader are that course's content.
import type { Exercise, Lesson, Phrase, PlacementQuestion, Plan, SayPrompt, Story, TagInfo, WritingTask } from './contentTypes';
import { LEVELS, type Level, type PlacementResult, type TagId, type TrackChoice, type TrackId } from './types';
import { startLevel } from './placement';
import { cleanManifest, type AudioManifest } from '../audio/player';

const placementFiles = import.meta.glob('../../content/*/placement.json', { eager: true, import: 'default' });
const tagFiles = import.meta.glob('../../content/*/tags.json', { eager: true, import: 'default' });
const phraseFiles = import.meta.glob('../../content/*/phrases.json', { eager: true, import: 'default' });
const storyFiles = import.meta.glob('../../content/*/stories.json', { eager: true, import: 'default' });
const sayFiles = import.meta.glob('../../content/*/say-aloud.json', { eager: true, import: 'default' });
const lessonFiles = import.meta.glob('../../content/*/lessons/*.json', { eager: true, import: 'default' });
const writingFiles = import.meta.glob('../../content/*/writing/*.json', { eager: true, import: 'default' });
const planFiles = import.meta.glob('../../content/*/plans/*.json', { eager: true, import: 'default' });
const audioFiles = import.meta.glob('../../content/*/audio.json', { eager: true, import: 'default' });

/** A course id names the language taught and the learner's language, for example "en-from-ar". */
export const COURSE_ID_PATTERN = /^[a-z]{2,3}-from-[a-z]{2,3}$/;
export const DEFAULT_COURSE_ID = 'en-from-ar';

const courseOf = (path: string) => /\/content\/([^/]+)\//.exec(path)?.[1] ?? '';
function byCourse<T>(files: Record<string, unknown>, id: string): T[] {
  return Object.entries(files)
    .filter(([path]) => courseOf(path) === id)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, v]) => v as T);
}

/** Every course that has a placement test and tags, which every course needs. */
export const COURSE_IDS: string[] = [...new Set(Object.keys(placementFiles).map(courseOf))]
  .filter((id) => COURSE_ID_PATTERN.test(id) && byCourse(tagFiles, id).length === 1)
  .sort();

export interface CourseContent {
  id: string;
  /** Language taught, from the id. */
  target: string;
  /** The learner's language, from the id. */
  learner: string;
  tags: TagInfo[];
  placement: PlacementQuestion[];
  lessons: Lesson[];
  writingTasks: WritingTask[];
  phrases: Phrase[];
  stories: Story[];
  sayPrompts: SayPrompt[];
  /** Every plan file, in order, including ones not available yet. */
  allPlans: Plan[];
  /** Speech clips for this course. Empty when the course has no audio: the app then shows no audio controls. */
  audio: AudioManifest;
}

const levelIndex = (l: Level) => LEVELS.indexOf(l);

function buildCourse(id: string): CourseContent {
  const [target = '', learner = ''] = id.split('-from-');
  const first = <T>(files: Record<string, unknown>, key: string): T[] => {
    const data = byCourse<Record<string, T[]>>(files, id)[0];
    return data ? (data[key] ?? []) : [];
  };
  const lessons = byCourse<Lesson>(lessonFiles, id).sort((a, b) => {
    if (a.track !== b.track) return a.track === 'general' ? -1 : 1;
    return levelIndex(a.level) - levelIndex(b.level) || a.order - b.order;
  });
  const writingTasks = byCourse<WritingTask[]>(writingFiles, id)
    .flat()
    .sort((a, b) => (a.track !== b.track ? (a.track === 'general' ? -1 : 1) : levelIndex(a.level) - levelIndex(b.level) || a.id.localeCompare(b.id)));
  return {
    id,
    target,
    learner,
    tags: byCourse<TagInfo[]>(tagFiles, id)[0] ?? [],
    placement: first<PlacementQuestion>(placementFiles, 'questions'),
    lessons,
    writingTasks,
    phrases: first<Phrase>(phraseFiles, 'phrases'),
    stories: first<Story>(storyFiles, 'stories'),
    sayPrompts: first<SayPrompt>(sayFiles, 'prompts'),
    allPlans: byCourse<Plan>(planFiles, id).sort((a, b) => a.order - b.order),
    audio: cleanManifest(byCourse<unknown>(audioFiles, id)[0]),
  };
}

const courseCache = new Map<string, CourseContent>();

/** The content of one course, or undefined for an unknown course id. */
export function loadCourse(id: string): CourseContent | undefined {
  if (!COURSE_IDS.includes(id)) return undefined;
  let c = courseCache.get(id);
  if (!c) {
    c = buildCourse(id);
    courseCache.set(id, c);
  }
  return c;
}

/** A plan in a given course (used when checking stored progress for that course). */
export const getPlanIn = (courseId: string, planId: string) => loadCourse(courseId)?.allPlans.find((p) => p.id === planId);

const COURSE = loadCourse(DEFAULT_COURSE_ID) as CourseContent;

export const TAGS: TagInfo[] = COURSE.tags;
export const PLACEMENT: PlacementQuestion[] = COURSE.placement;

export const LESSONS: Lesson[] = COURSE.lessons;
export const WRITING_TASKS: WritingTask[] = COURSE.writingTasks;

const lessonById = new Map(LESSONS.map((l) => [l.id, l]));
const taskById = new Map(WRITING_TASKS.map((w) => [w.id, w]));
const exerciseById = new Map<string, { exercise: Exercise; lesson: Lesson }>();
for (const lesson of LESSONS) for (const exercise of lesson.exercises) exerciseById.set(exercise.id, { exercise, lesson });

export const getLesson = (id: string) => lessonById.get(id);
export const getTask = (id: string) => taskById.get(id);
export const getExercise = (id: string) => exerciseById.get(id);
export const getTag = (id: TagId) => TAGS.find((t) => t.id === id);

export function lessonsForTrack(track: TrackId): Lesson[] {
  return LESSONS.filter((l) => l.track === track);
}

/**
 * The order of daily lessons for a track choice and placement result.
 * General lessons start at the placement start level; Engineers lessons always start at the first one.
 * "Both" alternates general and engineers lessons.
 */
export function lessonPath(track: TrackChoice, result: PlacementResult | null): Lesson[] {
  const from = levelIndex(startLevel(result ?? 'START_A1'));
  const general = lessonsForTrack('general').filter((l) => levelIndex(l.level) >= from);
  const eng = lessonsForTrack('engineers');
  if (track === 'general') return general;
  if (track === 'engineers') return eng;
  const out: Lesson[] = [];
  for (let i = 0; i < Math.max(general.length, eng.length); i++) {
    if (general[i]) out.push(general[i] as Lesson);
    if (eng[i]) out.push(eng[i] as Lesson);
  }
  return out;
}

/** The next lesson that is not completed, or null if all are done. */
export function nextLesson(track: TrackChoice, result: PlacementResult | null, completed: readonly string[]): Lesson | null {
  return lessonPath(track, result).find((l) => !completed.includes(l.id)) ?? null;
}

export function exercisesWithTag(tag: TagId): { exercise: Exercise; lesson: Lesson }[] {
  return [...exerciseById.values()].filter(({ exercise }) => exercise.tags.includes(tag));
}

export const PHRASES: Phrase[] = COURSE.phrases;
export const STORIES: Story[] = COURSE.stories;
export const SAY_PROMPTS: SayPrompt[] = COURSE.sayPrompts;

/** Every plan file, in order. The picker shows only the available ones. */
export const ALL_PLANS: Plan[] = COURSE.allPlans;
export const PLANS: Plan[] = ALL_PLANS.filter((p) => p.available);

const phraseById = new Map(PHRASES.map((p) => [p.id, p]));
const storyById = new Map(STORIES.map((s) => [s.id, s]));
const sayById = new Map(SAY_PROMPTS.map((s) => [s.id, s]));
const planById = new Map(ALL_PLANS.map((p) => [p.id, p]));

export const getPhrase = (id: string) => phraseById.get(id);
export const getStory = (id: string) => storyById.get(id);
export const getSayPrompt = (id: string) => sayById.get(id);
export const getPlan = (id: string) => planById.get(id);

/** A review card is either a lesson exercise or a work phrase. */
export function reviewItemExists(id: string): boolean {
  return getExercise(id) !== undefined || getPhrase(id) !== undefined;
}

/** The default course's speech clips (empty today). */
export const AUDIO: AudioManifest = COURSE.audio;
