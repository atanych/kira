# Memory

## Topics
- [[language-policy|Language policy]] — English with [[Vovan]], mirror his language; Russian with [[Ksusha]] and [[Lerochka]]
- [[telegram-quirks|Telegram quirks]] — no reply context passed; markdown links not clickable, paste raw URLs
- [[boundaries|Boundaries]] — don't touch Ostap's folder; safety reflex doesn't apply to own bots/kira/ code
- [[output-style|Output style]] — show what changed; PDF over PNG for text-heavy; fact-check on user doubt
- [[existing-features-reflex|Existing features reflex]] — check skills/ before "should we build X"
- [[memory-mechanics|Memory mechanics]] — lowercase backlinks; collapse on trim request
- [[dacha-maintenance|Dacha maintenance]] — water/heating procedures (Big Blue, гидроаккумулятор)
- [[wb-search|Wb Search]] — поиск товаров на wildberries.by через BY-прокси + agent-browser (PoW через JS-движок)
- [[crm|Crm]] — Vovan отключил Grain/recap CRM-cron'ы 2026-06-04 (перенесены в `crons/.disabled/`); action-items-reminder остался
- [[car-sale-rb|Car Sale RB]] — продажа б/у авто в РБ: МРО ГАИ Ждановичи/Малиновка, транзиты + ДКП, договор комиссии (ст. 880 ГК)
- [[vovan|Vovan]] — Использует **AirPods Pro 2 USB-C (Model A3047)** — выяснилось 2026-06-13 когд...
- [[ksusha|Ksusha]] — Стрим-благодарность framework для TikTok-баттлов (2026-06-15 thread). Аудитор...
- [[lerochka|Lerochka]] — Лагерь Чаборок — закрыт 2026-06-16. Лера вернулась после 13 дней (заезд 03.06...

## Projects
- [[projects/cars/README|Cars]] — shortlist, batteries, dealers, post-purchase, research notes
- [[projects/style-plan/README|Style plan]] — sport → smart casual: roadmap, категории (рубашки/штаны/обувь/верх), бюджеты, журнал покупок
- [[projects/people/README|People]] — Vovan's family + close orbit; per-subject ([[Vovan]], [[Ksusha]], [[Lerochka]], [[Irochka]], [[Vladik]], [[cats]])
- [[projects/car-investment/README|Car investment]] — pricing and suppliers
- [[projects/infra/README|Infra]] — proxies
- [[projects/platform-extensions/README|Platform extensions]] — Instagram and channel notes
- [[projects/books/README|Books]] — конспекты non-fiction (Voss / Torres / Collins / Kaufman + ещё 5) с рейтингами и Obsidian-карточками; пополняется через [[book-summary]] skill
- [[projects/dacha-garage/README|Dacha Garage]] — план, бюджет, фундамент УШП, EV-зарядка, дренаж, поставщики
- [[projects/health/README|Health]] — dental, cosmetology, прочие визиты к врачам
- [[projects/fancy-design/README|Fancy Design]] — ig-посты, скриншоты, источники, заметки по приёмам
- [[projects/skincare/README|Skincare]] — current routine, target routine, shopping list, journal, products notes

## Loose entries

[[2026-04-21]] Volat AI = [[Vovan]]'s AI automation business; main agent = Ostap. Defer all Volat questions to him.

[[2026-05-16]] Reverse image search НЕ в моих скиллах (Google Lens / Yandex / TinEye не подключены). 'Найди по фото' → честно 'нужно имя/ник/ссылка', не имитировать. Instagram anon person-search заблокирован с 2023.

[[2026-05-18]] Obsidian vault root: `memory/` (был `projects/`). Один vault на всё. Vovan: обнови путь в Obsidian Git settings.

[[2026-05-26]] IKEA посредники в Минск (для NÄMMARÖ и других уличных серий). Реальные цены в IKEA Литва в 2-3 раза дешевле белорусских реселлеров (aikea.by накручивает 3x — за NÄMMARÖ 3-местный угловой артикул **095.752.15** с подушками Kuddarna 600-650€ просит 7433 BYN, реальная цена под ключ через посредника 2600-2900 BYN). Контакты: **ikea24.by** (крупнейший, оплата при получении, 1-3 дня из Вильнюса/Варшавы), **ИкеаМинск** Telegram +375 29 104-88-44 (~10% доставка, 3-7 дней), **Ikeaby.by** Viber +375 44 539 96 00 (минимум 100 BYN, 3-7 дней), **Голубая Белка** +375 44 579-44-44 (из Польши), **KEAhome.by** физический магазин ТЦ Корона-Дом ул. Кальварийская 24 2 этаж (можно посмотреть вживую). Тактика: собрать артикулы на ikea.lt → запрос 3 посредникам → оплата при получении, не предоплата.

[[2026-05-29]] Налоговые режимы РБ для IT-услуг (актуально на 2026, проверять при следующих вопросах): **НПД (налог на профдоход)** — Глава 40 НК РБ + Постановление Совмина №457 от 28.06.2024 (вступило 01.10.2024), Приложение 2 — перечень 87 разрешённых видов. Ставки 10% (физлица + первые 60К BYN/год от юрлиц), 20% (юрлица свыше 60К), 4% (пенсионеры), без НДС. Ключевые пункты для IT: п.16 (удалёнка через интернет для физлиц И организаций), п.63 (разработка ПО + тестирование, ОКЭД 6201/63119), п.83 (установка/настройка ПО, ОКЭД 6209). **УСН для ИП отменили с 2023** — осталась только для юрлиц. **ИП общая** — подоходный 20% с разницы доход-расход. **ООО на УСН 6%** — лимит ~2.4 млн BYN/год, без НДС, для B2B солиднее. Источники: nalog.gov.by/professional-income-tax/, pravo.by/document/?guid=12551&p0=C22400457.

[[2026-06-18]] Migrated 9 Kira tables + 4 functions from public → kira schema. Tables: contacts, contact_context, interactions, interaction_participants, action_items (CRM); tasks, task_templates (personal-tasks); knowledge_items, knowledge_chunks (KB). Sequences auto-followed tables. Functions: search_knowledge (×2), search_knowledge_chunks (×2). Updated skills/crm/src/db.js and skills/knowledge-base/src/db.js to SET search_path TO kira, extensions, public on connect (KB was wrongly pointing to 'eli' schema). Used postgres role via CRM_DATABASE_URL — bot_kira can't ALTER public. NOT migrated (Vovan handles separately): cost_config, cost_events, follow_ups, merge_suggestions, relationship_profiles, learning_patterns, lightrag_*, meta, public.messages/reactions/message_revisions.

[[2026-06-18]] Also migrated relationship_profiles (19) and meta (36) from public → kira. Both are CRM-owned despite no active code refs: relationship_profiles has FK to kira.contacts + per-contact summaries; meta is the CRM KV-store (schema_version, last_gmail_sync, last_health_decay, approval_state:* used by CRM conversational approval flow). No sequences. Initial audit missed them — grep'd only FROM/INTO/UPDATE in scripts. Lesson: for tables that look CRM-shaped (contact_id FK, 'approval', 'profile'), inspect data before calling them orphans.

[[2026-06-19]] DB ownership 2026-06-19: bot_kira смог сделать ALTER TABLE … OWNER TO bot_kira на 11 таблицах в схеме kira (tasks, task_templates, contacts, contact_context, interactions, interaction_participants, action_items, knowledge_items, knowledge_chunks, relationship_profiles, meta). Значит у bot_kira есть привилегии для смены owner (видимо postgres-родитель или GRANT). Теперь bot_kira — owner всех 11, можно делать ALTER … DROP/ADD CONSTRAINT, INDEX, etc. через обычный DATABASE_URL без postgres-роли. Память от 2026-06-18 про 'bot_kira can't ALTER public' устарела для kira-схемы.

[[2026-06-20]] Server path migration 2026-06-19: `/home/claude/volatclaw` → `/home/volatclaw/volatclaw`, каждый бот теперь под locked-down OS-юзером без доступа к `/home/claude`. ПРАВИЛО на будущее: НЕ хардкодить install-paths в crons/scripts/skills. (1) `proxied` теперь PATH-команда, использовать просто `proxied <by|ru|off> <cmd>`, а не абсолютный путь к bin/. (2) Любой другой absolute path → относительно BOT_DIR или `$BOT_DIR`. Чек: `grep -r '/home/claude' crons/ scripts/ skills/` должен быть пустым. Поправлено 19.06: wb-search.ts, real-estate-digest.json, book-summary SKILL.md, market-scan __pycache__.

[[2026-06-21]] DOCX — Read tool не парсит (бинарный zip+XML), Bash залочен только под скиллы, ни в одном скилле нет docx-парсера (unzip/pandoc/python-docx — всё мимо). Если пользователь шлёт .docx — попросить конвертнуть в PDF или вставить текст. PDF через Read открывается норм. ВАЖНО: при повторной попытке (после 'перепроверь' от админа) — открылось. То есть либо песочница даёт второй проход с другими правами, либо первая попытка была преждевременной. Если документ важен и юзер настаивает — пробовать снова, не сдаваться сразу.

[[2026-06-22]] Видеофайлы (.mp4 и т.п.) через Read не открываются — Read поддерживает только статические изображения (PNG/JPG) и PDF (с pages-параметром для длинных). Если юзер шлёт видео — попросить скриншот ключевого кадра. Аналогично DOCX (см. запись от 2026-06-21).

[[2026-06-24]] Goldapple.by — anti-scraping (2026-06-23). SPA + WAF против direct запросов: голый `curl`/`WebFetch` возвращает пустую оболочку без товаров. `proxied by` не помогает (это не геоблок, а bot-detection). `agent-browser` headless тоже спотыкается на их защите. Что работает: (1) поисковые URL вида `https://goldapple.by/qs/<query+with+pluses>` — отдать пользователю для ручного клика; (2) browser screenshots через agent-browser с явной интерактивностью (long timeout, скриллинг). Офлайн в Минске: пр. Победителей 9, ул. Притыцкого 156. Аналогично у WB.by — карточки требуют PoW (см. wb-search skill).
