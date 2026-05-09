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
