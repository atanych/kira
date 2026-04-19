# Vertical Deep-Dive: Dental Clinics

_Parent: [[verticals]]_

## Who exactly

### RU market
- **Private dental clinics** in Moscow/SPB (3-15 chairs, 5-30 staff)
- **Sweet spot:** owner-operator MD or small 2-3 location chain
- **Not:** big chains like Мастердент, Дент Престиж — procurement committees, 6-month sales cycles
- **Adjacent vertical:** cosmetology clinics (very similar profile, sometimes better fit)

### Diaspora market
- **Premium dental/cosmetology clinics in Dubai, Cyprus, Turkey, Thailand, Belgrade**
- Often target medical tourism from RU speakers
- Higher budgets, multilingual patient intake

## Pain landscape

Ranked by intensity:

1. **Receptionist overload** — one person handling phone + WhatsApp + walk-ins + insurance calls. Missed calls = lost patients.
2. **No-shows killing revenue** — 15-25% no-show rate in many clinics, each empty chair = $100-500 lost.
3. **Lead qualification from ads** — clinic runs Yandex Direct for "имплантация", gets 50 inquiries, 5 serious, wastes hours on tire-kickers.
4. **Post-visit follow-up absent** — no satisfaction check, no review request, no recall for hygiene in 6 months.
5. **Review collection** — Яндекс.Карты / 2GIS rating drives 70% of new patient decisions. Clinics don't systematically collect reviews.
6. **Recall campaigns** — past patients due for checkups are not contacted.
7. **Treatment plan explanation** — patients don't understand X-rays, leave without booking the big procedure.
8. **Insurance pre-screening** — checking ДМС/insurance eligibility eats receptionist time.

## Automation menu

| Use case | Real-time? | Complexity | ROI story |
|---|---|---|---|
| AI receptionist (voice + chat) | Realtime | High | "Handled 200 calls without human, booked 40" |
| No-show reducer (SMS + reschedule flow) | Scheduled | Low | "Dropped no-shows from 22% to 8%" |
| Lead qualifier from ads | Near-realtime | Medium | "Saved 10 hrs/week on tire-kickers" |
| Post-visit follow-up + review request | Scheduled | Low | "Rating went 4.3 → 4.8 in 3 months" |
| Hygienist recall (every 6mo) | Scheduled | Low | "+30 recurring appointments/month" |
| Multilingual patient intake (Dubai) | Realtime | Medium | "Serves RU+EN+AR without extra staff" |
| Treatment plan explainer (bot) | On-demand | Medium | "Patient conversion from consult to procedure +20%" |

## Packaged offer options

### Offer A: "No-Show Reducer" ⭐ BEST ENTRY
**What:** SMS/WhatsApp reminder sequence 48h/24h/2h before appointment. Easy one-tap reschedule. Escalates to receptionist only if patient asks.

- Setup: **$1,500**
- Monthly: **$200-300**
- Delivery: 7 days
- **Why best entry:** low complexity, fast ROI, clean case study ("no-shows dropped X%")
- **Best fit:** any clinic with >10% no-show rate (most)

### Offer B: "AI Receptionist"
**What:** Voice agent + chat bot on website + WhatsApp. Handles booking, FAQ, reschedules, insurance pre-screening. Escalates complex cases to humans.

- Setup: **$3,000-5,000**
- Monthly: **$500-800** (voice minutes + AI costs pass-through)
- Delivery: 21-30 days
- **Best fit:** clinics losing calls (measure how many missed calls/week, that's the hook)
- **Warning:** high-stakes when it breaks, real support burden

### Offer C: "Patient Retention Engine"
**What:** Post-visit review requests, hygiene recall campaigns, past-patient reactivation, birthday messages.

- Setup: **$2,000**
- Monthly: **$300-500**
- Delivery: 10-14 days
- **Best fit:** established clinics with past-patient database

## Pricing by market

| Tier | Setup | Monthly |
|---|---|---|
| RU Moscow clinic | $1.5k-3k | $300-600 |
| Dubai/Cyprus premium clinic | $3k-5k (USD) | $600-1000 |

Full $15k/mo target: harder here — longer sales cycles, but higher tickets. 3-5 diaspora + 2-3 RU realistic.

## Access path

**Hardest of the three verticals.** Clinic owners don't hang out in public TG.

**RU:**
- Dental conferences (Dental Expo Moscow, Стомпорт, СтАР — профессиональные ассоциации)
- Cold calls/emails to clinic directors (small clinics, director = buyer)
- Partnerships with dental equipment/supply companies (they sell to clinics already)
- Facebook/Instagram ads targeted at "owner of dental clinic" lookalike
- Paid listings in dental industry media (Startsmile, Stomatologi.pro)

**Diaspora:**
- LinkedIn for clinic directors in Dubai/Cyprus
- Dental tourism conferences
- Direct partnerships with medical tourism agencies
- Google Ads targeted at dental clinic owners

**First-client math:** tougher. Realistic: 50 outreach → 3-5 serious conversations → 1-2 pilots. Takes 3-4 weeks, not 1.

## Unit economics

Time estimate for Offer A first delivery: **25-35 hrs** (simplest offer).
After SOP (client #3+): **10-15 hrs**.

Offer B (AI Receptionist) is different — **80-100 hrs** first build, **30-40 hrs** client #3+.

Margin math (Offer A, RU pricing):
- Revenue: $1,500 + $250/mo
- Time at client #5: 12 hrs
- Effective rate: ~$125/hr
- Infra: ~$30/mo (SMS + AI)
- Net: solid

Offer B math (diaspora pricing):
- Revenue: $4,000 + $700/mo
- Time at client #5: 35 hrs
- Effective rate: ~$115/hr
- Infra: ~$200/mo (voice minutes)
- Net: solid but support burden is real

## Risks

### Market / regulatory
- **ФЗ-152 (patient data)** — patient PII is regulated in RU. Must comply or avoid touching PHI. Legal risk.
- **HIPAA-equivalent in diaspora** (especially Dubai Health Authority, EU GDPR for Cyprus) — even more serious.
- **Advertising rules** — medical advertising restricted in RU (Реклама Закон №38-ФЗ). You can't make promises about outcomes in content.
- **Liability** — if your bot tells a patient wrong info about treatment, legal exposure for the clinic AND potentially you. Scope clearly: bot NEVER gives medical advice.

### Client
- **Dentist is not tech-savvy buyer** — long education cycle, many objections
- **Procurement via office manager usually**, not direct to MD owner
- **Slow to sign, slower to pay** (medical offices are conservative on cash flow)
- **Fear of losing "personal touch"** — big psychological objection to receptionist bot

### Execution
- **Integration with dental PMS** (Denta, Инфодент, Айдентика, StomX) — every clinic uses different software, APIs are hostile or absent
- **Real-time voice breaks catastrophically** — if receptionist bot fails at 9am Monday, clinic loses a day of appointments. Your phone rings.
- **Voice quality matters hugely** — patients will hang up on robotic voices. Need top-tier TTS (ElevenLabs).
- **Insurance rules change** — ОМС/ДМС logic is complex and shifts.

## Content angles (YT)

- "Как AI-ресепшн увеличил записи в клинике на 40%"
- "Почему 20% пациентов не приходят и как это исправить"
- "Разбор: клиника X внедрила AI за 2 недели"
- Less mass-market than e-commerce/real estate — clinic owner audience is smaller
- **Better for LinkedIn/Facebook than YT** — where clinic owners actually hang out
- Case studies powerful but hard to film (patient privacy)

## First 3 clients plan

Week 1:
- Identify 30 small private dental clinics in Moscow with bad reviews/missing phone (signal of receptionist overload)
- Cold email/call clinic director (not receptionist) with hook: "Сколько звонков вы теряете в неделю? Могу прислать отчёт, если интересно."
- Book 3-5 discovery calls

Week 2-3:
- Pilot 2-3 founding clinics at $750-1000 (from $1.5k list) for **Offer A only** — no-show reducer
- Deliver, measure no-show rate before/after
- Get owner's video testimonial with numbers

Week 4-6:
- Post case study (numbers-heavy, low-drama)
- Use first wins to upsell Offer B (AI Receptionist) to same clients

## Decision criteria (when to commit / when to kill)

**Commit if:**
- 50 outreach → 3+ serious calls (clinic directors, not receptionists)
- 1 pilot closes within 3 weeks
- No-show reducer delivers measurable drop in first 30 days

**Kill if:**
- Outreach dies at receptionist gatekeeping — can't reach decision maker
- ФЗ-152 compliance requirements balloon the project
- Clinic integration (PMS) work proves non-productizable

## Kira's take

Highest willingness to pay ($1.5-5k tickets). Most complex vertical to execute. Slowest to first revenue.

**Worth it if:**
- You have any personal connection to a clinic owner (friend, family, current patient somewhere) — cuts sales cycle from 6 weeks to 1 week
- You're willing to lead with the BORING offer (Offer A, no-show reducer) instead of the exciting one (AI receptionist)

**Dangerous if:**
- You pick Offer B (Receptionist) as your first offer. You'll build for 2 months, support will crush you, case study will be mediocre. Don't.
- You ignore ФЗ-152 / regulatory constraints.
- You have no clinic connections and expect cold outreach to work in week 1.

**Best offer to lead with:** Offer A (No-Show Reducer). Simple, fast ROI, easy to measure, lowest support burden.

Honest caveat: this is **real-time work** with high consequence for failure. On-call risk is highest of the three verticals. You dropped the async rule — this is where that decision gets tested.
