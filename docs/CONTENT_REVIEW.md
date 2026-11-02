# Content review

## Status: written by AI, not reviewed by a person

All content in this app was written by an AI (Claude) during the first build. **No human has reviewed
it yet.** This includes the placement test, all lessons and exercises, all writing tasks and model
answers, the writing checker's explanations, and the Arabic and English interface text.

Every lesson, writing task and the placement file keep `"reviewed": false`. Please change a flag to
`true` only after a person has read that item.

The app should not be deployed until a person has reviewed this content and the owner has decided.

## Read these first: the items I am least sure about

These are listed first because they are the most likely to be wrong, unclear or arguable.

1. **"I very much like this job" (checker rule and fixture).** The brief lists this as a word-order
   mistake. In fact, "I very much like..." is grammatical, formal English. The checker marks it, but
   its explanation only says that "I like it very much" is the more usual order. A teacher should
   decide whether to keep this rule. (`src/checker/index.ts`, rule `very-much`;
   `tests/fixtures/writing-checker.json`.)
2. **Statements about Arabic grammar.** These are simplified on purpose. Please check that each is
   still true:
   - g-a1-02: "the tanween in «سيارةٌ» shows an indefinite noun, and English *often* uses a/an for it".
   - g-a2-03: "in spoken Arabic we may say «أخي هو يشتغل»" and "in MSA we say «المهندس الذي قابلتُه»
     with the pronoun".
   - g-b1-01: "«منذ» covers both a length of time and a starting point".
   - g-b1-06: "Arabic needs no helping verb in «بُني الجسر»".
   - g-a2-04: "Arabic can ask a yes/no question with «هل» or with the voice only".
   - g-b2-06: "Arabic may use «مع أنه... لكن...» together".
3. **p and b lesson (g-a1-04).** The advice on how to make the p sound (close the lips, push air,
   feel more air with p) is a simplification. The app does not hear the learner and says so.
   "bark" is glossed as "the outside of a tree" (لحاء الشجرة) on purpose, to avoid the animal meaning.
4. **Units lesson (e-04).** Check the rules for unit plurals ("3 meters", "a 10-meter pipe",
   "3 kg, not 3 kgs") and the reading of decimals ("zero point seven five"). The Arabic example
   «2,5 متر» uses a comma for the decimal, which is common but not universal in Arabic writing.
5. **Specification words (e-06).** "shall/must = required, should = recommended, may = allowed" is
   the usual meaning in English-language specifications, but projects can define these words
   differently. A practising engineer should confirm.
6. **Exercises with more than one possible answer.** I tried to list every correct answer, but a
   learner may type another correct sentence that is marked wrong. Most at risk: the find-and-fix
   exercises e-01-e6, e-05-e7, e-07-e3, g-b1-03-e5, g-b1-04-e4, g-b2-06-e1, g-a2-05-e7, and the
   reorder exercises (only the listed word order is accepted).
7. **g-b2-01-e7** ("She was tired because she ___ all night"): "had been working" is the most natural
   answer, but it is not an option; "had worked" is marked right.
8. **g-a2-01** ("___ water in this tank is clean" and the general/specific use of *the*): article rules
   always have exceptions; check that the explanations are not too absolute.
9. **Interview lesson (e-08)** uses the "situation, task, action, result" structure. This is common
   interview advice, not a grammar rule.
10. **Placement question p-b2-2** ("Hardly ___ the test begun when the power failed") and **p-b2-6**
    ("She suggested ___") are formal structures. Check that they fit B2.
11. **Arabic style.** The Arabic aims to be simple Modern Standard Arabic. Some phrases may read as
    translated. Please check the interface text in `src/i18n/ar.json` as well as the lessons.
12. **The writing checker's catch rate** (98.8% on the fixture file) is much higher than it will be on
    real learner writing, because the same author wrote the rules and the fixture sentences. Treat it
    as a check that the rules work, not as a measure of real accuracy. A second, held-out set
    (`tests/fixtures/writing-checker-holdout.json`, written after the rules were finished, with no rule
    changes afterwards) gave 35 of 37 caught and 0 false marks on 12 correct sentences. It has the same
    author, so real learner writing will still score lower.

## Which CEFR labels are most uncertain

All levels (A1, A2, B1, B2) are the author's own judgement. They were **not** taken from Oxford
3000/5000, Cambridge, English Profile or any other licensed list, and the app must not claim that they
match an official scale. The placement test has **not** been validated against any official test.

Most uncertain:

- **The placement cut-offs.** 6 out of 8 to pass a level comes from the brief, not from testing with
  learners. The questions in each level band are my estimate of difficulty.
- **A2 vs B1 boundary:** g-a2-05 (countable/uncountable), g-a2-04 (questions with do/does) and
  g-b1-03 (there is / there are) could reasonably sit one level lower.
- **B1 vs B2 boundary:** g-b1-06 (passive) and g-b2-04 (articles, general vs specific) could each move
  one level.
- **Engineers track:** labelled B1 or B2, but the vocabulary (backfilling, casting, MPa, excavation)
  may be hard for a B1 learner who is not an engineer.

## Content rules checklist

Use this list when reviewing any item.

- [ ] Written for this app. Not copied or closely paraphrased from a course, textbook, test or website.
- [ ] No licensed word lists used as a source. CEFR labels are our own estimate.
- [ ] English is correct and natural, and uses American spelling throughout.
- [ ] Arabic is correct, simple Modern Standard Arabic.
- [ ] Every rule explanation is true. Simplifications are still correct.
- [ ] Every exercise has exactly one right option (multiple choice), or a complete list of accepted answers.
- [ ] No sound of any kind: no music, jingles, tones, audio files or speech synthesis.
- [ ] No images of people or animals. Only abstract icons.
- [ ] Topics: work, study, engineering, travel, health, food (halal, ordinary meals), weather, shopping,
      home, daily family life, good character.
- [ ] None of: romance or dating, sexual content, revealing descriptions, alcohol, pork, drugs,
      gambling or lotteries, interest-based loans, magic, nightclubs, music or concerts, festivals of
      other religions, insults to any faith or group, politics.
- [ ] Respectful examples between people. No private scenes between an unrelated man and woman.
      Work dialogues are formal and about the task.
- [ ] No Quran verses, hadith or religious rulings, no "halal certified" claims, and no sacred text
      used as language practice.
- [ ] Ordinary, respectful names only. No real public figures, real companies or real personal details.
- [ ] No fake testimonials, user numbers or promises such as "fluent in 30 days".
- [ ] Item still has `"reviewed": false` until a person has read it.

Automatic checks that already run (`npm test`): banned-word scan (English and Arabic), Arabic letters in
every Arabic field, no Arabic in English fields, schema and counts, one right option per question, and a
repository scan for audio files, audio APIs, images and network calls. These checks do not replace a
human reading.

## Lessons

| # | Id | Track | Level | Title (English) | Title (Arabic) | Owner read | English teacher checked |
|---|---|---|---|---|---|---|---|
| 1 | g-a1-01 | General | A1 | I am, you are, he is | الفعل be: am و is و are |  |  |
| 2 | g-a1-02 | General | A1 | a and an | أداة التنكير a و an |  |  |
| 3 | g-a1-03 | General | A1 | A big house: adjectives before nouns | الصفة قبل الاسم: a big house |  |  |
| 4 | g-a1-04 | General | A1 | p and b: pen, bill, park | الحرفان p و b: pen و bill و park |  |  |
| 5 | g-a1-05 | General | A1 | He works, she goes | المضارع البسيط: he works و she goes |  |  |
| 6 | g-a1-06 | General | A1 | at, on, in for time and place | حروف الجر at و on و in للزمان والمكان |  |  |
| 7 | g-a2-01 | General | A2 | The: when to use it | أداة التعريف the: متى نستخدمها |  |  |
| 8 | g-a2-02 | General | A2 | Past simple: worked, went | الماضي البسيط: worked و went |  |  |
| 9 | g-a2-03 | General | A2 | No extra pronoun: My brother works | لا ضمير زائد: My brother works |  |  |
| 10 | g-a2-04 | General | A2 | Questions with do and does | الأسئلة باستخدام do و does |  |  |
| 11 | g-a2-05 | General | A2 | Countable and uncountable nouns | الأسماء المعدودة وغير المعدودة |  |  |
| 12 | g-a2-06 | General | A2 | Spelling traps | أخطاء إملائية شائعة |  |  |
| 13 | g-b1-01 | General | B1 | Present perfect with for and since | المضارع التام مع for و since |  |  |
| 14 | g-b1-02 | General | B1 | discuss, explain, depend on: verbs and prepositions | الأفعال وحروف الجر: discuss و explain و depend on |  |  |
| 15 | g-b1-03 | General | B1 | There is and there are | There is و There are |  |  |
| 16 | g-b1-04 | General | B1 | Word order with adverbs | ترتيب الكلمات مع الظروف |  |  |
| 17 | g-b1-05 | General | B1 | The future: will and going to | المستقبل: will و going to |  |  |
| 18 | g-b1-06 | General | B1 | The passive: is made, was built | المبني للمجهول: is made و was built |  |  |
| 19 | g-b2-01 | General | B2 | The past perfect | الماضي التام |  |  |
| 20 | g-b2-02 | General | B2 | Conditionals: if it rains, if I had | جمل الشرط: if |  |  |
| 21 | g-b2-03 | General | B2 | Relative clauses: who, which, that | الجمل الموصولة: who و which و that |  |  |
| 22 | g-b2-04 | General | B2 | Articles with general and specific nouns | أدوات التعريف مع الكلام العام والخاص |  |  |
| 23 | g-b2-05 | General | B2 | Indirect questions and reported speech | الأسئلة غير المباشرة ونقل الكلام |  |  |
| 24 | g-b2-06 | General | B2 | Linking words: although, however, because of | أدوات الربط: although و however و because of |  |  |
| 25 | e-01 | Engineers | B1 | Writing a work email | كتابة بريد إلكتروني في العمل |  |  |
| 26 | e-02 | Engineers | B1 | A short site report | تقرير موقع قصير |  |  |
| 27 | e-03 | Engineers | B1 | Describing a problem and its cause | وصف مشكلة وسببها |  |  |
| 28 | e-04 | Engineers | B1 | Units and numbers | الوحدات والأرقام |  |  |
| 29 | e-05 | Engineers | B1 | Asking for and giving a clear update | طلب تحديث وإعطاؤه بوضوح |  |  |
| 30 | e-07 | Engineers | B1 | Meeting phrases | عبارات الاجتماعات |  |  |
| 31 | e-06 | Engineers | B2 | Reading a simple technical specification | قراءة مواصفة فنية بسيطة |  |  |
| 32 | e-08 | Engineers | B2 | A job interview answer | الإجابة في مقابلة عمل |  |  |

## Writing tasks

| # | Id | Track | Level | Title | Owner read | English teacher checked |
|---|---|---|---|---|---|---|
| 1 | w-g-a1-01 | General | A1 | Introduce yourself |  |  |
| 2 | w-g-a1-02 | General | A1 | Jobs in your family |  |  |
| 3 | w-g-a1-03 | General | A1 | Your home |  |  |
| 4 | w-g-a1-04 | General | A1 | A short note at work |  |  |
| 5 | w-g-a1-05 | General | A1 | Someone's day |  |  |
| 6 | w-g-a1-06 | General | A1 | Your week |  |  |
| 7 | w-g-a2-01 | General | A2 | A place you visited |  |  |
| 8 | w-g-a2-02 | General | A2 | Yesterday |  |  |
| 9 | w-g-a2-03 | General | A2 | A colleague |  |  |
| 10 | w-g-a2-04 | General | A2 | Questions for a new colleague |  |  |
| 11 | w-g-a2-05 | General | A2 | Things the office needs |  |  |
| 12 | w-g-a2-06 | General | A2 | A message with difficult words |  |  |
| 13 | w-g-b1-01 | General | B1 | Your experience |  |  |
| 14 | w-g-b1-02 | General | B1 | A message after a meeting |  |  |
| 15 | w-g-b1-03 | General | B1 | Your workplace |  |  |
| 16 | w-g-b1-04 | General | B1 | Your work habits |  |  |
| 17 | w-g-b1-05 | General | B1 | Plans for next week |  |  |
| 18 | w-g-b1-06 | General | B1 | A building or bridge in your city |  |  |
| 19 | w-g-b2-01 | General | B2 | A problem on a past project |  |  |
| 20 | w-g-b2-02 | General | B2 | If you were the manager |  |  |
| 21 | w-g-b2-03 | General | B2 | A person you respect at work |  |  |
| 22 | w-g-b2-04 | General | B2 | Safety on site |  |  |
| 23 | w-g-b2-05 | General | B2 | Report a phone call |  |  |
| 24 | w-g-b2-06 | General | B2 | Working from home |  |  |
| 25 | w-e-01 | Engineers | B1 | Email: asking for drawings |  |  |
| 26 | w-e-02 | Engineers | B1 | Daily site report |  |  |
| 27 | w-e-03 | Engineers | B1 | Report a fault |  |  |
| 28 | w-e-04 | Engineers | B1 | Describe a water tank |  |  |
| 29 | w-e-05 | Engineers | B1 | A weekly update |  |  |
| 30 | w-e-07 | Engineers | B1 | Meeting summary |  |  |
| 31 | w-e-06 | Engineers | B2 | Explain a specification line |  |  |
| 32 | w-e-08 | Engineers | B2 | An interview answer |  |  |

## Placement test

| File | Questions | Owner read | English teacher checked |
|---|---|---|---|
| content/en-from-ar/placement.json | 32 (8 per level, A1 to B2) |  |  |

## Interface text

| File | Owner read | Arabic reader checked |
|---|---|---|
| src/i18n/ar.json |  |  |
| src/i18n/en.json |  |  |
| content/en-from-ar/tags.json |  |  |
| Checker explanations in src/checker/index.ts |  |  |
