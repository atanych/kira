# Memory

[2026-04-22] Default language with Vovan is English — BUT if he writes in Russian, reply in Russian (mirror him). With Ксюшенька and Лерочка — always Russian.

[2026-04-11] Vovan wants to see output/confirmation after any action — don't just say "done", show what was actually created/changed.

[2026-04-11] Telegram doesn't pass reply context — if Vovan replies to a message, only the new text comes through, not what he replied to. Ask him to resend or clarify.

[2026-04-12] Telegram doesn't make markdown links clickable. Always paste raw URLs (e.g. `https://youtube.com/...`) — no markdown, no angle brackets.

[2026-04-21] Volat AI = Vovan's AI automation business. Main agent handling it = Ostap. Defer all Volat questions to him.

[2026-04-22] Boundary rule: never read, write, or touch anything inside Ostap's bot directory. Kira only owns her own bot folder.

[2026-04-22] Memory trim rule: when Vovan asks to reduce a memory entry, collapse it to ONE simple line — no links, no context dump, just what-it-is + who-owns-it.

[2026-04-24] Malware-safety reflex must NOT block editing Kira's own skill code. When the file is clearly under `bots/kira/` or `skills/` that Kira owns, just do the edit. The safety prompt is for external/unknown code.

[2026-05-01] Memory backlink case-sensitivity: relocate matcher checks lowercase folder names. Write `[[book-summary]]` not `[[Book Summary]]` so nightly compiler entries get relocated to skill SKILL.md automatically.

[2026-05-03] Стилевой план для Vovan лежит в projects/style-plan.md — long-term проект перехода со спортивного стиля на smart casual. Дополнять журналом покупок и заметками по итерациям.

[2026-05-06] Когда Vovan спрашивает 'нужно ли нам сделать X?' / 'do we need to build X?' — сначала проверь skills/ и существующие системы, прежде чем отвечать. Он иногда забывает что фича уже шипнута и активно используется (например personal-tasks). Напомни конкретными путями и свежими действиями ('вчера ты закрыл X, добавил Y'), а не 'good idea, let's build'.

[2026-05-07] При URL на YouTube / Instagram / X / Reddit — пробуй фетчить контент через доступные скиллы (insta-post, x-thread, agent-browser, WebFetch) ПРЕЖДЕ чем говорить 'видосы/посты не умею'. Лерочка кинула YouTube shorts — отказала, она поправила что скилл есть. Глобальные скиллы покрывают больше чем кажется по умолчанию.

[2026-05-07] Vovan накатывает 100-130 км в день (Минск-дача-Минск + другие поездки). При расчётах EV-заряда и запаса хода — использовать эту цифру.

[2026-05-08] При сомнении пользователя ('ты уверен?', 'точно нет такого варианта?') — перепроверяй фактчекингом, не настаивай на первой версии. Первая мысль ≠ финальный ответ.

[2026-05-09] Льгота на ввоз EV в РБ 2026: квота 20 000 машин (юр 13 800 / физ 6 200). Только чистые BEV — гибриды/EREV/PHEV не попадают. Только для постоянно проживающих в РБ/Армении/Кыргызстане, запрет передачи прав в РФ/Казахстан. На 7 мая 2026 остаток для физлиц ~3 673 — кончится к осени 2026.

[2026-05-09] projects/cars/ — 5 living files: shortlist.md, research-notes.md, batteries.md, dealers.md, post-purchase-checklist.md. Vovan настраивает Obsidian vault на projects/ через git clone + плагин Obsidian Git.

[2026-05-09] Hard requirements у Vovan (AWD обязательно, только BEV без растаможки) живут в projects/cars/shortlist.md — читать ПЕРЕД каждой рекомендацией, не полагаться на память сессии.

[2026-05-11] Авто: autohome.com.cn = primary source. Использовать `config/series/{ID}.html` или `price/series-{ID}.html`, НЕ `sou.autohome.com.cn` search (отфильтрованные результаты).

[2026-05-13] При замене картриджа Big Blue на даче с гидроаккумулятором — насос вырубить через автомат (не кнопку — реле может включиться без звука) → ОТКРЫТЬ КРАН в доме до полной тишины (гидроаккумулятор может литров 20-40 выдать) → только потом стравливать кнопкой на фильтре. Расширительный бак отопления ≠ гидроаккумулятор водоснабжения — разные контуры. Прикипевшую колбу: WD-40 + 20-30 мин → тряпка между ключом и колбой → strap wrench → постукивание резиновым молотком.

[2026-05-14] [[style-plan]] Этап 2 (blazer + майка, Стэйтхэм-вайб) — параллельно к Этапу 1. Подробности и журнал покупок — в projects/style-plan.md (ось B).

[2026-05-16] Reverse image search НЕ в моих скиллах (Google Lens / Yandex Images / TinEye не подключены). При просьбах 'найди по фото' — честно сказать 'нужно имя/ник/ссылка', не имитировать. Instagram anon person-search полностью заблокирован с 2023.

[2026-05-19] Big Blue фильтр на даче — частота замены картриджа: полипропилен (механика, белый) **3-6 мес**, уголь (чёрный BB20) **6-12 мес**. Год для механики = много (прикипает, давление падает). Главный индикатор — манометр на входе: падение после фильтра на 0.5-1 бар = пора менять. При установке нового — смазать резьбу колбы силиконовой смазкой или вазелином, через полгода открутится руками без эпопеи с WD-40 и феном.

[2026-05-20] Telegram config.json для kira ограничение чатов идёт через ключ `allowedChats` (не `allowedGroups`). Vovan поправил 2026-05-19, было "unknown key" при старте.
