# Decision Log

_Dated, final decisions. If a decision gets reversed, strike it and add a new entry — don't delete._

---

## 2026-04-18

### Business model: Productized service + YT funnel
Rejected: SaaS (too slow to revenue), pure consulting (no authority), pure agency (time-for-money trap).
See [[plan]].

### Market: RU SMB (Moscow/SPB) + CIS diaspora
Rejected: BY domestic (WTP too low), US/EU native (trust/compliance uphill), regional RU (prices drop).
See [[market]].

### Revenue target: $15k/mo
Medium-term. This replaces archive.com income.

### Time budget: 20-30 hrs/week
Alongside archive.com tech lead role. Not a side hustle — serious commitment.

### Payment rails: Phase 1 = Deel/SWIFT to BY card
Already working for Vovan. Phase 2 trigger: Georgia ИП at $5k/mo, OR client refuses BY, OR Deel fees eat margin.

### YT derisked
6k subs on UFC 5 channel = craft is handled. New AI channel starts at zero subs, ~6-12mo before meaningful leads.
See [[youtube]].

### Async-only delivery rule: DROPPED
Vovan okay with real-time customer-facing offers (receptionist bots, live support, booking agents). Accepts on-call duty risk. Reopens clinic/fitness/car service use cases that were gated before. Scoring rebalanced in [[verticals]].

### Vertical: REAL ESTATE ✅
Picked. Focus on RU-speaking diaspora realtors selling Dubai/Cyprus/Georgia/Turkey property. Lead offer: AI Lead Qualifier ($2-3k setup + $400-600/mo). See [[verticals/real-estate]].

Rejected for now: e-commerce (too commoditized to start), dental clinics (slow sales, regulatory), others (lower overall score).

---

### CRM integration: pick per-client
Vovan has HS + AmoCRM experience, comfortable with any CRM. First customer's CRM becomes the integration. No premature standardization.

---

## 2026-04-19

### Brand: Volat AI ✅
Locked after extensive brainstorm (Atanoff surname-style → Kova → BY-words shortlist → Volat).

**Why Volat AI:**
- Волат (вол́ат) — древний великан-герой из беларуских мифов (уникально BY, не Slavic-общее)
- Built-in founder story: "древние великаны в одиночку поднимали камни — наш AI даёт одному силу команды"
- Sellable (no founder-attachment — брeнд ≠ Vladimir Atanau)
- Короткое (5 букв), произносимое EN
- Scalable за пределы real estate (не запирает нишу)

**Rejected alternatives:**
- ~~Atanoff~~ — Tinkoff-style, but surname-based = не sellable long-term
- ~~Kova~~ — heykova.com (AI automation agency) занимает точно наш namespace
- ~~Ruh~~ — ruh.ai делает "AI employees for sales/marketing/ops" (наше позиционирование 1-в-1)
- ~~Zorka~~ — zorka.agency в Кипре (наш target market)
- ~~Plyn~~ — Plynk investing + pronunciation friction

**Volat trade-offs accepted:**
- SEO коллизия с MZKT на root "Volat" keyword — решено позиционированием как **Volat AI** (чистый sub-namespace)
- Санкционный риск MZKT = нулевой юридически (разные Nice-классы), минимальный optically для SMB клиентов

### Domain: volat.ai ✅
WHOIS-проверка 2026-04-19: свободен.

**Registrar: Namecheap** (consolidate с уже существующим UFC 5 mobile-app доменом Vovan'а — один биллинг / 2FA / менеджмент).

**DNS: Cloudflare** (free plan).
- Namecheap → Nameservers → Custom DNS → 2 NS от Cloudflare
- Причина: Cloudflare DNS нужен для Email Routing (см. ниже), плюс бесплатный SSL и CDN на будущее

**Upsell'ы Namecheap при регистрации — ВСЕ отказываем:**
- ❌ PremiumDNS (будем на Cloudflare)
- ❌ SSL от Namecheap (Cloudflare даёт free)
- ❌ Email Hosting от Namecheap (у нас Cloudflare Email Routing)
- ❌ VPN / backup

**Обязательно ON:**
- ✅ Auto-Renew
- ✅ Domain Privacy (бесплатный)

Note: .ai регистрируется минимум на 2 года (правило Identity Digital) — единовременный charge ~$160-180.

Rejected альтернативы:
- ~~Porkbun~~ — дешевле на $10-20/год, но создаёт 2-й аккаунт при том что Namecheap уже используется
- ~~Cloudflare Registrar~~ — самый дешёвый и one-stop shop, но workflow требует сначала завести домен где-то ещё, а у Vovan Namecheap уже готов

### Handle: @volatai (единый везде)
- @volat занят на YouTube + GitHub (dormant)
- @volatai свободен на YouTube + GitHub (проверено)
- @volatai на Instagram + X — Vovan проверяет вручную
- YouTube/GitHub handles не поддерживают точку → `volatai` без точки
- Display name везде: "Volat AI" (с пробелом)

### Legal identity separation
- **Brand:** Volat AI
- **Founder (legal):** Vladimir Atanau (паспорт BY)
- **Founder (public-facing):** Vlad / Влад
- В видео/DM: "Это Volat AI, я Влад"
- "Вован" оставляем только для gaming-канала (GG Вован) и личного круга

### Product = "Volat" (AI-агенты) ✅
**Volat AI не продаёт "автоматизацию" или "консалтинг". Volat AI продаёт Volats.**

- **Volat (ед.)** = один AI-агент, выполняющий работу человека (или отдела) в бизнесе клиента
- **Volats / Волаты (мн.)** = несколько агентов у одного клиента (squad)
- **Volat AI (компания)** = мы, те кто эти Volat'ы строят и обслуживают

Клиент не "покупает проект автоматизации" — он **нанимает волатов**. Это language shift из service-бизнеса в product-like модель (при сохранении non-SaaS delivery).

Примеры продуктовых названий: Lead Volat, Viewing Volat, Content Volat, Review Volat, Booking Volat (по задачам, не по отраслям).

### Vertical focus: Real Estate only (V1)
**Все Volat'ы которые мы строим в V1 — для риелторов / агентств недвижимости (RU-speaking диаспора: Dubai/Cyprus/Georgia/Turkey).**

Другие вертикали (e-commerce, dental clinics, fitness, и т.д.) — **в бэклоге на V2+**. Не распыляемся до момента когда в Real Estate:
- 5+ платящих клиентов
- Retention 6+ месяцев
- Стандартизованы 2-3 типа Volat'ов с воспроизводимым setup

Только тогда открываем вторую вертикаль. См. [[verticals]] для бэклога.

### Email hosting: Cloudflare Email Routing (V1) → Google Workspace (later) ✅

**V1 (pre-launch + first clients): Cloudflare Email Routing** — $0.
- DNS на Cloudflare (free plan)
- Email Routing создаёт адреса `vlad@volat.ai`, `hello@volat.ai`, `sales@volat.ai`, `*@volat.ai` catch-all
- Все письма forward на личный Gmail Vovan'а
- Отправка: Gmail "Send mail as" через SMTP relay (Resend free / Brevo free)
- Плюс: unlimited addresses, 5-мин setup, deliverability Cloudflare
- Минус: нет отдельного inbox (всё в личном Gmail, фильтруем правилами)

**Триггеры для перехода на Google Workspace ($6/user/mo):**
- [ ] Появился 1-й сотрудник в команде Volat AI
- [ ] Revenue ≥ $3-5k/mo стабильно
- [ ] Клиент на сделке $10k+ запросил Google Meet / Drive collab
- [ ] Или объём почты превысит удобство фильтров в личном Gmail

Rejected альтернативы:
- ~~Zoho Mail Free~~ — нет IMAP на free tier, слабый UX
- ~~Migadu $19/год~~ — overkill пока Cloudflare хватает
- ~~Yandex 360~~ — negative perception у диаспоры (санкции/политика), слабая deliverability в Gmail international

### Tech stack: decision deferred
Рассмотрели n8n (отвергнуто — workflow paradigm устарел для наших задач) и Claude Agent SDK / TypeScript (предложено, но не locked).

**Решение по стеку откладываем** до момента когда будем реально строить первого Volat'а с клиентом. Сейчас фокус на go-to-market: offer, outreach, discovery, first paying customer.

---

## Pending

Decisions we need to make soon:
- [ ] **First offer lock** — finalize name, scope, price in [[offer]] for AI Lead Qualifier
- [ ] **Founding client pricing** — $1.5k pilot vs other structure
- [ ] **Outreach message** — draft the Instagram DM pitch
- [ ] **First 20 targets** — identify specific RU-speaking realtors in Dubai/Cyprus
- [ ] **YT positioning** — "AI для риелторов" niche vs broader
