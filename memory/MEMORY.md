# Memory

## Topics
- [[language-policy|Language policy]] — English with [[Vovan]], mirror his language; Russian with [[Ksusha]] and [[Lerochka]]
- [[telegram-quirks|Telegram quirks]] — no reply context passed; markdown links not clickable, paste raw URLs
- [[boundaries|Boundaries]] — don't touch Ostap's folder; safety reflex doesn't apply to own bots/kira/ code
- [[output-style|Output style]] — show what changed; PDF over PNG for text-heavy; fact-check on user doubt
- [[existing-features-reflex|Existing features reflex]] — check skills/ before "should we build X"
- [[memory-mechanics|Memory mechanics]] — lowercase backlinks; collapse on trim request
- [[dacha-maintenance|Dacha maintenance]] — water/heating procedures (Big Blue, гидроаккумулятор)
- [[wb-search|Wb Search]] — Скилл готов: поиск товаров на wildberries.by через BY-прокси + agent-browser....
- [[vovan|Vovan]] — Проходит курсы Anthropic Prompting / Building Agents (2026-05-31 спросил про...
- [[lerochka|Lerochka]] — Лагерь — едет в среду 03.06.2026 в лес на 12 дней с ночёвкой. Также: новый ни...
- [[ksusha|Ksusha]] — Волосы — диффузное выпадение давно (несколько лет). Не хочет миноксидил/амине...

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

## Loose entries

[[2026-04-21]] Volat AI = [[Vovan]]'s AI automation business; main agent = Ostap. Defer all Volat questions to him.

[[2026-05-05]] Чтобы добавить пользователя в Telegram `allowedUsers` — нужен numeric user ID, не имя. Стандартный путь: попросить написать боту @userinfobot, он пришлёт ID. Без ID не добавлять.

[[2026-05-16]] Reverse image search НЕ в моих скиллах (Google Lens / Yandex / TinEye не подключены). 'Найди по фото' → честно 'нужно имя/ник/ссылка', не имитировать. Instagram anon person-search заблокирован с 2023.

[[2026-05-18]] Obsidian vault root: `memory/` (был `projects/`). Один vault на всё. Vovan: обнови путь в Obsidian Git settings.

[[2026-05-20]] Telegram config.json для kira ограничение чатов идёт через ключ `allowedChats` (не `allowedGroups`). [[Vovan]] поправил 2026-05-19, было "unknown key" при старте.

[[2026-05-26]] IKEA посредники в Минск (для NÄMMARÖ и других уличных серий). Реальные цены в IKEA Литва в 2-3 раза дешевле белорусских реселлеров (aikea.by накручивает 3x — за NÄMMARÖ 3-местный угловой артикул **095.752.15** с подушками Kuddarna 600-650€ просит 7433 BYN, реальная цена под ключ через посредника 2600-2900 BYN). Контакты: **ikea24.by** (крупнейший, оплата при получении, 1-3 дня из Вильнюса/Варшавы), **ИкеаМинск** Telegram +375 29 104-88-44 (~10% доставка, 3-7 дней), **Ikeaby.by** Viber +375 44 539 96 00 (минимум 100 BYN, 3-7 дней), **Голубая Белка** +375 44 579-44-44 (из Польши), **KEAhome.by** физический магазин ТЦ Корона-Дом ул. Кальварийская 24 2 этаж (можно посмотреть вживую). Тактика: собрать артикулы на ikea.lt → запрос 3 посредникам → оплата при получении, не предоплата.

[[2026-05-29]] Налоговые режимы РБ для IT-услуг (актуально на 2026, проверять при следующих вопросах): **НПД (налог на профдоход)** — Глава 40 НК РБ + Постановление Совмина №457 от 28.06.2024 (вступило 01.10.2024), Приложение 2 — перечень 87 разрешённых видов. Ставки 10% (физлица + первые 60К BYN/год от юрлиц), 20% (юрлица свыше 60К), 4% (пенсионеры), без НДС. Ключевые пункты для IT: п.16 (удалёнка через интернет для физлиц И организаций), п.63 (разработка ПО + тестирование, ОКЭД 6201/63119), п.83 (установка/настройка ПО, ОКЭД 6209). **УСН для ИП отменили с 2023** — осталась только для юрлиц. **ИП общая** — подоходный 20% с разницы доход-расход. **ООО на УСН 6%** — лимит ~2.4 млн BYN/год, без НДС, для B2B солиднее. Источники: nalog.gov.by/professional-income-tax/, pravo.by/document/?guid=12551&p0=C22400457.
