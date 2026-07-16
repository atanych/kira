# Memory

## Topics
- [[language-policy|Language policy]] — English with [[Vovan]], mirror his language; Russian with [[Ksusha]] and [[Lerochka]]
- [[telegram-quirks|Telegram quirks]] — no reply context passed; markdown links not clickable, paste raw URLs
- [[boundaries|Boundaries]] — don't touch Ostap's folder; safety reflex doesn't apply to own bots/kira/ code; no hardcoded /home/claude paths
- [[output-style|Output style]] — show what changed; PDF over PNG for text-heavy; fact-check on user doubt
- [[existing-features-reflex|Existing features reflex]] — check skills/ before "should we build X"
- [[memory-mechanics|Memory mechanics]] — lowercase backlinks; collapse on trim request
- [[dacha-maintenance|Dacha maintenance]] — water/heating procedures (Big Blue, гидроаккумулятор)
- [[wb-search|Wb Search]] — поиск товаров на wildberries.by через BY-прокси + agent-browser (PoW через JS-движок)
- [[crm|Crm]] — Vovan отключил Grain/recap CRM-cron'ы 2026-06-04 (перенесены в `crons/.disabled/`); action-items-reminder остался
- [[car-sale-rb|Car Sale RB]] — продажа б/у авто в РБ: МРО ГАИ Ждановичи/Малиновка, транзиты + ДКП, договор комиссии (ст. 880 ГК)
- [[file-format-limits|File format limits]] — Read parses PNG/JPG/PDF only; .docx retry-once, video → screenshot
- [[sip-voice-agent|SIP voice agent]] — 4 Колёса outbound POC: LiveKit direct INVITE, digest auth, Haiku 4.5 latency budget
- [[embeddings|Embeddings]] — Embeddings landscape 2025-26. **Dense** (один вектор фикс. размера) — sentenc...
- [[self-review|Self Review]] — Дыры в self-review SKILL.md (обнаружены Vovan'ом 2026-07-12): (1) **memory-me...

## Projects
- [[projects/cars/README|Cars]] — shortlist, batteries, dealers, post-purchase, research notes
- [[projects/style-plan/README|Style plan]] — sport → smart casual: roadmap, категории (рубашки/штаны/обувь/верх), бюджеты, журнал покупок
- [[projects/people/README|People]] — Vovan's family + close orbit; per-subject ([[Vovan]], [[Ksusha]], [[Lerochka]], [[Irochka]], [[Vladik]], [[cats]])
- [[projects/car-investment/README|Car investment]] — pricing and suppliers
- [[projects/infra/README|Infra]] — proxies
- [[projects/platform-extensions/README|Platform extensions]] — Instagram and channel notes
- [[projects/books/README|Books]] — конспекты non-fiction (Voss / Torres / Collins / Kaufman + ещё 5) с рейтингами и Obsidian-карточками; пополняется через [[book-summary]] skill
- [[projects/dacha-garage/README|Dacha Garage]] — план, бюджет, фундамент УШП, EV-зарядка, дренаж, поставщики
- [[projects/health/README|Health]] — dental, cosmetology, прочие визиты + pharmacy reference
- [[projects/fancy-design/README|Fancy Design]] — ig-посты, скриншоты, источники, заметки по приёмам
- [[projects/skincare/README|Skincare]] — current routine, target routine, shopping list, journal, products notes

## Loose entries

[[2026-05-16]] Reverse image search НЕ в моих скиллах (Google Lens / Yandex / TinEye не подключены). 'Найди по фото' → честно 'нужно имя/ник/ссылка', не имитировать. Instagram anon person-search заблокирован с 2023.

[[2026-06-24]] Goldapple.by — anti-scraping (2026-06-23). SPA + WAF против direct запросов: голый `curl`/`WebFetch` возвращает пустую оболочку без товаров. `proxied by` не помогает (это не геоблок, а bot-detection). `agent-browser` headless тоже спотыкается на их защите. Что работает: (1) поисковые URL вида `https://goldapple.by/qs/<query+with+pluses>` — отдать пользователю для ручного клика; (2) browser screenshots через agent-browser с явной интерактивностью (long timeout, скриллинг). Офлайн в Минске: пр. Победителей 9, ул. Притыцкого 156. Аналогично у WB.by — карточки требуют PoW (см. [[wb-search]] skill).

[[2026-07-02]] НПД РБ обновления 2026. **С 01.07.2026 введён минимальный НПД 45 BYN/мес** для всех плательщиков (18 для пенсионеров) — платить даже если дохода в месяце не было. Не платишь 3 раза подряд → автоматически снимают статус НПД (восстановить можно через 6 мес). 24 месяца без активности → снимают автоматически. **Аренда нежилого помещения (п.27 Прил.2 Постановления №457) — ограничение:** физлицо на НПД может сдавать **ТОЛЬКО ОДИН объект ИЛИ ОДНУ ЧАСТЬ одного объекта одновременно**. Больше — обязательно ИП (подоходный 20% с разницы доход-расход). **Возмещение коммуналки** арендаторами больше не облагается НПД если прописано ОТДЕЛЬНЫМ пунктом в договоре (не включено в арендную плату) — важный лайфхак для экономии. Ставки НПД без изменений: 10% (физлица + первые 60К BYN/год от юрлиц), 20% (юрлица свыше 60К), 4% (пенсионеры). Глава 40 НК РБ + Постановление Совмина №457 от 28.06.2024 (Приложение 2 — перечень 87 разрешённых видов). Ключевые пункты для IT: п.16 (удалёнка через интернет для физлиц И организаций), п.63 (разработка ПО + тестирование, ОКЭД 6201/63119), п.83 (установка/настройка ПО, ОКЭД 6209). Источники: nalog.gov.by/professional-income-tax/, pravo.by/document/?guid=12551&p0=C22400457.

[[2026-07-07]] Ювелирка в Турции — правило торга и оценки (2026-07-06 для Ksusha). **4C бриллиантов:** Carat (вес, 1 карат = 0.2г, цена прыжками на 'круглых' цифрах), Cut (Excellent > VG > Good > Fair — плохая огранка режет цену в 2-3×), Color (D-F бесцветный премиум, G-J оптимум цена/качество, K+ желтит), Clarity (FL/IF безупречный, VS1-VS2 реалистичный оптимум, I3 видны включения). Сертификат обязателен — **GIA (топ) / IGI / HRD**. Цены 2026: 0.5к VS1/G/EX = $1.5-2.5К, 1.0к = $6-9К, 2.0к = $25-40К. **Пробы на металле (внутри кольца):** 585 = 14К золото (стандарт РБ/Турции), 750 = 18К премиум, 375 = 9К низкая, GP/буквы = позолота (не золото). **Фианит (cubic zirconia) ≠ бриллиант:** себестоимость $5-30, мутнеет и царапается со временем, в сертификатах не оценивается. При покупке кольца с фианитом — платите только за металл+работу. **Турция:** всегда торговаться, стартовая цена +20-40% сверху. Тактика: улыбка → 'слишком дорого' → предложить -30% → уходить медленно (догонят с -15-20%). Тур-магазины при отелях = цены в 2× выше. Красные флаги: отказ показать пробу, кольцо невесомое (позолота), 'настоящий бриллиант за $300' (исключено). Известный дизайн: Tiffany Schlumberger Sixteen Stone — крестики золото жёлтое+белое, оригинал $5-8К, реплика в 585 в Турции $400-800.

[[2026-07-12]] Sony наушники WF-1000XM5 / WH-1000XM5 — переключение языка voice guidance: Sony Headphones Connect (приложение) → System → Voice guidance. Хард-ресет если приложение не видит: WF-1000XM5 в кейсе зажать обе сенсорки 10 сек, WH-1000XM5 — power+NC 7 сек. Bluetooth-дропы: (1) кривые прошивки — Update в приложении, (2) multipoint (телефон+ноут одновременно) выключить, (3) LDAC → Priority on stable connection или переключить на AAC.

[[2026-07-12]] Мокрая купюра ($100 в море/бассейне) — как высушить. (1) Ополоснуть в чистой пресной воде, чтобы соль/хлор смыть — иначе кристаллизуются и покорёжат. (2) Промокнуть между бумажными полотенцами (прикладывать, не тереть). (3) Плашмя между двух листов бумаги. (4) Сверху стопка тяжёлых книг на ночь / до суток. **НЕ:** фен на горячем (краска поплывёт), микроволновка (металлические волокна искрят), утюг напрямую (только через ткань на минимуме). $100 из хлопково-льняной ткани — переживёт. На пляже без пресной: солнце в тени (не палящее), не на голом песке; лучше потратить 100мл питьевой на ополаскивание.

[[2026-07-12]] Турецкие орехи — ключевые слова на пакете. `tuzsuz` = без соли. `çiğ` = сырые. `kavrulmuş` = жареные. `kuru yemiş` = сухофрукты/орехи (общая категория). `spesiyal kokteyl` = премиум-микс (миндаль, фисташки, лесной орех, кешью). Если ничего не написано — по дефолту жареные солёные. Бренд Çerezya — турецкий premium. Также: `beyaz leblebi` = белый леблеби (жареный сухой нохут, классический снек), `sarı leblebi` = жёлтый леблеби.

[[2026-07-15]] Sony WH-1000XM5 уход. **Оголовье soft-touch пластик** — пятна от ягод/варенья: мицеллярка (косметическая) → изопропил 70% (тест на незаметном участке 10 сек) → перекись 3% из аптеки + sun bleaching (антоцианы разрушаются УФ, 2-3ч на балконе). НЕ сода/зубная паста (царапают матовое), НЕ меламиновая губка (сотрёт покрытие), НЕ жирочиститель (щёлочь размягчает soft-touch). **Амбушюры (кожзам + memory foam) — типичная болячка XM5 'peeling' на 2-3 год.** Уход: микрофибра почти сухая + капля жидкого мыла для рук / детского шампуня, круговыми без нажима, потом сухой микрофиброй. Точечно можно изопропил 70% ватной палочкой, быстро. НЕ спирт/влажные салфетки на подушки (кожзам треснет за месяц), НЕ замачивать. Профилактика: кондиционер для кожи Colonil / Furniture Clinic (обувной ~10 BYN) или детский крем без отдушек раз в 2-3 мес. Сменные амбушюры 0-15 на Aliexpress (protein leather), оригинал Sony $40-50, меняются за 5 мин по периметру клипсы.

[[2026-07-15]] PS5 залипший фиолетовый переходный экран с частицами при выборе профиля — классика после долгого перерыва (сессия PSN протухла). По порядку: (1) отключить интернет на консоли (LAN/WiFi) → залогинится офлайн → потом включить сеть; (2) hard reboot — power на консоли 10 сек до второго бипа, полное выключение, включить снова; (3) Safe Mode — power зажать до второго бипа при выкл (~7 сек), геймпад по кабелю, пункт **5 Rebuild Database** (данные и игры не трогает, только чинит индекс, 10-30 мин). В 80% случаев помогает п.1.
