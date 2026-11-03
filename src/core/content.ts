// Loads course content. The course path is content/<target>-from-<learner>/.
import type { Exercise, Lesson, Phrase, PlacementQuestion, Plan, SayPrompt, Story, TagInfo, WritingTask } from './contentTypes';
import { LEVELS, type Level, type PlacementResult, type TagId, type TrackChoice, type TrackId } from './types';
import { startLevel } from './placement';
import placementData from '../../content/en-from-ar/placement.json';
import tagData from '../../content/en-from-ar/tags.json';
import phraseData from '../../content/en-from-ar/phrases.json';
import storyData from '../../content/en-from-ar/stories.json';
import sayData from '../../content/en-from-ar/say-aloud.json';

const lessonFiles = import.meta.glob('../../content/en-from-ar/lessons/*.json', { eager: true, import: 'default' });
const writingFiles = import.meta.glob('../../content/en-from-ar/writing/*.json', { eager: true, import: 'default' });
const planFiles = import.meta.glob('../../content/en-from-ar/plans/*.json', { eager: true, import: 'default' });

const levelIndex = (l: Level) => LEVELS.indexOf(l);

export const TAGS: TagInfo[] = tagData as TagInfo[];
export const PLACEMENT: PlacementQuestion[] = (placementData as { questions: PlacementQuestion[] }).questions;

export const LESSONS: Lesson[] = (Object.values(lessonFiles) as Lesson[]).slice().sort((a, b) => {
  if (a.track !== b.track) return a.track === 'general' ? -1 : 1;
  return levelIndex(a.level) - levelIndex(b.level) || a.order - b.order;
});

export const WRITING_TASKS: WritingTask[] = (Object.values(writingFiles) as WritingTask[][])
  .flat()
  .sort((a, b) => (a.track !== b.track ? (a.track === 'general' ? -1 : 1) : levelIndex(a.level) - levelIndex(b.level) || a.id.localeCompare(b.id)));

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

export const PHRASES: Phrase[] = (phraseData as { phrases: Phrase[] }).phrases;
export const STORIES: Story[] = (storyData as { stories: Story[] }).stories;
export const SAY_PROMPTS: SayPrompt[] = (sayData as { prompts: SayPrompt[] }).prompts;

/** Every plan file, in order. The picker shows only the available ones. */
export const ALL_PLANS: Plan[] = (Object.values(planFiles) as Plan[]).slice().sort((a, b) => a.order - b.order);
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
