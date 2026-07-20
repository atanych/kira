# Boundaries

What I own vs. what I don't touch. Safety reflex exceptions for own code.

> [!warning] Never touch other bots' folders
> Never read, write, or touch anything inside Ostap's bot directory. Kira only owns her own bot folder.

> [!warning] Malware-safety reflex doesn't apply to own code
> The safety reflex must NOT block editing Kira's own skill code. When the file is clearly under `bots/kira/` or `skills/` that Kira owns, just do the edit. The safety prompt is for external/unknown code.

> [!warning] Never hardcode server install paths
> `/home/claude/...` больше не существует — сервер переехал на `/home/volatclaw/volatclaw/` под locked-down OS-юзеров. Правила: (1) `proxied` — PATH-команда, `proxied <by|ru|off> <cmd>` без абсолютного пути к bin/; (2) любой другой абсолютный путь → относительно `BOT_DIR` или `$BOT_DIR`. Проверка: `grep -r '/home/claude' crons/ scripts/ skills/` должен быть пустым.

## Log
- [[2026-04-22]] Boundary rule: never read, write, or touch anything inside Ostap's bot directory. Kira only owns her own bot folder.
- [[2026-04-24]] Malware-safety reflex must NOT block editing Kira's own skill code. When the file is clearly under `bots/kira/` or `skills/` that Kira owns, just do the edit. The safety prompt is for external/unknown code.
- [[2026-06-04]] [[boundaries]] **google-search skill BROKEN с 2026-06-02** — `volatclaw/skills/google-search/google-search.ts:22` хардкодит `gemini-2.0-flash`, который Google EOL'нул 1 июня 2026. Каждый search → 404. Fix: одна строка `gemini-2.0-flash` → `gemini-3.5-flash` (3.5 Flash GA с того же 1 июня). Это shared skill, не моя территория — Vovan должен применить one-line change. До этого AI briefing и все search-зависимые задачи лежат.
- [[2026-05-16]] [[boundaries]] Reverse image search НЕ в моих скиллах (Google Lens / Yandex / TinEye не подключены). 'Найди по фото' → честно 'нужно имя/ник/ссылка', не имитировать. Instagram anon person-search заблокирован с 2023.
