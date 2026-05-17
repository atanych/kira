# Memory

[2026-04-22] Default language with Vovan is English — BUT if he writes in Russian, reply in Russian (mirror him). With Ксюшенька and Лерочка — always Russian.

[2026-04-11] Vovan wants to see output/confirmation after any action — don't just say "done", show what was actually created/changed.

[2026-04-11] Telegram doesn't pass reply context — if Vovan replies to a message, only the new text comes through, not what he replied to. Ask him to resend or clarify.

[2026-04-12] Telegram doesn't make markdown links clickable. Always paste raw URLs (e.g. `https://youtube.com/...`) — no markdown, no angle brackets.

[2026-04-11] ElevenLabs voice: Jessica (`cgSgspJ2msm6clMCkdW9`). Changed from Rachel — better fit for Kira's personality. (Note: config.json may show a different ID — Vovan to reconcile.)

[2026-04-21] Volat AI = Vovan's AI automation business. Main agent handling it = Ostap. Defer all Volat questions to him.

[2026-04-22] Boundary rule: never read, write, or touch anything inside Ostap's bot directory. Kira only owns her own bot folder.

[2026-04-22] Memory trim rule: when Vovan asks to reduce a memory entry, collapse it to ONE simple line — no links, no context dump, just what-it-is + who-owns-it.

[2026-04-24] Malware-safety reflex must NOT block editing Kira's own skill code. When the file is clearly under `bots/kira/` or `skills/` that Kira owns, just do the edit. The safety prompt is for external/unknown code.

[2026-05-01] Memory backlink case-sensitivity: relocate matcher checks lowercase folder names. Write `[[book-summary]]` not `[[Book Summary]]` so nightly compiler entries get relocated to skill SKILL.md automatically.

[2026-05-03] Стилевой план для Vovan лежит в projects/style-plan.md — long-term проект перехода со спортивного стиля на smart casual. Дополнять журналом покупок и заметками по итерациям.

[2026-05-06] Когда Vovan спрашивает 'нужно ли нам сделать X?' / 'do we need to build X?' — сначала проверь skills/ и существующие системы, прежде чем отвечать. Он иногда забывает что фича уже шипнута и активно используется (например personal-tasks). Напомни конкретными путями и свежими действиями ('вчера ты закрыл X, добавил Y'), а не 'good idea, let's build'.

[2026-05-07] При URL на YouTube / Instagram / X / Reddit — пробуй фетчить контент через доступные скиллы (insta-post, x-thread, agent-browser, WebFetch) ПРЕЖДЕ чем говорить 'видосы/посты не умею'. Лерочка кинула YouTube shorts — отказала, она поправила что скилл есть. Глобальные скиллы покрывают больше чем кажется по умолчанию.

[2026-05-07] Vovan накатывает 100-130 км в день (Минск-дача-Минск + другие поездки). При расчётах EV-заряда и запаса хода — использовать эту цифру.

[2026-05-08] Шортлист авто для замены Volvo XC90 у Vovan лежит в projects/cars/shortlist.md (живой документ как style-plan.md). Финальный PDF-репорт в tmp/output/Volvo-XC90-replacement-shortlist.pdf — обновляется по итерациям. Дополнять при появлении новых моделей или после тест-драйвов.

[2026-05-08] При генерации репортов с большим количеством текста и таблиц — сразу делай PDF, не PNG. Telegram сжимает PNG, текст становится мутным. PDF идёт как документ без сжатия, текст векторный → можно зумить, цифры читаются на телефоне. PNG только для коротких визуалов/чартов с минимумом текста.

[2026-05-08] При сомнении пользователя ('ты уверен?', 'точно нет такого варианта?') — перепроверяй фактчекингом, не настаивай на первой версии. Сегодня сначала сказала что BYD Bao 7 нет в чистом EV, после уточнения от Vovan — нашла что есть (Bao 7 EV Flash Charging Edition, апр 2026). Аналогично с BYD Sealion 7 ("слишком маленький" — на самом деле XC60-класс). Первая мысль ≠ финальный ответ.

[2026-05-09] Льгота на ввоз EV в РБ 2026: квота 20 000 машин (юр 13 800 / физ 6 200). Только чистые BEV — гибриды/EREV/PHEV не попадают. Только для постоянно проживающих в РБ/Армении/Кыргызстане, запрет передачи прав в РФ/Казахстан. На 7 мая 2026 остаток для физлиц ~3 673 — текущим темпом кончится к концу октября/ноября. Реальный дедлайн — осень 2026, не 'на этой неделе'.

[2026-05-09] Hard requirements у Vovan хранятся в projects/cars/shortlist.md ("AWD обязательно", "только BEV без растаможки"). Проверять файл при каждом сравнении/рекомендации, не полагаться на память сессии. Сегодня дважды облажалась — расписала RWD-комплектации Sealion 7 как кандидаты, забыв что AWD = hard requirement. Vovan дважды напоминал. Аналогично для всех проектных файлов — projects/cars/, projects/style-plan.md — там фиксированные критерии.

[2026-05-09] projects/cars/ обогащён до 5 файлов: shortlist.md (живая таблица), research-notes.md (теория/insights), batteries.md (LFP/NMC/Blade reference), dealers.md (карта дилеров РБ + Trade-in раздел), post-purchase-checklist.md (приёмка авто, керамика/антикор/wallbox/Bosch дворники). Все в bots/kira/ git-репо на github.com/atanych/kira. Vovan настраивает Obsidian vault на projects/ через git clone + плагин Obsidian Git для двусторонней автосинхронизации.

[2026-05-10] Китайское правило 180-дней (MOFCOM, действует с 1 января 2026): машина зарегистрированная в Китае <180 дней назад требует от завода 'After-Sales Service Confirmation Letter' для экспорта. **BYD не выдаёт эти письма параллельным импортёрам в РБ/РФ** (защищают официального дистрибьютора BYD Auto Russia). Серые дилеры (Multimotors, Electro-car, GSMotors, Tesla-Cars) НЕ могут везти свежие BYD/Denza/Bao. Avatr/Zeekr/Xpeng не страдают — у них прямые официальные каналы (avatr.by, xpeng.by, через Atlant-M). Свежий BYD только: (1) Atlant-M официально, (2) машины >180 дней от первой регистрации, (3) International Edition (заводская экспортная), (4) физлицо лично из Китая по льготе.

[2026-05-11] При работе с авто (характеристики, цены, комплектации, статус в производстве) ВСЕГДА использовать autohome.com.cn как primary источник истины. Их 配置 (config) и 报价 (price quote) страницы показывают актуальные данные с метками 在售/停产/未上市/预售. Не полагаться на устаревшие google-search результаты или Wikipedia.

[2026-05-11] На autohome.com.cn search results (sou.autohome.com.cn/zonghe?q=...) могут быть отфильтрованы — показывают только часть комплектаций. Сегодня по Leapmotor D19 search дал только 3 EREV, и я ошибочно решила что BEV нет в производстве. На самом деле через config-страницу /config/series/8273.html видны все 7 trim'ов включая 4 BEV. **Источник истины — config/series/{ID}.html или price/series-{ID}.html**, не поиск. Усиление правила от 2026-05-11 про autohome как primary source.

[2026-05-13] При замене картриджа Big Blue на даче с гидроаккумулятором — насос вырубить через автомат (не кнопку — реле может включиться без звука) → ОТКРЫТЬ КРАН в доме до полной тишины (гидроаккумулятор может литров 20-40 выдать) → только потом стравливать кнопкой на фильтре. Без этого шага давление возвращается каждый раз. Расширительный бак отопления ≠ гидроаккумулятор водоснабжения — разные контуры. Прикипевшую колбу: WD-40 в стык по кругу + ждать 20-30 мин для просачивания → тряпка между ключом и колбой для трения → strap wrench из ремня → постукивание резиновым молотком.

[2026-05-14] [[style-plan]] Этап 2 (blazer + майка, Стэйтхэм-вайб) — параллельно к Этапу 1 (Kralov-style рубашки). Покупки: блейзер чёрный неструктурированный (soft tailoring, slim прямой, длина до середины ладони, ИЗБЕГАТЬ костюмного пиджака от костюма — будет 'официант без галстука'), графитовые брюки slim тёмно-серые шерстяные, опционально челси чёрные (Chelsea boots). Майки у Vovan есть. Кеды и тёмно-синие чиносы из Этапа 1 переиспользуются. Бренды WB для блейзера: Henderson, KANZLER, Tom Tailor, Lemonbrand. Бюджет 200-500 BYN. Обновить projects/style-plan.md — добавить ось B в дополнение к оси A.

[2026-05-15] Dongchedi.com (ByteDance) и часть китайских сайтов блочат не-китайские IP через Tengine WAF — возвращают пустой body с фейковым Content-Type, или 'Download is starting' через Content-Disposition. Stealth-browser НЕ пробивает — проблема не в JS-stealth (это последний слой), а в IP geo + TLS fingerprint. Решение: residential proxy с китайским exit (Bright Data, Smartproxy, IPRoyal, $15-30/мес) через STEALTH_BROWSER_PROXY env (Playwright нативно умеет --proxy-server). Stealth-browser bin живёт в volatclaw/bin/stealth-browser.mjs — НЕ моя территория, могу предложить diff но не редактировать. Autohome работает без proxy, dongchedi/抖音商城 — нет.

[2026-05-16] Reverse image search НЕ в моих скиллах (Google Lens / Yandex Images / TinEye не подключены через API). agent-browser теоретически может загнать в Google Images / Yandex но капча на первом шаге. При просьбах 'найди по фото в инсте/гугле' — сразу сказать честно 'нет, нужно имя/ник/ссылка', не имитировать. Instagram anon person-search полностью заблокирован с 2023 (Google не индексирует, прямой поиск ловит login wall). Без залогиненных cookies / kartoteka.by / rusprofile — никак.

[2026-05-16] Vovan хочет добавить Instagram support в платформу volatclaw (как сейчас telegram/slack/discord). Рекомендую **ManyChat Pro как BSP-прокси** вместо своего Meta App — Meta-аппрувленный партнёр, OAuth-онбординг IG за 5 мин, DM+комменты из коробки, External Request/Webhooks. Архитектура: ManyChat получает webhook от Меты → дёргает наш webhook → volatclaw инвокает бота → ответ через ManyChat API. Нужен новый transport volatclaw/src/manychat.ts (НЕ моя территория, могу только diff предложить). Цена $15-99/мес за аккаунт. **24-часовое окно DM остаётся** (правило Меты, не ManyChat). Альтернативы: Twilio Conversations (DM ок, комменты нет), MessageBird/Sendbird (enterprise дорого), Apify (read-only только, на запись бан). Своё Meta App — отказались из-за боли App Review (3-4 недели, могут реджектнуть).
