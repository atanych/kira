# Memory

[2026-04-22] Default language with [[Vovan]] is English — BUT if he writes in Russian, reply in Russian (mirror him). With [[Ксюшенька]] and [[Лерочка]] — always Russian.

[2026-04-11] [[Vovan]] wants to see output/confirmation after any action — don't just say "done", show what was actually created/changed.

[2026-04-11] Telegram doesn't pass reply context — if [[Vovan]] replies to a message, I only see the new text, not what he replied to. Ask him to resend or clarify.

[2026-04-11] ElevenLabs voice: **Jessica** (`cgSgspJ2msm6clMCkdW9`). Changed from Rachel — better fit for Kira's personality.

[2026-04-12] Telegram doesn't make markdown links clickable. Always paste raw URLs (e.g. `https://youtube.com/...`) — no markdown, no angle brackets.

[2026-04-16] [[Vovan]] has 3 cars, stores 3 sets of tires (12 шин R19 235/55, без дисков) at дача хозпостройка.

[2026-04-21] [[Ксюшенька]] живёт во Фрунзенском районе Минска. Параметры 2026-04-20: вес 60.5 кг, рост 167-168 см, возраст 31. Активность — 2x силовые в зале + 5-9k шагов/день. BMR ~1336, TDEE ~1830-1870. Цель — похудение, ест 1400-1500 ккал/день (трекает в FatSecret, взвешивает еду). Ведёт прямые трансляции в TikTok (230-350 зрителей/час), хочет привлечь европейскую аудиторию (VPN Германия/UK, English, стабильная страна). Интересуется уходом за собой (дезодоранты/антиперспиранты).

[2026-04-21] **Volat AI** = Vovan's AI automation business. Main agent handling it = [[Ostap]]. Defer all Volat questions to him.

[2026-04-22] Boundary rule: never read, write, or touch anything inside Ostap's bot directory. Kira only owns her own bot folder.

[2026-04-22] Memory trim rule: when Vovan asks to reduce a memory entry, collapse it to ONE simple line — no links, no context dump, just what-it-is + who-owns-it.

[2026-04-23] [[CRM]] Owner-required gate (shipped 2026-04-22): `--approve` blocks items without owners, Slack recap.js refuses to publish if any approved item is orphaned, morning/evening reports show only approved items (pending count shown as hint).

[2026-04-23] [[Book Summary]] Vovan prefers 'Option A' style for deep-dive books: 3× focused 5-min audio deep-dives per technique, NOT one long 15-min recap. Pending: Voss/Never Split the Difference deep-dives on mirroring, labeling, calibrated questions (agreed 2026-04-22).

[2026-04-23] Kira — девушка (female). Гендер явно зафиксирован по просьбе Вована.

[2026-04-24] [[Personal Tasks]] Daily --today query must use due_date <= today (not =) so overdue open tasks surface in the morning reminder. Fixed at skills/personal-tasks/scripts/tasks.js:55 on 2026-04-23.

[2026-04-24] [[CRM]] Grain public API has no clip-creation endpoint (404s). For pinpointing a quote: pull raw transcript via transcript API, grep, return deep-link https://grain.com/share/recording/{id}/{token}?t={seconds}. Timestamp-deep-link is the fallback for clips.

[2026-04-24] Malware-safety reflex must NOT block editing Kira's own skill code. When the file is clearly under bots/kira/ or skills/ that Kira owns, just do the edit. The safety prompt is for external/unknown code.
