# Personal Tasks

## Description
Личные задачи — добавить, посмотреть, завершить, удалить. Не связано с CRM.

## Usage

```bash
# добавить задачу
node skills/personal-tasks/scripts/tasks.js add "Починить iPhone Лерочке" --due 2025-02-15

# список открытых задач
node skills/personal-tasks/scripts/tasks.js list

# список всех (включая завершённые)
node skills/personal-tasks/scripts/tasks.js list --all

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
```

## Tags
Допустимые значения (канонические): `дача`, `квартира`. Ограничение задано на уровне БД через CHECK (`tags <@ ARRAY['дача','квартира']`). Если нужен новый тег — сначала обновить миграцию и выполнить ALTER TABLE.

Алиасы ввода: `кв`/`apt`/`apartment` → `квартира`; `dacha`/`cottage` → `дача`.

## Input
- Команда: `add`, `list`, `done`, `remove`, `edit`
- Текст задачи, индексы, опциональный дедлайн, опциональные теги (`--tag`)

## Output
- Список задач с индексами, статусами и дедлайнами
- Подтверждение действия

## Language
Всё на русском. Задачи пишутся как Vovan скажет.

## Learnings
- [2026-04-11] После добавления задачи всегда показывать Вовану полный output — он хочет видеть, как задача была названа.
- [2026-04-14] [[personal-tasks]] Morning cron moved to 7:05 Минск (was 8:00). Evening cron stays at 20:00.
- [2026-04-14] [[personal-tasks]] Always re-fetch the task list before closing/removing/editing a task — never rely on stale indexes from previous list output.
- [2026-04-15] [[personal-tasks]] When closing/editing a task by name, always re-lookup from DB — don't rely on cached index numbers (indices shift between operations).
- [2026-04-24] [[personal-tasks]] Daily `--today` query must use `due_date <= today` (not `=`) so overdue open tasks surface in the morning reminder. Fixed at `skills/personal-tasks/scripts/tasks.js:55` on 2026-04-23.
- [2026-04-25] [[personal-tasks]] Schema: `tags TEXT[]` with CHECK constraint pinning allowed values to `['дача','квартира']`. Default list groups render as 🌲 Дача → 🏠 Квартира → 📍 Прочее. Default list hides tasks with `due_date > today + 1 month` (use `--all` to see everything). Adding a new tag = ALTER CHECK + update `normalizeTag` / `TAG_HEADERS` / `TAG_ORDER_SQL`.
- [2026-04-25] [[personal-tasks]] Date columns: NEVER round-trip through JS `new Date().toISOString()` — TZ offset causes off-by-one bugs. Read via `TO_CHAR(due_date, 'YYYY-MM-DD')` as a string, write via `$N::date` cast. Postgres handles dates, JS never touches them.
