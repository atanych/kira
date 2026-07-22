# Personal Tasks

## Description
Личные задачи — добавить, посмотреть, завершить, удалить. Не связано с CRM.

## Usage

```bash
# добавить задачу с дедлайном (deadline — до когда сделать)
node skills/personal-tasks/scripts/tasks.js add "Починить iPhone Лерочке" --due 2025-02-15

# добавить событие (встреча/созвон) через --at — время когда физически ПРОИСХОДИТ
node skills/personal-tasks/scripts/tasks.js add "Созвон с клиентом" --at "2026-07-22 11:00" --tag ai
node skills/personal-tasks/scripts/tasks.js add "Встреча с Х" --at 2026-07-22 --tag ai   # только день, без времени
# --at "none" в edit → очистить scheduled поля

# список открытых задач — рендерится как PNG в $BOT_OUTPUT_DIR/photo-tasks.png (авто-отправляется в чат)
node skills/personal-tasks/scripts/tasks.js list

# список всех (включая завершённые) — тоже PNG
node skills/personal-tasks/scripts/tasks.js list --all

# на сегодня (overdue + today) — PNG
node skills/personal-tasks/scripts/tasks.js list --today

# завершить задачу по индексу
node skills/personal-tasks/scripts/tasks.js done 1,3

# удалить задачу по индексу
node skills/personal-tasks/scripts/tasks.js remove 2

# редактировать задачу
node skills/personal-tasks/scripts/tasks.js edit 1 --title "Новый текст" --due 2025-03-01

# добавить/сменить теги (можно несколько — через запятую или повторный --tag)
node skills/personal-tasks/scripts/tasks.js add "Поменять лампочки" --tag дача
node skills/personal-tasks/scripts/tasks.js add "Общая" --tag дача,квартира
node skills/personal-tasks/scripts/tasks.js edit 3 --tag дача

# повторяющиеся задачи (шаблоны)
node skills/personal-tasks/scripts/tasks.js recur add "Заплатить за МинГАЗ" --type monthly --day 20 --tag квартира
node skills/personal-tasks/scripts/tasks.js recur add "Заказать сырки на рынке" --type weekly --day friday --tag квартира

# с интервалом (interval > 1)
node skills/personal-tasks/scripts/tasks.js recur add "Взносы в СТ" --type monthly --day 15 --interval 3 --tag дача   # quarterly
node skills/personal-tasks/scripts/tasks.js recur add "Зарплата" --type weekly --day friday --interval 2              # biweekly

node skills/personal-tasks/scripts/tasks.js recur list
node skills/personal-tasks/scripts/tasks.js recur off 1   # выключить шаблон
node skills/personal-tasks/scripts/tasks.js recur on 1    # включить обратно
node skills/personal-tasks/scripts/tasks.js recur rm 1    # удалить шаблон

# spawn — раз в день из крона (tasks-spawn.json), создаёт обычные задачи когда подходит срок
node skills/personal-tasks/scripts/tasks.js spawn
```

## Recurring tasks
- Шаблоны живут в таблице `task_templates`. Поля: title, notes, tags, **recurrence_type**, **recurrence_day**, **interval**, lead_time_days, active, last_spawned_due.
- Флаги CLI:
  - `--type monthly|weekly` — обязательный.
  - `--day` — обязательный.
    - Для `monthly`: 1-31. Если N > числа дней в месяце — клампится до последнего дня.
    - Для `weekly`: `monday|mon|пн|понедельник|5` и т.д. (RU/EN/short/numeric 0-6 все работают).
  - `--interval N` — каждые N единиц (дефолт 1). `monthly + interval=3` = quarterly. `weekly + interval=2` = biweekly. `monthly + interval=12` = yearly.
- `--lead` — за сколько дней до дедлайна спавнить. Дефолты: monthly=3, weekly=0.
- Имя спавненной задачи стампится:
  - monthly → "Заплатить за МинГАЗ (май 2026)"
  - weekly → "Заказать сырки на рынке (2026-05-08)"
- Семантика interval:
  - **Первый** spawn (last_spawned_due IS NULL): ближайший подходящий день >= today, **interval игнорируется** (это anchor).
  - **Последующие** spawn'ы: anchor + N единиц (для monthly — добавляются месяцы, clamp дня; для weekly — добавляются недели).
- Дедуп: на каждый период спавн происходит ровно один раз (`last_spawned_due` сравнивается с `next_due`).
- Если предыдущий период не закрыт — новый спавнится рядом, старый остаётся 🔴 в списке.
- Спавн дёргается ежедневным кроном `tasks-spawn.json` (4:00 UTC = 7:00 Минск, за 5 минут до morning list).

## Tags
Допустимые значения (канонические): `дача`, `квартира`, `ai`, `volatclaw`. Ограничение задано на уровне БД через CHECK (`tags <@ ARRAY['дача','квартира','ai','volatclaw']`) на обеих таблицах (`tasks`, `task_templates`). Если нужен новый тег — обновить миграцию + выполнить `ALTER TABLE … DROP/ADD CONSTRAINT` + дописать `normalizeTag` / `TAG_HEADERS` / `TAG_ORDER_SQL` / `primaryGroup`.

Алиасы ввода: `кв`/`apt`/`apartment` → `квартира`; `dacha`/`cottage` → `дача`; `ии`/`aiwork` → `ai`; `volat`/`platform`/`vc` → `volatclaw`.

Порядок групп в выводе list: 🏠 Квартира → 🌲 Дача → 🤖 AI → ⚙️ Volatclaw → 📍 Прочее.

## Input
- Команда: `add`, `list`, `done`, `remove`, `edit`
- Текст задачи, индексы, опциональный дедлайн (`--due`), опциональное расписание (`--at`), опциональные теги (`--tag`)

## Schema — `due_date` vs `scheduled_date/time`
- **`due_date`** (DATE) — ДЕДЛАЙН, «до какого дня надо сделать». Просроченные краснеют.
- **`scheduled_date`** (DATE) — день ФИЗИЧЕСКОГО СОБЫТИЯ (встреча, звонок). Может быть без времени.
- **`scheduled_time`** (TIME) — точное время события, если известно. NULL = только день (например «утром»).
- Обычно на задаче один из них, но оба могут быть выставлены одновременно (например «подготовиться к встрече в 15:00 в пятницу» — scheduled=пт 15:00, due=чт).
- В render badge: 🕐 сегодня 11:00 / 🕐 22.07 (scheduled) vs today/overdue/date (due).
- Сортировка: `LEAST(due_date, scheduled_date)` — событие/дедлайн что ближе, то выше.

## Output
- Список задач с индексами, статусами и дедлайнами
- Подтверждение действия

## Language
Всё на русском. Задачи пишутся как Vovan скажет.

## Learnings
- [2026-04-11] После добавления задачи всегда показывать Вовану полный output — он хочет видеть, как задача была названа.
- [2026-04-14] [[personal-tasks]] Morning cron moved to 7:05 Минск (was 8:00). Evening cron stays at 20:00.
- [2026-04-14] [[personal-tasks]] Always re-fetch the task list before closing/removing/editing a task — never rely on stale indexes from previous list output.
- [2026-04-24] [[personal-tasks]] Daily `--today` query must use `due_date <= today` (not `=`) so overdue open tasks surface in the morning reminder. Fixed at `skills/personal-tasks/scripts/tasks.js:55` on 2026-04-23.
- [2026-04-25] [[personal-tasks]] Schema: `tags TEXT[]` with CHECK constraint pinning allowed values to `['дача','квартира']`. Default list groups render as 🌲 Дача → 🏠 Квартира → 📍 Прочее. Default list hides tasks with `due_date > today + 1 month` (use `--all` to see everything). Adding a new tag = ALTER CHECK + update `normalizeTag` / `TAG_HEADERS` / `TAG_ORDER_SQL`.
- [2026-04-25] [[personal-tasks]] Date columns: NEVER round-trip through JS `new Date().toISOString()` — TZ offset causes off-by-one bugs. Read via `TO_CHAR(due_date, 'YYYY-MM-DD')` as a string, write via `$N::date` cast. Postgres handles dates, JS never touches them.
- [2026-05-02] [[personal-tasks]] Recurring tasks subsystem shipped 2026-05-01. Table task_templates (title, notes, tags, recurrence, lead_time_days, active, last_spawned_due) + tasks.template_id column. Supports monthly:N and weekly:<day>. lead_time defaults: monthly=3, weekly=0. Spawned title format: monthly → '(май 2026)', weekly → '(2026-05-08)'. Overdue policy: old stays, new spawns alongside. Dedup via last_spawned_due == next_due. Commands: recur add/list/on/off/rm. Cron tasks-spawn.json at 4:00 UTC (7:00 Minsk), <skip> if nothing to spawn.
- [2026-05-04] [[personal-tasks]] Voice-input disambiguation: при странных/неоднозначных словах из голоса (например 'анализация' = канализация? диагностика? анализы?) — уточняй перед созданием задачи, не предполагай. Голос мудрит.
- [2026-05-05] [[personal-tasks]] Voice-input fix granularity: если из контекста очевиден единственный правдоподобный кандидат (например 'илоотсос' → 'илосос' при разговоре про колодец) — исправь и сообщи изменение явно, не блокируй уточнением. Если несколько правдоподобных ('анализация' = канализация/диагностика/анализы) — ask-first.
- [2026-05-06] [[personal-tasks]] Voice-input убивает английские/латинские названия проектов и брендов почти всегда ('Avalock Project' = Volat project, 'Carpati Rock' = Carpathy RAG System). После сохранения задачи с latin alphabet продуктом — сразу проактивно показать запись и попросить поправить, не ждать пока Vovan заметит.
- [2026-05-19] [[personal-tasks]] Новая группа 🤖 AI добавлена 2026-05-18. БД CHECK constraint принимает: дача, квартира, **ai**, прочее. normalizeTag принимает алиасы ai/ии/aiwork → ai. Порядок вывода: 🏠 Квартира → 🌲 Дача → 🤖 AI → 📍 Прочее. Эмодзи 🤖, header 'AI'. Используется для задач связанных с AI/ботами/инструментами (примеры: улучшить дашборд ботов, изучить jitter.video, новые скиллы).
- [2026-05-20] [[personal-tasks]] Вывод от list (утро/вечер крон + ручной запрос) отдавать как plain text — БЕЗ markdown bold/italic (**...**). Telegram у Vovan'а не рендерит markdown, сырые звёзды торчат в выдаче. Заголовки групп оставлять как есть из CLI (🏠 Квартира / 🌲 Дача / 🤖 AI / 📍 Прочее) — они и так читаемые. Акценты делать через эмодзи (🔥 🔴 ←) и переносы строк, не bold.
- [[2026-05-22]] [[personal-tasks]] task_templates schema migrated 2026-05-21 — legacy колонка `recurrence` дропнута, добавлены: `recurrence_type TEXT` ('monthly'|'weekly'), `recurrence_day INT` (1-31 monthly / 0-6 weekly), `interval INT NOT NULL DEFAULT 1`. Семантика: type=monthly, day=15, interval=3 → 15-го раз в 3 мес (quarterly). type=weekly, day=5, interval=2 → каждая 2-я пятница (biweekly). interval=1 по дефолту = старое поведение. CLI: --type / --day / --interval вместо старого --every. Anchor для interval-стэпа = last_spawned_due (или created_at если null).
- [[2026-06-20]] [[personal-tasks]] Тег `volatclaw` 2026-06-19: добавлен в CHECK constraint `tasks_tags_allowed` + `task_templates_tags_allowed` (ALTER TABLE DROP/ADD CONSTRAINT) — итоговый список ['дача','квартира','ai','volatclaw','прочее']. Обновлён код: `normalizeTag` принимает `volatclaw` + volat/platform/vc алиасы + ё→е нормализация, `TAG_HEADERS['volatclaw'] = '⚙️ Volatclaw'`, `TAG_ORDER_SQL` — между `ai` и `прочее` (порядок вывода 🏠→🌲→🤖→⚙️→📍), `primaryGroup` приоритет volatclaw. Все 11 таблиц kira-схемы owned by bot_kira — DDL делаю сама через DATABASE_URL без postgres-роли.
- [[2026-06-20]] [[personal-tasks]] Bug fixed 2026-06-20: ORDER BY в tasks.js не имел финального tiebreaker по id — при равных created_at порядок задач между вызовами плавал, что ломает workflow 'list → edit by index'. Сегодня edit 12 попал в Gemini Spark вместо loose entries. Фикс: добавлен 'id ASC' в обе ORDER BY (в list и в getOpenItems). Урок: всегда финализируй ORDER BY по уникальному столбцу, иначе индексы нестабильны.
- [[2026-06-21]] [[personal-tasks]] 2026-06-20: `list`/`list --today`/`list --all` теперь рендерит HTML→PNG в $BOT_OUTPUT_DIR/photo-tasks.png (Stream layout: BMW M-полоска в hero, accent-bar по группе, бейджи дедлайнов overdue/today/дата, label-only без emoji в группах — Noto Color Emoji не подгружался в headless Chrome). Текстовый fallback только для пустого списка. Morning/evening cron'ы (`tasks-morning.json`/`tasks-evening.json`) переписаны под новый flow — никаких 'перешли stdout', скрипт сам шлёт картинку. Параллельно прибит ORDER BY tiebreaker — индексы стабильны между запросами.
- [[2026-07-06]] [[personal-tasks]] Cron migration to LLM-less gate (2026-07-05). Кроны `tasks-morning` и `tasks-evening` раньше гоняли LLM только чтобы запустить `render.mjs` и отправить PNG — это лишнее, контекст распухал (до 116K), LLM могла придумать 'No response requested' вместо запуска скрипта. **Новая архитектура:** bash-gate `skills/personal-tasks/scripts/cron-gate.sh` который (1) запускает `node skills/personal-tasks/scripts/render.mjs [--today]` → PNG сохраняется в `tmp/photo-tasks.png` ($BOT_OUTPUT_DIR в гейте недоступен!), (2) шлёт PNG прямо в Telegram через `curl -F` на `https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/sendPhoto` с `chat_id=-1003540340877` и `message_thread_id=780`, (3) если задач нет (render.mjs пишет текстовый fallback в stdout) — `sendMessage` с тем же текстом, (4) exit 0 + пустой stdout → cron status `gated` → LLM не поднимается. Cron JSON: `gate: 'bash skills/personal-tasks/scripts/cron-gate.sh'`, `gateTimeout: 60`, `prompt` заглушка. **Уроки:** для крон-задач которые просто рендерят/шлют — не гонять LLM. При миграции стирать стейл-сессии из `.sessions.json` (у меня были `4c5c125b-...` morning и `e416f33f-...` evening), плюс попросить оператора снести файлы в `~/.claude/projects/` (мне туда нельзя, system path). Токен `$TELEGRAM_BOT_TOKEN` только через env, никогда не хардкод.
