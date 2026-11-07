# English Practice (first version)

A free, installable web app (PWA) for Arabic-speaking adults who are learning English, with an
"English for Engineers" track. It works offline after the first load. All progress stays in the
browser on the device. There is no server, no account and no AI. The app has no audio yet; the rules for adding speech
clips later are in [docs/AUDIO.md](docs/AUDIO.md).

## Plans

The app has a data-driven plan picker. Plans are JSON files in `content/en-from-ar/plans/`; only
files with `"available": true` are shown. The first plan is **15-Day Start**: work phrases first,
15 minutes a day, 48 phrases on 12 learning days, with review days 6, 11 and 15. It is a small start
(about 4 hours in total, below A1), not a fluency course. Plan progress stays on the device and is
included in exported progress files.

## Privacy

Nothing is sent anywhere. Progress is kept in the browser's `localStorage` on the device. While a
learner writes, the unfinished text is kept there too, so they can come back to it. It is deleted when
the task is finished or skipped, or when all progress is deleted, and it is replaced when the learner
starts writing another task. It is
never included in an exported progress file. After a task is finished, only mistake types, counts and
dates are kept.

Progress is stored per course (record version 3): the interface language and other shared settings
once, and each course's progress under `courses["<course id>"]`. Older records (version 1 and 2) and
older export files are moved into the English course `en-from-ar` when they are loaded, with nothing
lost. Content is loaded by course id (`loadCourse` in `src/core/content.ts`).

The app name is not final. Change `APP_NAME` in `src/app/config.ts` (and the `name` fields in
`vite.config.ts` and `index.html`).

**All content was written with the help of AI and has not been reviewed by a person yet.**
See `docs/CONTENT_REVIEW.md`.

## Requirements

- Node.js 22 or newer, and npm

## Install

```bash
npm ci
```

## Run in development

```bash
npm run dev
```

## Test

```bash
npm run lint
npm run typecheck
npm test            # unit and content tests (Vitest)
npm run test:e2e    # browser tests (Playwright, Chromium and WebKit)
```

The browser tests build the app and start `vite preview` on port 4173. If WebKit is not installed
on your machine, run only Chromium with `E2E_WEBKIT=0 npm run test:e2e`.

### Continuous tests

`.github/workflows/ci.yml` runs lint, typecheck, unit tests and the build on Ubuntu and Windows, and
the browser tests on Chromium and WebKit, for every push to `main` and every pull
request. It only runs tests. It does not deploy or publish anything.

### Hosting

`.github/workflows/pages.yml` builds the app and publishes `dist/` to GitHub Pages on every push to
`main` (and when run by hand). The app is served under the `/English-APP/` subpath, over HTTPS.
`tests/e2e/subpath.spec.ts` checks that the build works there: the files, the manifest, the service
worker scope and an offline reload. The app still sends nothing to any server: progress stays on the
device.

## Build and preview

```bash
npm run build
npm run preview
```

Then open http://localhost:4173/. The output in `dist/` uses relative paths, so it can be hosted in
any folder. The app must be served over HTTPS to be installed on a phone.

## Layout

```
src/app/        screens and navigation (React)
src/core/       scheduler, placement scoring, storage (no React)
src/checker/    rule-based writing checker
src/i18n/       ar.json, en.json (all interface text)
content/<course>/     one folder per course, named <language taught>-from-<learner's language>;
                      today only content/en-from-ar/ (placement, lessons, writing tasks, tags, plans)
tests/unit/     Vitest tests (logic, checker fixtures, content rules, repo scan)
tests/e2e/      Playwright browser tests
docs/           content review file and screenshots
```
