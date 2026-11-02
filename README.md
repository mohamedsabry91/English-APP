# English Practice (first version)

A free, installable web app (PWA) for Arabic-speaking adults who are learning English, with an
"English for Engineers" track. It works offline after the first load. All progress stays in the
browser on the device. There is no server, no account, no AI and no audio.

## Privacy

Nothing is sent anywhere. Progress is kept in the browser's `localStorage` on the device. While a
learner writes, the unfinished text is kept there too, so they can come back to it. It is deleted when
the task is finished or skipped, when another task is started, or when all progress is deleted. It is
never included in an exported progress file. After a task is finished, only mistake types, counts and
dates are kept.

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
content/en-from-ar/   placement, lessons, writing tasks, mistake tags
tests/unit/     Vitest tests (logic, checker fixtures, content rules, repo scan)
tests/e2e/      Playwright browser tests
docs/           content review file and screenshots
```
