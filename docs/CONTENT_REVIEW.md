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
11. **Placement question p-a1-3** ("I eat ___ apple every morning", options a / many / an, answer an).
    The first wrong option, "the a", was changed to "the" after a review, and then to "many", because
    "I eat the apple every morning" is correct English and a good learner would have been marked wrong.
    Check that "many" is clearly wrong here ("many apple") and that "an" is the only right answer.
    **Placement question p-b1-8** ("He is ___ honest person") had the same problem with "the" and was
    changed the same way: options a / many / an, answer an.
12. **Arabic style.** The Arabic aims to be simple Modern Standard Arabic. Some phrases may read as
    translated. Please check the interface text in `src/i18n/ar.json` as well as the lessons.
13. **The writing checker's catch rate** (98.8% on the fixture file) is much higher than it will be on
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
- [ ] No music, jingles, tones or sound effects. Speech audio only under the rules in `docs/AUDIO.md`,
      with every clip in `AUDIO_CREDITS.json` and the audio review table below.
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
repository scan for audio files (only listed Opus clips under `public/audio/<course>/`), audio APIs,
images and network calls, and the `AUDIO_CREDITS.json` schema. These checks do not replace a
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

## 15-Day Start plan (added after PR 1)

All of this was written by AI and has **not been reviewed by a person**. Every file keeps `"reviewed": false`.

### Read these first: the items I am least sure about

1. **The honest position of the plan** (`content/en-from-ar/plans/15-day-start.json`, `honestAr` and `honestEn`). "About 4 hours" is 15 minutes × 15 days = 3 hours 45 minutes. "Below A1" and "a working level takes hundreds of hours" are general estimates, not measured. Check that the wording is fair and not discouraging.
2. **Arabic for some phrases:** "I need it by Thursday" (أحتاجه في موعد أقصاه يوم الخميس), "Have a good evening" (أتمنى لك مساءً طيبًا), "I really appreciate it" (أقدّر ذلك حقًا) and "No problem" (لا مشكلة). Check that they sound natural.
3. **Register:** "Can I speak to Mr. Hassan, please?" is polite enough for most offices, but "Could I speak to ..." is more formal. "You're welcome" and "No problem" are both taught; some offices prefer the first.
4. **Stories** use the past tense in the retelling samples ("Today I met ..."), although the plan is below A1. The samples are short, but a teacher should check that they are not too hard.
5. **Phrase recall on review days:** only phrases that are due move to the next box; the others are practice only. This keeps the spacing honest, but it means some phrases learned late (days 12 to 14) cannot reach box 3 by day 15. The phrase goal is "most" (25 of 48), not all.
6. **The self-check** (5 statements, answered "Not yet", "A little" or "Yes" on day 1 and on the last day) is not a test and has not been validated.
7. **Say it aloud:** the app cannot hear the learner. The self-rating labels ("I needed to read the sample", "I said it with some pauses", "I said it clearly without reading") should be checked for clarity in Arabic.
8. **Names** (Omar, Khalid, Huda, Mona, Sami, Ali, Yousef, Mr. Fares, Nabil, Sara, Tariq, Hani, Ahmed, Mr. Hassan) are ordinary names, not real people.

### Plan

| File | Owner read | English teacher checked |
|---|---|---|
| content/en-from-ar/plans/15-day-start.json (honest position, how it works, goals, routine, self-check, can do / cannot yet) |  |  |

### Phrases (48)

| Id | Day | English | Arabic | Owner read | English teacher checked |
|---|---|---|---|---|---|
| ph-01 | 1 | Good morning. | صباح الخير. |  |  |
| ph-02 | 1 | Nice to meet you. | سعيد بلقائك. |  |  |
| ph-03 | 1 | I am a new engineer here. | أنا مهندس جديد هنا. |  |  |
| ph-04 | 1 | I work in the design team. | أعمل في فريق التصميم. |  |  |
| ph-05 | 2 | Can you help me, please? | هل يمكنك مساعدتي من فضلك؟ |  |  |
| ph-06 | 2 | Could you say that again, please? | هل يمكنك أن تقول ذلك مرة أخرى من فضلك؟ |  |  |
| ph-07 | 2 | Sorry, I don't understand. | عذرًا، لا أفهم. |  |  |
| ph-08 | 2 | What does this word mean? | ماذا تعني هذه الكلمة؟ |  |  |
| ph-09 | 3 | Thank you for your help. | شكرًا لمساعدتك. |  |  |
| ph-10 | 3 | You're welcome. | على الرحب والسعة. |  |  |
| ph-11 | 3 | No problem. | لا مشكلة. |  |  |
| ph-12 | 3 | I really appreciate it. | أقدّر ذلك حقًا. |  |  |
| ph-13 | 4 | What time is the meeting? | متى موعد الاجتماع؟ |  |  |
| ph-14 | 4 | The meeting starts at ten. | يبدأ الاجتماع في الساعة العاشرة. |  |  |
| ph-15 | 4 | I will be there. | سأكون هناك. |  |  |
| ph-16 | 4 | See you at the meeting. | أراك في الاجتماع. |  |  |
| ph-17 | 5 | Could you send me the file? | هل يمكنك أن ترسل لي الملف؟ |  |  |
| ph-18 | 5 | Please check this drawing. | من فضلك راجع هذا المخطط. |  |  |
| ph-19 | 5 | When do you need it? | متى تحتاجه؟ |  |  |
| ph-20 | 5 | I need it by Thursday. | أحتاجه في موعد أقصاه يوم الخميس. |  |  |
| ph-21 | 7 | I'm working on it. | أعمل عليه الآن. |  |  |
| ph-22 | 7 | It's almost finished. | أوشك على الانتهاء. |  |  |
| ph-23 | 7 | It's ready. | إنه جاهز. |  |  |
| ph-24 | 7 | I'll send it today. | سأرسله اليوم. |  |  |
| ph-25 | 8 | There is a problem with the pump. | توجد مشكلة في المضخة. |  |  |
| ph-26 | 8 | The printer is not working. | الطابعة لا تعمل. |  |  |
| ph-27 | 8 | I will check it now. | سأتحقق منه الآن. |  |  |
| ph-28 | 8 | Let me call the technician. | دعني أتصل بالفني. |  |  |
| ph-29 | 9 | Sorry for the delay. | آسف على التأخير. |  |  |
| ph-30 | 9 | The delivery is late. | التوريد متأخر. |  |  |
| ph-31 | 9 | We need one more day. | نحتاج يومًا آخر. |  |  |
| ph-32 | 9 | It will be ready tomorrow. | سيكون جاهزًا غدًا. |  |  |
| ph-33 | 10 | I agree. | أوافق. |  |  |
| ph-34 | 10 | That's a good idea. | هذه فكرة جيدة. |  |  |
| ph-35 | 10 | I'm not sure. | لست متأكدًا. |  |  |
| ph-36 | 10 | Let's discuss it tomorrow. | لنناقش ذلك غدًا. |  |  |
| ph-37 | 12 | Please wear your helmet. | من فضلك ارتدِ خوذتك. |  |  |
| ph-38 | 12 | Be careful, the floor is wet. | انتبه، الأرض مبتلة. |  |  |
| ph-39 | 12 | Where is the site office? | أين مكتب الموقع؟ |  |  |
| ph-40 | 12 | The site is closed today. | الموقع مغلق اليوم. |  |  |
| ph-41 | 13 | Can I speak to Mr. Hassan, please? | هل يمكنني التحدث مع السيد حسن من فضلك؟ |  |  |
| ph-42 | 13 | He is in a meeting now. | هو في اجتماع الآن. |  |  |
| ph-43 | 13 | Can I leave a message? | هل يمكنني ترك رسالة؟ |  |  |
| ph-44 | 13 | I'll call you back. | سأعاود الاتصال بك. |  |  |
| ph-45 | 14 | I'm leaving now. | سأغادر الآن. |  |  |
| ph-46 | 14 | See you tomorrow. | أراك غدًا. |  |  |
| ph-47 | 14 | Have a good evening. | أتمنى لك مساءً طيبًا. |  |  |
| ph-48 | 14 | Thanks for today. | شكرًا على اليوم. |  |  |

### Work stories (12)

| Id | Title | Owner read | English teacher checked |
|---|---|---|---|
| st-01 | A new engineer |  |  |
| st-02 | A word in the report |  |  |
| st-03 | Help with the printer |  |  |
| st-04 | The meeting time |  |  |
| st-05 | A file for Thursday |  |  |
| st-06 | Almost ready |  |  |
| st-07 | A problem with the pump |  |  |
| st-08 | The late delivery |  |  |
| st-09 | A new idea |  |  |
| st-10 | Safety on site |  |  |
| st-11 | A phone call |  |  |
| st-12 | The end of the day |  |  |

### Say-aloud prompts (15)

| Id | Prompt | Owner read | English teacher checked |
|---|---|---|---|
| sa-01 | Greet a new colleague. Say that you are new and which team you work in. |  |  |
| sa-02 | You did not understand something in a meeting. Ask politely. |  |  |
| sa-03 | A colleague helped you. Thank them. |  |  |
| sa-04 | Ask about the time of a meeting, and say that you will come. |  |  |
| sa-05 | Ask a colleague to send you a file, and say when you need it. |  |  |
| sa-06 | Review: greet someone, ask for help, and thank them. |  |  |
| sa-07 | Your manager asks about your report. Give a short update. |  |  |
| sa-08 | Tell your supervisor about a problem with a machine. |  |  |
| sa-09 | A delivery is late. Say sorry and say when it will be ready. |  |  |
| sa-10 | In a meeting, agree with one idea and say you are not sure about another. |  |  |
| sa-11 | Review: give an update, and say that something is late. |  |  |
| sa-12 | Give two safety instructions to a new worker on site. |  |  |
| sa-13 | Call an office. Ask for a person, and leave a message. |  |  |
| sa-14 | Say goodbye to your colleagues at the end of the day. |  |  |
| sa-15 | Introduce yourself for about 30 seconds: your name, your job, your team, and one thing you do at work. |  |  |

### Goal writing tasks (3)

| Id | Title | Owner read | English teacher checked |
|---|---|---|---|
| w-p15-request | A short request |  |  |
| w-p15-thanks | A short thank-you |  |  |
| w-p15-delay | A short delay message |  |  |

## Audio clips

**47 phrase clips, all made by a computer voice (Kokoro-82M, voice am_michael), none checked by a
teacher yet.** The app labels each one "Computer voice, not yet checked by a teacher". The rules are in
`docs/AUDIO.md`. When a teacher has listened to a clip and checked it against the text, fill in the last
two columns, and set `reviewed: true` for that clip in both `AUDIO_CREDITS.json` and
`content/en-from-ar/audio.json`.

**Left out:** `ph-41` ("Can I speak to Mr. Hassan, please?"). "Hassan" is not in the voice's
pronunciation dictionary, and the script does not guess a pronunciation. That phrase has no Listen button.

| File | Text (exact words) | Source | Licence | Synthetic | Reviewer (role) | Date checked |
|---|---|---|---|---|---|---|
| public/audio/en-from-ar/ph-01.opus | Good morning. | Kokoro-82M, am_michael | Apache-2.0 | yes |  |  |
| public/audio/en-from-ar/ph-02.opus | Nice to meet you. | Kokoro-82M, am_michael | Apache-2.0 | yes |  |  |
| public/audio/en-from-ar/ph-03.opus | I am a new engineer here. | Kokoro-82M, am_michael | Apache-2.0 | yes |  |  |
| public/audio/en-from-ar/ph-04.opus | I work in the design team. | Kokoro-82M, am_michael | Apache-2.0 | yes |  |  |
| public/audio/en-from-ar/ph-05.opus | Can you help me, please? | Kokoro-82M, am_michael | Apache-2.0 | yes |  |  |
| public/audio/en-from-ar/ph-06.opus | Could you say that again, please? | Kokoro-82M, am_michael | Apache-2.0 | yes |  |  |
| public/audio/en-from-ar/ph-07.opus | Sorry, I don't understand. | Kokoro-82M, am_michael | Apache-2.0 | yes |  |  |
| public/audio/en-from-ar/ph-08.opus | What does this word mean? | Kokoro-82M, am_michael | Apache-2.0 | yes |  |  |
| public/audio/en-from-ar/ph-09.opus | Thank you for your help. | Kokoro-82M, am_michael | Apache-2.0 | yes |  |  |
| public/audio/en-from-ar/ph-10.opus | You're welcome. | Kokoro-82M, am_michael | Apache-2.0 | yes |  |  |
| public/audio/en-from-ar/ph-11.opus | No problem. | Kokoro-82M, am_michael | Apache-2.0 | yes |  |  |
| public/audio/en-from-ar/ph-12.opus | I really appreciate it. | Kokoro-82M, am_michael | Apache-2.0 | yes |  |  |
| public/audio/en-from-ar/ph-13.opus | What time is the meeting? | Kokoro-82M, am_michael | Apache-2.0 | yes |  |  |
| public/audio/en-from-ar/ph-14.opus | The meeting starts at ten. | Kokoro-82M, am_michael | Apache-2.0 | yes |  |  |
| public/audio/en-from-ar/ph-15.opus | I will be there. | Kokoro-82M, am_michael | Apache-2.0 | yes |  |  |
| public/audio/en-from-ar/ph-16.opus | See you at the meeting. | Kokoro-82M, am_michael | Apache-2.0 | yes |  |  |
| public/audio/en-from-ar/ph-17.opus | Could you send me the file? | Kokoro-82M, am_michael | Apache-2.0 | yes |  |  |
| public/audio/en-from-ar/ph-18.opus | Please check this drawing. | Kokoro-82M, am_michael | Apache-2.0 | yes |  |  |
| public/audio/en-from-ar/ph-19.opus | When do you need it? | Kokoro-82M, am_michael | Apache-2.0 | yes |  |  |
| public/audio/en-from-ar/ph-20.opus | I need it by Thursday. | Kokoro-82M, am_michael | Apache-2.0 | yes |  |  |
| public/audio/en-from-ar/ph-21.opus | I'm working on it. | Kokoro-82M, am_michael | Apache-2.0 | yes |  |  |
| public/audio/en-from-ar/ph-22.opus | It's almost finished. | Kokoro-82M, am_michael | Apache-2.0 | yes |  |  |
| public/audio/en-from-ar/ph-23.opus | It's ready. | Kokoro-82M, am_michael | Apache-2.0 | yes |  |  |
| public/audio/en-from-ar/ph-24.opus | I'll send it today. | Kokoro-82M, am_michael | Apache-2.0 | yes |  |  |
| public/audio/en-from-ar/ph-25.opus | There is a problem with the pump. | Kokoro-82M, am_michael | Apache-2.0 | yes |  |  |
| public/audio/en-from-ar/ph-26.opus | The printer is not working. | Kokoro-82M, am_michael | Apache-2.0 | yes |  |  |
| public/audio/en-from-ar/ph-27.opus | I will check it now. | Kokoro-82M, am_michael | Apache-2.0 | yes |  |  |
| public/audio/en-from-ar/ph-28.opus | Let me call the technician. | Kokoro-82M, am_michael | Apache-2.0 | yes |  |  |
| public/audio/en-from-ar/ph-29.opus | Sorry for the delay. | Kokoro-82M, am_michael | Apache-2.0 | yes |  |  |
| public/audio/en-from-ar/ph-30.opus | The delivery is late. | Kokoro-82M, am_michael | Apache-2.0 | yes |  |  |
| public/audio/en-from-ar/ph-31.opus | We need one more day. | Kokoro-82M, am_michael | Apache-2.0 | yes |  |  |
| public/audio/en-from-ar/ph-32.opus | It will be ready tomorrow. | Kokoro-82M, am_michael | Apache-2.0 | yes |  |  |
| public/audio/en-from-ar/ph-33.opus | I agree. | Kokoro-82M, am_michael | Apache-2.0 | yes |  |  |
| public/audio/en-from-ar/ph-34.opus | That's a good idea. | Kokoro-82M, am_michael | Apache-2.0 | yes |  |  |
| public/audio/en-from-ar/ph-35.opus | I'm not sure. | Kokoro-82M, am_michael | Apache-2.0 | yes |  |  |
| public/audio/en-from-ar/ph-36.opus | Let's discuss it tomorrow. | Kokoro-82M, am_michael | Apache-2.0 | yes |  |  |
| public/audio/en-from-ar/ph-37.opus | Please wear your helmet. | Kokoro-82M, am_michael | Apache-2.0 | yes |  |  |
| public/audio/en-from-ar/ph-38.opus | Be careful, the floor is wet. | Kokoro-82M, am_michael | Apache-2.0 | yes |  |  |
| public/audio/en-from-ar/ph-39.opus | Where is the site office? | Kokoro-82M, am_michael | Apache-2.0 | yes |  |  |
| public/audio/en-from-ar/ph-40.opus | The site is closed today. | Kokoro-82M, am_michael | Apache-2.0 | yes |  |  |
| public/audio/en-from-ar/ph-42.opus | He is in a meeting now. | Kokoro-82M, am_michael | Apache-2.0 | yes |  |  |
| public/audio/en-from-ar/ph-43.opus | Can I leave a message? | Kokoro-82M, am_michael | Apache-2.0 | yes |  |  |
| public/audio/en-from-ar/ph-44.opus | I'll call you back. | Kokoro-82M, am_michael | Apache-2.0 | yes |  |  |
| public/audio/en-from-ar/ph-45.opus | I'm leaving now. | Kokoro-82M, am_michael | Apache-2.0 | yes |  |  |
| public/audio/en-from-ar/ph-46.opus | See you tomorrow. | Kokoro-82M, am_michael | Apache-2.0 | yes |  |  |
| public/audio/en-from-ar/ph-47.opus | Have a good evening. | Kokoro-82M, am_michael | Apache-2.0 | yes |  |  |
| public/audio/en-from-ar/ph-48.opus | Thanks for today. | Kokoro-82M, am_michael | Apache-2.0 | yes |  |  |


## Arabic-speaker hints for mistake tags (added after PR 5)

Each mistake tag in `content/en-from-ar/tags.json` has a short Arabic note, `hint.ar`, in the form
"you may say X because Arabic does Y". It is shown in My Mistakes and after a wrong answer. All have
`"reviewed": false`. They describe a possible cause ("قد", may), never a fact about a learner. Please
check the Arabic and the claim about Arabic in each one. **Least certain first.**

| # | Tag | Hint (Arabic) | Why it is uncertain or what to check | Teacher checked |
|---|---|---|---|---|
| 1 | WORD | قد تختار كلمة بترجمة حرفية، فتقول open the light بدل turn on the light، لأن كثيرًا من الناس يقولون بالعربية «افتح الضوء». | "open the light": many people say «افتح الضوء», but this is closer to everyday speech than to standard Arabic, and how common the mistake is was not checked. |  |
| 2 | PUNCTUATION | قد تصل جملًا كثيرة بفواصل دون نقطة، لأن الكتابة العربية تقبل جملًا طويلة مربوطة بالواو والفواصل، أما الإنجليزية فتفضّل جملًا أقصر تنتهي بنقطة. | A general statement about Arabic writing style (long sentences joined with و and commas). True of much writing, not all. |  |
| 3 | SPELLING | قد تحذف بعض حروف العلة عند الكتابة، لأن العربية لا تكتب الحركات القصيرة عادة، أما الإنجليزية فتكتبها حروفًا (مثل study و meeting). | Leaving out vowel letters is a known pattern, but the link to Arabic short vowels (not usually written) is a simplification. |  |
| 4 | SVA | قد تنسى s في he goes، لأن الفعل في العربية يتغيّر مع الفاعل في أوله (يذهب، تذهب)، أما الإنجليزية فتضيف s في آخره مع he و she و it فقط. | The explanation (Arabic marks the subject at the start of the verb, يذهب / تذهب; English adds -s at the end) is simplified: Arabic verbs also change at the end in other forms. |  |
| 5 | PRONOUN | قد تضيف ضميرًا زائدًا فتقول My brother he works أو the report that I sent it، لأن العربية قد تعيد الاسم بضمير: «أخي هو يعمل هنا»، «التقرير الذي أرسلتُه». | The hint now starts with the tag's own case ("my brother he works") and keeps the relative-clause case second. Check that «أخي هو يعمل هنا» is a fair picture of how people speak: it is closer to everyday speech than to formal Arabic. |  |
| 6 | TENSE | قد تقول I work here since 2020 بدل I have worked here since 2020، لأن العربية تستعمل المضارع مع «منذ»: «أعمل هنا منذ 2020». | Present tense with «منذ» against English "have worked ... since". Check the example sentence. |  |
| 7 | PREPOSITION | قد تختار حرف الجر بترجمة حرفية، فتقول in Monday بدل on Monday، لأن العربية تقول «في يوم الاثنين». | "in Monday" from «في يوم الاثنين». Check that the example is natural. |  |
| 8 | ARTICLE | قد تحذف a أو an فتقول He is engineer، لأن العربية لا تضع كلمة مستقلة قبل الاسم النكرة: «هو مهندس». | No separate word before an indefinite noun in Arabic («هو مهندس»). Check the wording. |  |
| 9 | BE | قد تحذف is أو are فتقول She happy، لأن الجملة الاسمية في العربية لا تحتاج فعلًا في الزمن الحاضر: «هي سعيدة». | No verb "to be" needed in the present in an Arabic nominal sentence («هي سعيدة»). |  |
| 10 | ORDER | قد تضع الصفة بعد الاسم فتقول a car red، لأن الصفة في العربية تأتي بعد الموصوف: «سيارة حمراء». | The adjective comes after the noun in Arabic («سيارة حمراء»). |  |
| 11 | UNCOUNTABLE | قد تقول informations أو advices، لأن الكلمة المقابلة في العربية تُجمع: «معلومات»، «نصائح». | «معلومات» and «نصائح» are plural in Arabic, unlike information and advice. |  |
| 12 | CAPITAL | قد تكتب أسماء الأيام واللغات بحرف صغير (monday, arabic)، لأن العربية ليس فيها حروف كبيرة وصغيرة. | Arabic has no capital letters. |  |
| 13 | PB | قد تقول bark وأنت تقصد park، لأن العربية الفصحى ليس فيها صوت p، فيقترب نطقه من b. | Standard Arabic has no p sound. |  |
