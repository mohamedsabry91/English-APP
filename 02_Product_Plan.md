# 02. Product Plan

**Background only.** This describes the wider product idea, including AI features that are not in the first version. `BRIEF.md` defines the first version and wins wherever they differ.

## First user

The first user is an adult Arabic speaker with a job who:

- has a level between A2 and B2;
- needs English for work: emails, reports, meetings, interviews;
- has studied English before, but keeps making the same mistakes;
- has about 10 minutes a day.

Adults only. Every user must confirm they are 18 or older.

## The single main promise

> **Stop repeating the same English mistakes, in 10 minutes a day, explained in Arabic.**

Limit line: *"The only limit is your imagination", without exceeding the limits of Islam.*

## Testing the first angle honestly

**First angle:** English for Arabic speakers, adults first, kids later, in clean family-safe content with no music.

| Part of the angle | Honest view |
|---|---|
| **For Arabic speakers** | **Weak alone.** Duolingo, Busuu and Praktika list Arabic. anaFluent and SpeakShark claim to be built for Arabic speakers. |
| **Clean, no music, for adults** | **Weak as a headline.** I found no evidence that adults choose or switch apps for this. It is also easy for others to copy. But it is a real promise, and it builds trust. |
| **Clean, no music, for kids** | **The strongest part.** Muslim parents may care most, and I found no structured music-free English course. But demand is still unproven, and kids are the group we must keep out for now because of legal and safety risk. |
| **Adults first, then kids** | **There is a problem here.** The best advantage only arrives when you add kids, and that is the most expensive and risky step. Adults and kids also need different products, so an adult app does not simply grow into a kids' app. |

**Conclusion: this angle is too weak to be the main reason someone uses the app. Keep it as a rule, not as the headline.**

## A better angle

> **The English partner that remembers your mistakes.**
> It knows the mistakes Arabic speakers make, explains them in Arabic, and shows your own mistakes going down.

Why this is better:

- **It solves a clear pain.** People are tired of repeating mistakes.
- **It can be measured.** "You missed 'is/are' 14 times last month and 3 times this month."
- **A plain chatbot does not do this by default.** Your personal list and daily review are what the chatbot lacks.

**Clean content stays a fixed rule of the product.** It is written on the first screen, but it is not the main selling point.

**Honest warning:** this advantage can also be copied. A big app or a chatbot with memory could do it. This plan aims to build something useful for a small group. It does not aim to beat Duolingo.

## MVP scope

### 1. Level test (10 to 15 minutes)

- About 25 multiple-choice questions, plus one short writing task.
- Result: A1, A2, B1, B2 or C1, shown as **"an estimate, not a certificate."**
- We check it by comparing tester results with a well-known free online test. Until then we do not know how accurate it is.
- We write our own questions. Do not copy Cambridge or Oxford material.

### 2. Daily lesson (about 10 minutes)

1. **Your mistakes (2 minutes):** review your own past mistakes.
2. **One small point (5 minutes):** one rule, an Arabic-and-English comparison, and a few exercises.
3. **Use it (3 minutes):** write a short real message to the partner.

**Content size:** start with 10 lessons and grow to 30, for levels A2 to B2 only.

- **A1 learners** need much more Arabic support, so the app tells them honestly it may be hard at first.
- **C1 learners** get the test and the partner, but no lessons.

### 3. AI writing and speaking partner

Writing comes first. Speaking comes only if writing passes the tester stage.

| Mistake type | Example | How the app handles it |
|---|---|---|
| a / an / the | "I am engineer" | Writing and speech: correct, tag and explain in Arabic |
| Verb "to be" | "He doctor" | Writing and speech: correct, tag and explain in Arabic |
| Word order | "I yesterday went" | Writing and speech: correct, tag and explain in Arabic |
| Spelling | "problm" | **Writing only** |
| p / b sounds | "bark" for "park" | **Read-aloud only**, not free conversation (see below) |

**Important limit for speaking.** Normal speech-to-text often guesses the most likely word. It may write "park" even when you said "bark", and it may also fix some grammar. So free conversation cannot reliably catch p/b mistakes. We use a short read-aloud exercise for that, with a phoneme-level tool. Whether this tool works well on Arabic accents is **not proven**, so we test it first.

### 4. My Mistakes page

This is the heart of the product:

- your top mistakes;
- count per week;
- a simple line showing them going up or down;
- a button to practise any mistake now.

### 5. Clean content rules

These rules apply to everything in the app:

- **No music.** No jingles and no background sounds.
- **No images of people or animals.** Text and simple icons only.
- **Dialogues stay on safe topics:** work, study, travel, health, shopping, daily family life.
- **The AI partner refuses** romance, dating, alcohol, gambling and other unsuitable topics, and steers back politely.
- **The AI gives no religious rulings.** It suggests asking a person of knowledge.
- **The AI always says it is an AI,** with no romantic or friend-like persona.
- **A report button** on every AI reply.
- **A person reads all lessons** before learners rely on them.

**Do not claim "halal certified" or similar.** No scholar has reviewed it. AI replies also cannot be 100% guaranteed safe, so the first screen should say that.

## NOT in the MVP

- Kids or teen accounts (see below)
- Payments, subscriptions, ads, or any income feature
- Public store release or marketing
- Native Android or iOS apps
- Chinese, Urdu and Russian courses
- Certificates
- Streaks, leaderboards, friends, chat between users
- Live voice conversation with instant replies
- Video, avatars, or generated images
- Lessons for A1 and C1
- Offline mode

## Kids: later, and only if these are all true

1. The adult app has passed its tests.
2. Children's data rules in each target country have been checked by a qualified person.
3. Parents create and control the account, with clear consent.
4. The first kids' version has **no free AI chat**, only fixed reviewed lessons.
5. If AI is ever added for children, we meet [Anthropic's rules for products serving minors](https://support.claude.com/en/articles/9307344-responsible-use-of-anthropic-s-models-guidelines-for-organizations-serving-minors).

## Web app, Android or iOS?

**Recommendation: start with a web app (PWA). Android comes later, and iOS last.**

| Option | Cost | Time and rules | View |
|---|---|---|---|
| **Web app (PWA)** | $0 to start. Domain optional. | One codebase. Works on Android, iPhone and computer through a link. Testers add it to the home screen. | **Do this first** |
| **Android store** | [$25 once](https://support.google.com/googleplay/android-developer/answer/6112435?hl=en) | New personal accounts need [12 testers for 14 days in a closed test](https://support.google.com/googleplay/android-developer/answer/14151465). | **Later** |
| **iPhone store** | About $99/year (from memory, [Apple's page](https://developer.apple.com/programs/how-it-works/) did not show the amount) | App review, plus a Mac is usually needed. | **Last** |

Honest downsides of a PWA:

- People cannot find it in a store. This is fine for now, because we do not want public users yet.
- [The microphone needs HTTPS](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia), and iPhone Safari has had [microphone bugs, including one in 2026 that is now marked fixed](https://bugs.webkit.org/show_bug.cgi?id=319706). We must test on real iPhones before speaking starts.
- Reminder notifications on iPhone are limited (not fully checked). This is acceptable during early tests.

## Designing so later languages are not blocked

Only small choices, no extra work now:

- Keep all interface text in language files, with right-to-left support.
- Store a course's `target_language` and `learner_language` with each lesson.
- Keep mistake types in data, not in code, so Urdu speakers can have their own list later.

## Free, with no income features

The app is free. No payments, ads, subscriptions or donations are planned or built.

## What success looks like

The realistic good result: **a tool that really improves English for a small group of learners.**
