# 03. Technical Plan

**Background only.** This describes a possible later version with AI and a server. The first version has neither: `BRIEF.md` defines it and wins wherever they differ.

**Prices checked on 2 November 2026.** All usage numbers are **estimates**. We replace them with real numbers during the tests.

## Simple architecture

```
Phone or computer browser (PWA)
        |
Small server function (keeps API keys secret, applies limits)
        |-- Claude API: partner, corrections
        |-- Speech-to-text: only in the speaking stage
        |-- Pronunciation tool: only in the read-aloud stage
        |
Database and sign-in (Supabase)
```

## Stack

Claude Code does most of the writing. A person reviews and tests.

| Part | Choice | Why | Cost |
|---|---|---|---|
| Language | TypeScript | One language everywhere | Free |
| App | React + Vite, as a PWA | Common and simple, one codebase | Free |
| Hosting | Cloudflare Workers | [Free plan: 100,000 requests/day and 10 ms CPU per request. Waiting for the AI's reply does not count as CPU](https://developers.cloudflare.com/workers/platform/limits/). | $0 to about $5/month (paid price reported) |
| Database and sign-in | Supabase | [Free: 500 MB, 50,000 monthly users, but pauses after 7 days idle. Pro $25/month](https://www.activepieces.com/blog/supabase-pricing-free-tier-limits-pro-costs-egress.md) (checked by that site on 30 Sep 2026). | $0, later $25/month |
| Sign-in method | Email link | No passwords to protect | Free within limits |

I avoided Vercel's free plan because it is [limited to non-commercial, personal use](https://vercel.com/docs/plans/hobby). That would become a problem if the project ever grows.

## AI models: the cheapest option that should work

Official prices from [Anthropic's pricing page](https://platform.claude.com/docs/en/about-claude/pricing), per 1 million tokens:

| Model | Input | Cache read | Output | Batch input / output |
|---|---|---|---|---|
| **Claude Haiku 5.5** (prompts up to 100,000 tokens) | $0.10 | $0.01 | $0.50 | $0.05 / $0.25 |
| **Claude Sonnet 5.5** | $2.00 | $0.10 | $10.00 | $1.00 / $5.00 |
| Claude Opus 5.5 (for comparison) | $4.00 | $0.20 | $20.00 | not checked |

Saudi Arabia is on [Anthropic's supported countries list](https://www.anthropic.com/supported-countries) (the page shows an effective date of 12 Nov 2026).

**The plan:**

| Job | Model | Why |
|---|---|---|
| Daily partner and corrections | **Haiku 5.5** | About 20 times cheaper than Sonnet per reply. **Must first pass the quality test.** |
| If Haiku fails the test | **Sonnet 5.5** | Still affordable for a small test, but too costly at 1,000 users |
| Weekly writing review | Sonnet 5.5 with Batch (50% off) | Not urgent, and needs better judgement |
| Writing lessons | Sonnet 5.5 with Batch, or Claude Code | Done once. A person reads every lesson. |
| Level test | Multiple choice: **no AI**. Writing task: Haiku or Sonnet. | Cheap and repeatable |

**Cost per reply (estimate).** I assume 1,500 tokens of cached instructions, 800 tokens of recent chat, and 300 tokens of output.

| Model | Cost per reply |
|---|---|
| Haiku 5.5 | about $0.0003 |
| Sonnet 5.5 | about $0.005 |
| Opus 5.5 | about $0.01 |

Arabic text can use more tokens than English, so real costs could be 2 to 3 times higher. We measure this in Milestone 3.

**The partner returns structured data**, not just text:

- the reply;
- corrections, each with the wrong text, right text, mistake type and short Arabic explanation.

This data fills the My Mistakes page.

**Do not use a heavier model just to feel safe.** Run the same test on Haiku and Sonnet, and keep the cheapest one that passes.

## Speech tools

I found no speech-to-text in the Claude pricing page, so we need another provider for speech. **Only add speech after writing passes the tests.**

| Job | Tool | Price | Confidence |
|---|---|---|---|
| Speech to text | [OpenAI gpt-4o-mini-transcribe](https://developers.openai.com/api/docs/pricing) | $0.003/minute | Official |
| p/b read-aloud scoring | [Azure Pronunciation Assessment](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/how-to-pronunciation-assessment), which scores individual sounds | [About $1.32/hour reported](https://learn.microsoft.com/en-us/answers/questions/5608069/pricing-and-usage-of-pronunciation-assessment-feat) in late 2025. [Official page](https://azure.microsoft.com/en-us/pricing/details/speech/) did not show amounts when I checked, but lists 5 free audio hours/month. | **Check the price.** Does the free tier include this feature? Unconfirmed. |
| Lesson audio | **Decided after PR 2:** no browser voice. English: pre-generated Kokoro clips (Apache-2.0), labelled synthetic, after a teacher's check, or our own recordings. Chinese and Urdu: own teacher recordings only. Stored as Opus files in the app, played from the device. Rules: `docs/AUDIO.md` | Free (Apache-2.0 / own work) | No clips yet |

**Risks to test before relying on speech:**

- Does speech-to-text keep the learner's grammar mistakes, or "fix" them?
- Does Azure correctly catch p/b mistakes from Arabic speakers?

I have no evidence on either point.

## Data

Keep as little as possible.

| Store | Do not store |
|---|---|
| Email for sign-in | Real name, phone, age, location, employer |
| Level, lesson progress | **Voice recordings:** delete right after processing |
| Mistake type, count, date, and a short example | **Full chat history:** keep only recent messages, and delete after 30 days at most |
| 18+ confirmation and consent date | Payment details (no payments exist) |

**Tell users not to write private details** like names, ID numbers or company secrets in practice messages. Work-email practice makes this a real risk.

## Privacy

**Before this is used by testers:**

1. **Plain Arabic and English privacy page:** what is stored, where it goes, how to delete it.
2. **Clear notice and consent** that data goes abroad. Saudi data law restricts transfers outside the Kingdom. [A law-firm guide](https://practiceguides.chambers.com/practice-guides/data-protection-privacy-2026/saudi-arabia) asks for adequate protection or safeguards such as standard contract clauses, and does not list consent alone as an exception. Other sources in my search summaries do mention consent, but I did not confirm them. **So consent may not be enough.** I did not read the primary SDAIA text. Keep data small, and have these rules checked by a qualified person before any version sends data to a server.
3. **A "Delete my data" button** that really deletes.
4. **Say which services receive data.** The API keeps [inputs and outputs up to 30 days and does not train on them by default](https://privacy.claude.com/en/articles/7996866-how-long-do-you-store-my-organization-s-data), with [longer retention for flagged content](https://privacy.claude.com/en/articles/10023548-how-long-do-you-store-my-data). Check OpenAI and Azure the same way before using them.
5. **Database region:** choose the nearest one offered. A Middle East region is unconfirmed. Row-level security must be on, so users can only see their own data.

### Children's data

**Children stay out of the MVP.** It is not safe yet:

- Saudi law [is reported to require guardian consent and extra protection for minors](https://vlolawfirm.com/legal-updates/saudi-arabia-2026-q1-data-protection). The age of legal capacity was not confirmed in my search.
- Anthropic [asks products serving minors to add safeguards, comply with child-privacy law, publish that compliance, and disclose the AI. It audits](https://support.claude.com/en/articles/9307344-responsible-use-of-anthropic-s-models-guidelines-for-organizations-serving-minors), and it treats [anyone under 18 as a minor](https://conductatlas.com/platform/anthropic/anthropic-api-usage-policy/products-serving-minors-additional-requirements/) (third-party copy of the policy).
- **In practice:** an 18+ confirmation on sign-up, invite-only access during tests, and no child users even in family testing. If a tester's child wants to try it, the answer is no.

## Usage limits that protect cost

Every request passes through the server, so limits cannot be skipped by users.

| Limit | Tester stage value (estimate) |
|---|---|
| AI replies | 30 per user per day |
| Message length | 500 characters |
| Chat sent to AI | Last 10 exchanges only |
| AI output | About 400 tokens per reply |
| Speech to text | 5 minutes per user per day, 60 seconds per recording |
| Read-aloud scoring | 2 minutes per user per day |
| Sign-up | Invite code only |
| Whole-app daily limit | Stop AI for the day above a set amount, such as $1 |
| Monthly limit | Spend limit in the Anthropic Console, if available. Also use small prepaid credit. No auto top-up. |

Also: cache the fixed instructions, and show a friendly "come back tomorrow" message at the limit.

## Monthly cost estimate

### Assumptions (all estimates)

| Usage | Typical user | User at limits |
|---|---|---|
| Active days per month | 15 | 30 |
| AI replies | 300 (20/day) | 900 (30/day) |
| Speech to text | 45 min | 150 min |
| Read-aloud scoring | 15 min | 60 min |

### Cost per user per month

| Setup | Typical | At limits |
|---|---|---|
| **Text only, Haiku** | **$0.12** | $0.30 |
| **Text + speech, Haiku** | **$0.60** | $2.10 |
| Text + speech, Sonnet | $2.00 | $6.30 |

This includes about $0.03 for a weekly Sonnet Batch review. Speech uses the reported Azure price.

**Key finding: with Haiku, speech costs more than text.** Speech is the main thing to limit.

### Total per month, including fixed costs

Fixed costs: about $1 at 10 users (optional domain), $26 at 100 users (Supabase Pro + domain), and $51 at 1,000 users (adds about $5 hosting and about $20 for email, which is a rough guess).

| Users | Text only, Haiku | Text + speech, Haiku | Text + speech, Sonnet | Worst case: Haiku, speech, everyone at limits |
|---|---|---|---|---|
| **10** | ~$2 | ~$7 | ~$21 | ~$22 |
| **100** | ~$38 | ~$86 | ~$226 | ~$236 |
| **1,000** | ~$171 | ~$651 | ~$2,051 | ~$2,151 |

**How to read this:**

- This counts every user as active. In real life, many sign-ups stop, so true costs would be lower, but I don't have a real number yet.
- **10 users is cheap,** especially without speech.
- **100 users is a real expense.**
- **1,000 users costs about $170 to $2,150 a month with no income.** This is why any AI version stays small and invite-only.

### One-time costs (estimates)

| Item | Cost |
|---|---|
| Creating 30 lessons with AI | About $1 to $2 |
| Quality test (100 sentences on two models) | Under $1 |
| Domain (optional) | About $12/year |
| API first credit | Small prepaid amount. I recall $5 minimum, but this is unconfirmed. |

## Other technical risks

- **Long chats and history:** always send a short recent history, to keep cost predictable.
- **Refusals and errors:** the app must handle AI refusals or failures with a polite message. Keep the error message plain and do not show technical details.
- **Model changes:** keep the model name in one setting, so a change is one line.
- **Prompt tricks:** users may try to push the AI off-topic. Test this in the quality test. Add a report button and read those reports.
- **One-person project:** no complex systems, no servers to maintain, and backups stay simple. Supabase's free plan backup options need checking.
