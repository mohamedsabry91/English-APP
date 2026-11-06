# BRIEF: Build the first version of the English app

You are a cloud build session. Build everything below in this repository. `02_Product_Plan.md` and `03_Technical_Plan.md` are background and describe a possible later version with AI and a server: where they disagree with this brief, this brief wins.

**This repository is public.** Anyone can read the code, commits and PR. Never put secrets, personal details, or notes about any person in them. Keep commits and the PR about the product only.

## 1. Working rules

**Deadline:** the build credit expires on **4 Nov 2026 at 06:59 UTC**. Commit and push after each step in section 11, so that work is never lost. Open a draft PR after step 1.

**Git**
- Work on branch `feat/first-version`, created from `main`.
- Open **one** PR into `main`. **Do not merge it.** Do not push to `main`.
- Author: `mohamedsabry91 <mohamedsabry91@users.noreply.github.com>`.
- End each commit message with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- End the PR description with: `🤖 Generated with [Claude Code](https://claude.com/claude-code)`

**Never do these**
- Do not deploy or publish the app anywhere: no GitHub Pages, no Cloudflare, no Vercel, no app stores, no preview links.
- Do not change the repo's visibility or settings. Do not add GitHub Actions that deploy.
- Do not create accounts, buy anything, or enter secrets.
- Do not add a server, database, sign-in, analytics, ads, payments, donations, or any income feature, not even a placeholder.
- Do not call any paid AI or speech API, or any other network service, at runtime.

**If blocked:** make the smallest safe choice, write it under "Assumptions" in the PR, and continue. If time or credit runs short, follow the cut order in section 11. Be honest in the PR about anything not done or not tested.

## 2. The product

A free, installable web app (PWA) for **Arabic-speaking adults learning English**. It works on a phone and offline after the first load. All progress stays in the browser on that device.

**First user:** a working engineer at about B1 level, learning English for their job.

**Promise on the home screen:** "Stop repeating the same English mistakes, in 10 minutes a day, explained in Arabic."

**App name:** none has been chosen. Keep a single constant, `APP_NAME = "English Practice"`, so that it is easy to change.

**Slogan, on the About screen only, with this exact meaning and in both languages:**
"The only limit is your imagination", without exceeding the limits of Islam.

**In this version**
1. Placement test (A1 to B2) with a clear result
2. A 10-minute daily lesson
3. Spaced review of the learner's mistakes
4. "My Mistakes" page
5. Writing practice with rule-based checks and model answers
6. Track: "General English" and "English for Engineers"
7. Arabic and English interface, with correct RTL at 375 px

**Not in this version:** kids' content or kids' mode, other course languages, AI, speech recording, certificates, accounts, sync, leaderboards, streak pressure, push notifications.

## 3. Stack

- TypeScript in strict mode, React, Vite, `vite-plugin-pwa`
- Vitest for unit tests. Playwright with `@axe-core/playwright` for browser tests.
- Plain CSS with variables. No CSS framework is needed.
- Output is static files in `dist/`, using relative paths, so it can be hosted in any folder later.
- Use only dependencies with permissive licences (MIT, Apache-2.0, BSD, ISC). Keep them few.
- **Fonts:** system fonts only. No web font downloads.
- No licence has been chosen, so do not add one. Add a `README.md` with how to install, test and preview.

Suggested layout:

```
src/
  app/          screens and navigation
  core/         scheduler, placement scoring, storage (no React here)
  checker/      writing rules
  i18n/         ar.json, en.json
content/en-from-ar/
  placement.json  lessons/*.json  writing/*.json  tags.json
tests/
  fixtures/writing-checker.json
docs/CONTENT_REVIEW.md
```

Keep the course path as `content/<target>-from-<learner>/`, and put all interface text in `i18n/`. This is the only preparation for later languages. Do not build more than this.

## 4. Screens and flow

1. **First open:** choose language (Arabic is the default). One short screen says: for adults 18 and over; a private practice tool; progress stays on this device; this is not a certificate.
2. **Placement test**, then the result screen.
3. **Today** (home): what to do today, shown as one clear "Start" button.
4. **Daily session**, in this order:
   - Review: up to 5 due items, about 2 minutes
   - One lesson point: a rule and an Arabic-and-English comparison, about 3 minutes
   - 6 to 8 exercises, about 3 minutes
   - One short writing task, about 2 minutes
   
   If the learner leaves, they resume where they stopped.
5. **My Mistakes:** the top mistake types, a count per week for the last 8 weeks, and a "Practise this" button for each type. A simple line or bar chart is enough. Show no fake improvement: if there is too little data, say so.
6. **Writing:** free practice from the task list, separate from the daily session.
7. **Settings:** language, track (General, Engineers, or both), retake placement, export progress, import progress, delete all progress (with confirmation), About.

No login. No personal details are asked for at any point.

## 5. Placement test

- 32 multiple-choice questions: **8 per level** (A1, A2, B1, B2). Fixed order, easier to harder.
- Stop early when a level is clearly failed, as defined below. Show progress. It should take 10 minutes or less.
- **Scoring (pure function, unit tested):** a level is passed with 6 or more correct out of 8. The result is the **highest level passed with every lower level also passed**. If A1 is not passed, the result is "Starting A1".
- **Early stop:** after a level with 4 or fewer correct out of 8.
- **Result screen, in the chosen language:** level; a simple "you can..." description; the mistake types seen in the wrong answers; the lesson starting point; and this statement: "This is an estimate, not a certificate, and it has not been validated against an official test."
- Learners can retake the test. Retaking changes the start point but does not delete mistakes.
- Each wrong answer that has a tag is added to the mistake record. It does not count towards "weekly mistakes" charts as lesson practice, unless the design clearly labels it.

## 6. Lessons

**Minimum content:**
- General English: **24 lessons**, 6 each at A1, A2, B1, B2
- English for Engineers: **8 lessons** at about B1 to B2: writing a work email, a short site report, describing a problem and its cause, units and numbers, asking for and giving a clear update, reading a simple technical specification, meeting phrases, a job interview answer. Use civil and water engineering examples where they fit.

Each lesson JSON file has: `id`, `track`, `level`, `titleEn`, `titleAr`, `tags`, `explanationAr`, `explanationEn`, a comparison of Arabic and English where useful, 2 or more example sentences, **6 to 8 exercises**, one writing task id, and `reviewed: false`.

**Exercise types only:** multiple choice, fill-in-the-blank (typed, with a list of accepted answers), reorder the words, find and fix the mistake. Each exercise has an Arabic explanation of the right answer and one or more mistake tags.

**Mistake tags** (kept as data in `tags.json`, with Arabic and English names):
`ARTICLE` (a/an/the), `BE` (missing am/is/are), `ORDER` (word order), `SPELLING`, `PB` (p and b), `SVA` (he goes), `PREPOSITION`, `TENSE`, `PRONOUN` ("my brother he..."), `UNCOUNTABLE` (informations).

**Coverage:** across the General track, each of the first five tags must appear in at least 3 lessons.

**p and b:** the first version has no audio, so teach this in writing: spelling pairs (park/bark, pen/Ben, pill/bill), meaning in context, and a short Arabic tip on how to make the sound. Do not claim that the app can hear or check pronunciation.

**Lesson order:** use the placement result as the start point, in order after that. Learners can open any lesson from a simple list.

## 7. Spaced review

Pure, unit-tested code. Pass the current date in as a parameter. Do not read the clock inside the logic.

- Each wrong exercise, and each mistake from the writing check that links to an exercise, creates or updates a review card.
- Boxes with these gaps: **1, 3, 7, 14, 30 days**.
- Right answer: move up one box. Wrong answer: return to box 1 and add 1 to the mistake count. A card is "learned" after a right answer in the last box.
- Daily review shows at most 5 due cards, with the oldest first. A long absence must not produce a huge pile or guilt messages.
- Use the learner's local date. Handle the same-day case: a card answered today is not shown again today.

## 8. Writing practice and the rule-based checker

**Tasks:** at least **24 tasks**, spread across levels and both tracks. Each has a prompt in English and Arabic, a word limit (100 words or fewer), a **model answer**, and a self-check list of 3 or 4 points in Arabic.

**Checker:** a pure TypeScript function `check(text, level): Finding[]`, where each finding has the start and end position, tag, explanation in Arabic and English, and a suggestion if one is safe. No AI. No network.

**Rules should be precise, not clever.** Flag only when confidence is high. It is better to miss a mistake than to wrongly correct a good sentence. Include at least:

| Tag | Examples to catch |
|---|---|
| `ARTICLE` | "I am engineer", "She is teacher", "a engineer", "an report" |
| `BE` | "He engineer", "She tired", "They in the office" |
| `ORDER` | "I yesterday went", "I very much like it" |
| `SPELLING` | A list of common misspellings. Do not flag unknown words. |
| `SVA` | "He go", "She have", "The report show" |
| `PRONOUN` | "My brother he works" |
| `UNCOUNTABLE` | "informations", "advices", "equipments" |
| `PREPOSITION` | "discuss about", "explain me", "since 3 years" |
| Basics | Lowercase "i", no capital at the start, no final punctuation |

Careful with `a` and `an`: go by sound, so "a university", "an hour", "an MSc".

**Result screen:** show the learner's text with marked findings, explanations, the model answer and the self-check list. Always show this sentence in the chosen language: **"This automatic check finds some common mistakes only. A sentence with no marks may still have mistakes."** Never display a score out of 100, and never say "perfect" or "no mistakes".

Findings add to My Mistakes. Store only tags, counts and dates by default, not the learner's writing. Keep the current draft only until the task is finished.

**Do not add any AI text generation** in the app, even a local one.

## 9. Content rules

**Original and accurate**
- Write all content yourself. Do not copy or closely paraphrase any course, textbook, test or website.
- Do not use Oxford 3000/5000, Cambridge, English Profile or other licensed word lists as a source. CEFR labels here are your judgement, and the app must not claim otherwise.
- Check all English for correct grammar and natural use, and all Arabic for correct, simple Modern Standard Arabic. Do a second full pass on all content after writing it.
- Use one English variety (American) throughout.
- The rule explanations must be true. If a statement about Arabic grammar is a simplification, make sure it is still correct.

**Inside Islamic limits, with no exceptions**
- **No music, ever:** no music, jingles, tones or sound effects.
- **Speech audio only, under the audio rules** (updated after PR 2, see `docs/AUDIO.md`): Opus clips under `public/audio/<course>/`, each listed in `AUDIO_CREDITS.json`. Sources: our own recordings with the speaker's consent, or openly licensed clips that allow commercial use (non-commercial licences count as no). English may also use pre-generated Kokoro clips (Apache-2.0), labelled synthetic, only after a teacher's check. Chinese and Urdu: own teacher recordings only, no AI voice. No `speechSynthesis`, no speech recognition, and no microphone.
- **No images of people or animals.** Use only text and simple, abstract inline SVG icons (book, pencil, check). No mascots, avatars, or characters with faces.
- **Topics:** work, study, engineering, travel, health, food (halal, ordinary meals), weather, shopping, home, daily family life, and good character.
- **Exclude:** romance and dating, sexual content, revealing descriptions, alcohol, pork, drugs, gambling and lotteries, interest-based loans, magic, nightclubs, music and concerts, festivals of other religions, insults to any faith or group, and politics.
- **Examples between people:** keep them respectful. Avoid private scenes between an unrelated man and woman. Work dialogues should be formal and focused on the task.
- **No religious content claims:** no Quran verses, no hadith, no rulings, and no "halal certified" or similar claim. Don't use sacred text as language exercises.
- **Names:** use ordinary, respectful names. No real public figures, real companies, or real personal details.

**Honesty:** no fake testimonials, user numbers, or promises such as "fluent in 30 days".

## 10. Technical requirements

**Layout and language**
- Correct at **375 px** wide, with no horizontal page scroll, in both Arabic (RTL) and English (LTR). Should also look fine at 320 px and on a desktop.
- Set `dir` and `lang` on `<html>`, and use logical CSS (`margin-inline-start`). Mark English inside Arabic text with `<bdi>` or `dir="ltr"` so that word order and punctuation display correctly. Reorder exercises and English sentences stay LTR even in the Arabic interface.
- Tap targets 44 px or larger. Readable Arabic: at least 16 px with generous line height.
- Accessible: real buttons and labels, visible keyboard focus, and enough contrast.

**Storage**
- `localStorage` with a single versioned record and a migration function. Wrap all reads and writes in try/catch. If storage is unavailable or full, the app still runs and shows a clear message.
- Call `navigator.storage.persist()` where available.
- **Export** progress to a JSON file, and **import** it with validation. Show a gentle reminder to export, because browsers can clear site data and iPhones may do so.
- **Delete all progress** removes everything.

**Offline and privacy**
- Works offline after the first load, including on reload. Provide a web manifest and icons (abstract design only).
- Set a strict Content Security Policy in `index.html`: `connect-src 'self'`, with no external scripts, styles, fonts or images.
- The app makes no requests to other hosts.
- Add a short privacy text in the app: nothing leaves the device, and there is no tracking.

**Do not include** any person's name or contact details anywhere in the app.

## 11. Build order

Push after each step.

1. Project setup, tests running, storage layer, i18n, RTL shell. **Open the draft PR.**
2. Scheduler and placement scoring with tests
3. Placement test with content
4. Daily session and exercise types, with a first 8 lessons
5. Review and My Mistakes
6. Writing checker with fixtures, tasks screen, first 12 tasks
7. Settings, export, import, delete, About, PWA and offline
8. The rest of the lessons and writing tasks
9. Full content review pass, and `docs/CONTENT_REVIEW.md`
10. Browser tests, accessibility, screenshots, and final PR description

**If short of time, cut in this order:** first the extra chart detail, then import (keep export), then Engineers lessons beyond 4, then General lessons beyond 16, and then writing tasks beyond 12. **Never cut:** content rules, RTL quality, delete progress, the checker's honesty message, or the tests in section 12. Say clearly in the PR what was cut.

## 12. Tests and acceptance checks

The PR is ready only when all of these pass, or a failure is stated plainly.

**Unit tests (Vitest)**
- Placement scoring: all boundaries, early stop, "Starting A1".
- Scheduler: each box, wrong answer reset, same-day, long absence, 5-card limit, "learned".
- Storage: version migration, corrupt data, storage unavailable, export and import round trip, delete all.
- **Checker fixture file** with at least **120 hand-written sentences**: at least 70 with a known mistake and tag, and at least 50 correct sentences, including tricky ones ("a university", "an hour", "He is an engineer", "They are in the office", "The bars on the chart show flow"). Results needed:
  - At least **80%** of the listed mistakes caught with the right tag
  - **Zero** findings on the correct sentences, except the basic punctuation or capital rules if the fixture says so
- Do not edit a fixture just to make a test pass, unless the fixture itself is wrong. Say so in the PR if you do.

**Content tests, which run over all JSON files**
- Schema valid, with unique ids, and every tag exists.
- Counts meet section 6 and section 8 (or the reduced number stated in the PR).
- Every exercise has an accepted answer and an Arabic explanation. In multiple choice, exactly one option is right and options are not duplicated.
- All Arabic fields contain Arabic letters. All English fields contain no Arabic.
- **Banned-word scan** using word boundaries across all content and interface text: for example music, song, sing, dance, concert, wine, beer, alcohol, pork, bacon, ham, casino, lottery, gamble, bet, girlfriend, boyfriend, date (when it means romance), kiss, sexy, and Arabic equivalents. Keep a short, explained allow-list for real engineering uses.
- **Repo scan:** no audio files except Opus clips under `public/audio/<course>/`, within the size limits and listed in `AUDIO_CREDITS.json`; an audio element only in `src/audio/player.ts`; no `AudioContext`, `speechSynthesis`, speech recognition or `getUserMedia` in source; `media-src 'self'` in the CSP; no images of people or animals in assets; no `fetch` to external URLs.

**Browser tests (Playwright, phone size 375 x 812, on Chromium and WebKit)**
- Full path in Arabic: first open, placement, result, daily session, a wrong answer, then the card is due on a later date (with a fake clock), My Mistakes updates.
- Same short path in English.
- Writing: type a sentence with a known mistake, see the mark, the model answer and the honesty sentence.
- No horizontal overflow on every main screen, in both languages (`scrollWidth <= clientWidth`).
- `<html dir>` is right in both languages.
- Reload keeps progress. Delete all clears it. Export and then import restores it.
- Offline: after the first load, go offline and reload; the app still works.
- **No requests to other hosts** during the full path.
- **axe:** no serious or critical issues on the main screens.
- Save 375 px screenshots of main screens in both languages to `docs/screenshots/`.

**Commands that must succeed:** `npm ci`, `npm run lint`, `npm run typecheck`, `npm test`, `npm run test:e2e`, `npm run build`.

**Install on a real phone cannot be tested in the cloud.** Say so in the PR, and do not claim it was tested.

## 13. Content review file

Create `docs/CONTENT_REVIEW.md` for humans:

- A statement that all content was written by AI and that **no human has reviewed it yet**. Every item keeps `reviewed: false`.
- The content rules in a short checklist.
- A simple table of every lesson, with empty columns for "Owner read" and "English teacher checked".
- The sentences or explanations you are least sure about, listed first.
- Which CEFR labels are most uncertain.

## 14. PR description

Use plain English at about B1 level. Include:

1. What was built
2. Test results, pasted honestly, with pass and fail counts
3. Content counts, against the targets
4. Anything cut, not tested, or known to be wrong
5. Assumptions
6. How to run it on a computer: `npm ci`, `npm run build`, `npm run preview`
7. What the owner must decide next: hosting (the app needs an HTTPS address to install on a phone), and the app name
8. A clear statement: **the app has not been deployed, and it should not be deployed until a person has reviewed the content and the owner has decided.**

Then stop. Do not merge.
