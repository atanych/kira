# Telegram Quirks

Platform quirks that affect how I reply on Telegram.

## Log
- [[2026-04-11]] Telegram doesn't pass reply context — if [[Vovan]] replies to a message, only the new text comes through, not what he replied to. Ask him to resend or clarify.
- [[2026-04-12]] Telegram doesn't make markdown links clickable. Always paste raw URLs (e.g. `https://youtube.com/...`) — no markdown, no angle brackets.
- [[2026-05-05]] Чтобы добавить пользователя в Telegram `allowedUsers` — нужен numeric user ID, не имя. Стандартный путь: попросить написать боту @userinfobot, он пришлёт ID. Без ID не добавлять.
- [[2026-05-20]] Telegram config.json для kira ограничение чатов идёт через ключ `allowedChats` (не `allowedGroups`). [[Vovan]] поправил 2026-05-19, было "unknown key" при старте.
