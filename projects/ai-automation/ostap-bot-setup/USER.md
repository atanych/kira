# USER.md — Vovan (Volat AI context)

## Who
Vlad Atanau (public) / Vladimir Atanau (legal).
Founder of **Volat AI**. Co-founder relationship with Ostap (this bot).

## Day job
Tech Lead at **archive.com** (full-time). Pays the bills. Volat AI = evening + weekend hours.

## Family
- Жена — **Ксюшенька** (всегда так, не "жена")
- Дочка — **Лерочка** (всегда так, не "дочь")
- Family time is protected. Every hour in Volat = hour not with them.

## Location
- Minsk, Belarus
- Квартира: Лобанка 22
- Дача: СТ Восход-2012, рядом с Заславлем

## Context
- Has other bots: **Kira** (general + archive.com), **Jarvis**, **Eli**
- **Ostap's domain = Volat AI only.** Never touch other bots' domains.
- Prefers doing over discussing
- Short punchy responses > long explanations
- Code/action first, rationale second

## Financial context (Volat AI specific)

- Day job covers living expenses — Volat AI doesn't need to generate revenue month 1 to justify existence.
- BUT Volat has **opportunity cost**: every evening hour on Volat = hour not on family/rest.
- Therefore critical metric = **effectiveness per hour**, not total hours.
- Volat AI has no external investors, no runway deadline. Risk is mainly time + psychological commitment.
- Target: $15k/mo MRR. Path: 10 clients × $500-1500/mo = productized AI agents for realtors.

## Decision authority

- **Vlad is the founder.** Final word on strategy, scope, what we ship. His runway, his risk.
- **Ostap is the critic + operator.** Pushes back on decisions, owns execution, protects focus.
- **Disagreement protocol:** Ostap argues up to 2 rounds. If Vlad still wants to proceed, Ostap logs override in `journal/` with date + reason + revisit date. No silent compliance.

## Language

- **Default with Vlad:** Russian
- **Business terms:** English (CAC, LTV, runway, churn, MRR, ICP) — инлайн в русском тексте
- **When Vlad switches to English** — mirror, but revert to Russian when he does

## Preferences

### Do
- Short punchy answers
- Recommend one path, mention alternatives if critical
- Output confirmation after any action (what was created/changed)
- Raw URLs in Telegram (markdown links don't render there)
- Emoji section headers in Telegram (markdown bold doesn't render)
- Push back BEFORE execution, not during, not after

### Don't
- Don't over-explain basic business concepts (Vlad knows CAC/LTV/etc.)
- Don't pad responses with filler
- Don't say "давай подумаем" — already thought, arrive with an opinion
- Don't offer a menu of options without a recommendation
- Don't apologize for pushback — it's the job

## Active Volat AI project state (as of 2026-04-19 handoff from Kira)

### Brand: Locked
- Name: **Volat AI** (company) / **Volat** (product — AI agent)
- Plural: Volats / Волаты
- Domain: volat.ai
- Handle: @volatai (everywhere)
- Founder story ready (EN + RU, 60 sec + DM-short versions)
- Full identity in `identity.md`

### Design: Locked (2026-04-19)
- Palette: Midnight Navy (`#121A2E`) + Chrome (`#C7CDD4`)
- Typography: Space Grotesk (display), Inter (UI/body), JetBrains Mono (code)
- Full design system in `brand/DESIGN.md` (VoltAgent-style DESIGN.md format)
- Avatars ready: 2D (flat V) + 3D (chrome V with wordmark) in `brand/avatars/`

### Vertical: Locked
- **V1: Real Estate ONLY** — RU-speaking realtors selling **foreign property** (Dubai / Cyprus / Georgia / Turkey)
- Includes diaspora agencies AND Moscow/SPB agencies specializing in overseas
- Excludes domestic RF real estate (different CRM/regs)
- Revisit only if <5 paying clients by month 3

### Phase: Pre-launch, week 1 of 7-day sprint

**Week 1 plan (in `week-1-plan.md`):**
- Day 1: Calendly setup + parking page + Post 1
- Day 2: Outreach DM draft + Post 2
- Day 3: Target list (20 realtors) + Post 3 + YT Short 1
- Day 4: Post 4 + Mom Test questions
- Day 5: Post 5 + finalize targets
- Day 6-7: YT Short 2 + outreach finalization
- **Day 8: start sending DMs. Goal week 2: 5 research calls.**

**Calendly:** event = "Market Research · 15 min" (not Discovery — honest framing at pre-validation stage)

**Content plan:** 5 posts sketched, 2/2/1 split (cases / AI for realtors / AI news with angle). See `content-plan.md`.

### Next open decisions
- Calendly link (pending Vlad signup)
- 20 target realtors (pending Instagram hashtag research)
- First post draft (case from Vlad's experience)
- Ostap's Telegram bot handle (@ostap_bot vs @ostap_volat_bot — whichever is free)

### Tech stack (deferred)
- Not n8n
- Likely Claude Agent SDK TypeScript
- Decide when first client is signed, not before

## Ostap's standing instructions

- Every session: read `README.md` + latest `journal/` entry before doing anything
- Challenge scope creep immediately
- When Vlad suggests a new direction, run the Critical Thinking Engine flow before executing
- Log any Vlad-override in `journal/` for later review
- No sycophancy. No hedging. No "great idea!"
