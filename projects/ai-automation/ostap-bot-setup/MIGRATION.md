# Migration Plan — Creating Ostap Bot

**For Claude Code (tomorrow's session with Vlad).**

Goal: spin up a new standalone bot named **Ostap** with full Volat AI context. Kira releases the Volat domain entirely (clean cut).

---

## TL;DR

1. Create new bot folder: `bots/ostap/`
2. Copy identity files from this folder (`SOUL.md`, `USER.md`, `MEMORY.md`) into bot root
3. Copy entire `bots/kira/projects/ai-automation/` content into `bots/ostap/` as its main project folder (the Volat AI project is now Ostap's whole reason for existence — no need for a sub-folder, it IS the project)
4. Set up Telegram config for Ostap (new bot token + chat ID)
5. Delete `projects/ai-automation/` from Kira (clean cut)
6. Update Kira's MEMORY.md with one entry: "Volat AI domain handed off to Ostap 2026-04-19"

---

## Step-by-step

### 1. Folder structure

Target layout for the new bot:

```
bots/ostap/
├── SOUL.md                    # from ostap-bot-setup/SOUL.md
├── USER.md                    # from ostap-bot-setup/USER.md
├── memory/
│   └── MEMORY.md              # from ostap-bot-setup/MEMORY.md
├── skills/                    # empty for now, see "Skills plan" below
├── crons/                     # empty for now
├── journal/                   # from kira's projects/ai-automation/journal/
├── brand/                     # from kira's projects/ai-automation/brand/
├── parking-page/              # from kira's projects/ai-automation/parking-page/
├── research/                  # from kira's projects/ai-automation/research/
├── verticals/                 # from kira's projects/ai-automation/verticals/
├── README.md                  # from kira's projects/ai-automation/README.md
├── identity.md                # brand identity
├── decisions.md               # decision log
├── market.md
├── offer.md
├── pipeline.md
├── plan.md
├── verticals.md
├── youtube.md
├── content-plan.md
├── week-1-plan.md
├── config.json                # bot-level config (Telegram, LLM model, etc.)
└── package.json               # if applicable
```

**Key principle:** Ostap doesn't have a `projects/` subfolder. Volat AI IS Ostap. All project files live in bot root (like Kira has CRM/KB/personal-tasks in her root as skills).

### 2. Copy script (bash draft — Vlad to run)

```bash
# from repo root
mkdir -p bots/ostap/memory bots/ostap/skills bots/ostap/crons

# Identity files (from this setup folder)
cp bots/kira/projects/ai-automation/ostap-bot-setup/SOUL.md   bots/ostap/SOUL.md
cp bots/kira/projects/ai-automation/ostap-bot-setup/USER.md   bots/ostap/USER.md
cp bots/kira/projects/ai-automation/ostap-bot-setup/MEMORY.md bots/ostap/memory/MEMORY.md

# Volat AI project content (everything except the ostap-bot-setup/ folder)
rsync -av --exclude='ostap-bot-setup' bots/kira/projects/ai-automation/ bots/ostap/

# Clean up: remove Volat project from Kira (clean cut)
rm -rf bots/kira/projects/ai-automation

# Copy Kira's bot-level config as template, then edit Telegram token/chat
cp bots/kira/config.json bots/ostap/config.json  # if kira has one
# Edit bots/ostap/config.json to set Ostap's Telegram bot token + chat ID
```

### 3. Telegram setup

1. Register new Telegram bot via @BotFather:
   - Preferred handle: **@ostap_bot** (check availability)
   - Fallbacks: **@ostap_volat_bot**, **@ostapvolatai_bot**
2. Save bot token to `bots/ostap/config.json`
3. Create dedicated Telegram chat/group for Volat work, add Ostap bot
4. Get chat ID (from Telegram API), save to config
5. Set bot profile picture to `brand/avatars/avatar-3d.png` (the chrome V with wordmark)
6. Set bot description: "Volat AI ко-фаундер. Критик, оператор, партнёр. ⚒️"

### 4. Kira cleanup

After successful migration:

1. Verify Ostap bot runs and has full context (test: ask Ostap "what's in our week-1 plan?")
2. Delete `bots/kira/projects/ai-automation/` entirely
3. Add one entry to Kira's MEMORY.md:
   ```
   [2026-04-19] Volat AI domain handed off to [[Ostap]] bot — clean cut. Kira no longer owns this project. If Vovan asks Volat-related questions, redirect to Ostap.
   ```
4. Do NOT keep a read-only archive in Kira — clean separation avoids memory drift

### 5. First session with Ostap (test checklist)

After bot is live, have Vlad send these to verify context:

- [ ] "Привет, что у нас в week-1 плане?"  → should reference `week-1-plan.md` accurately
- [ ] "Какая наша вертикаль?"  → Real Estate, RU-speaking diaspora, foreign property
- [ ] "Какие цвета в бренде?"  → Midnight Navy + Chrome, refs `brand/DESIGN.md`
- [ ] "Я хочу сделать ребрендинг"  → Ostap should push back hard (scope creep, no first client yet)
- [ ] "Давай начнём outreach прямо сегодня"  → Ostap should ask about Calendly/targets/DM readiness first

If any of these fail — context didn't transfer properly.

---

## Skills plan (NOT for migration day — build incrementally)

Do NOT build these on migration day. Build only when a real flow requires tracking.

### Priority 1 (add when first DMs start going out — week 2)
- **outreach-tracker** — log: target name, handle, DM date, reply status, call booked?, notes. CSV or simple markdown table.
- **lead-crm** — lightweight pipeline: Cold → Replied → Call Booked → Call Done → Proposal → Won/Lost

### Priority 2 (add when 3+ research calls completed)
- **call-notes** — templated research call notes with Mom Test structure
- **call-transcript-ingest** — parse raw call transcripts into structured insights (pains, objections, language, pricing signals). This is Ostap's **growing competency** feed — every transcript makes him sharper on real estate.
- **insights-extractor** — pull patterns across calls (common pains, language clients use, objection frequencies)

### Priority 3 (add when content publishing cadence is real)
- **content-scheduler** — generate posts per content-plan, track what's published vs draft
- **content-metrics** — track views/saves/comments on published posts

### Priority 4 (add when first paying client)
- **client-onboarding** — templated kickoff flow
- **finance-tracker** — MRR, per-client revenue, costs, runway calc

### Cron rituals (add after week 2)
- **Morning brief (9am Minsk):** what's in pipeline, today's tasks from week-plan, 1 critical question
- **Weekly review (Sunday evening):** numeric metrics + critical debrief of the week
- **Kill-criteria check (bi-weekly):** which hypotheses validated/invalidated, what to cut

---

## Handoff debt from Kira

Things Kira left half-done that Ostap inherits on day 1:

1. **Calendly not yet set up** — Vlad was about to register. Ostap: remind him day 1.
2. **Parking page HTML not yet generated** — blocked on Calendly link. Ostap: generate as soon as link is ready.
3. **First post not written** — only outline exists. Ostap: draft post 1 as first real work session.
4. **Outreach DM script not drafted** — outline only.
5. **Target list (20 realtors) not collected** — day 3 task.
6. **Email on volat.ai not set up** — deferred; Calendly works without it.

---

## Ostap's first message to Vlad (suggested)

When Ostap goes live, first message should be along these lines:

> ⚒️ Это Остап. Перенос из Киры завершён, весь контекст Volat AI у меня — brand, design, vertical, week-1 plan, content plan.
>
> Я твой ко-фаундер на этом проекте. Роль: критик + оператор. Буду спорить с плохими решениями до того как ты их исполнил, не после.
>
> Состояние на сейчас: day 1 из 7-дневного спринта. Первое дело — Calendly ("Market Research · 15 min"). Зарегал?
>
> Если нет — пойдём делать. Если да — кидай ссылку, пилю parking page.

---

## Open questions for Vlad on day 1

1. **Ostap's visible avatar** — 2D or 3D chrome V? (3D recommended — matches bot vibe of "serious operator")
2. **Telegram handle final choice** — @ostap_bot (if free), or alternative?
3. **Voice mode** — Ostap should have different voice from Kira (male, measured tone). If using ElevenLabs — Kira uses Jessica `cgSgspJ2msm6clMCkdW9`. Ostap candidates: Adam / Antoni (deep male voices). Pick during setup.
4. **Model** — suggest Claude Sonnet or Opus for Ostap (critical thinking quality matters). Can downgrade later if cost becomes issue.

---

## Success criteria for migration

Migration is done when:
- [x] Ostap bot responds in Telegram with correct persona (measured, not snarky)
- [x] Ostap references Volat AI project files correctly (brand, plan, vertical)
- [x] Ostap pushes back on bad ideas (test with "let's make a fancy logo")
- [x] Kira redirects Volat questions to Ostap instead of answering
- [x] No duplicate project files between the two bots
