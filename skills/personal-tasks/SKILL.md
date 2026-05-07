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

# повторяющиеся задачи (шаблоны)
node skills/personal-tasks/scripts/tasks.js recur add "Заплатить за МинГАЗ" --every monthly:20 --tag квартира
node skills/personal-tasks/scripts/tasks.js recur add "Заказать сырки на рынке" --every weekly:friday --tag квартира
node skills/personal-tasks/scripts/tasks.js recur list
node skills/personal-tasks/scripts/tasks.js recur off 1   # выключить шаблон
node skills/personal-tasks/scripts/tasks.js recur on 1    # включить обратно
node skills/personal-tasks/scripts/tasks.js recur rm 1    # удалить шаблон

# spawn — раз в день из крона (tasks-spawn.json), создаёт обычные задачи когда подходит срок
node skills/personal-tasks/scripts/tasks.js spawn
```

## Recurring tasks
- Шаблоны живут в таблице `task_templates`. Поля: title, notes, tags, recurrence, lead_time_days, active, last_spawned_due.
- Формат `--every`:
  - `monthly:N` где N = 1-31. Если N > числа дней в месяце — клампится до последнего дня месяца.
  - `weekly:<день>` — `monday|mon|пн|понедельник` и т.д. (RU/EN/short все работают).
- `--lead` — за сколько дней до дедлайна спавнить. Дефолты: monthly=3, weekly=0.
- Имя спавненной задачи стампится:
  - monthly → "Заплатить за МинГАЗ (май 2026)"
  - weekly → "Заказать сырки на рынке (2026-05-08)"
- Дедуп: на каждый период спавн происходит ровно один раз (`last_spawned_due` сравнивается с `next_due`).
- Если предыдущий период не закрыт — новый спавнится рядом, старый остаётся 🔴 в списке.
- Спавн дёргается ежедневным кроном `tasks-spawn.json` (4:00 UTC = 7:00 Минск, за 5 минут до morning list).

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
- [2026-05-02] [[personal-tasks]] Recurring tasks subsystem shipped 2026-05-01. Table task_templates (title, notes, tags, recurrence, lead_time_days, active, last_spawned_due) + tasks.template_id column. Supports monthly:N and weekly:<day>. lead_time defaults: monthly=3, weekly=0. Spawned title format: monthly → '(май 2026)', weekly → '(2026-05-08)'. Overdue policy: old stays, new spawns alongside. Dedup via last_spawned_due == next_due. Commands: recur add/list/on/off/rm. Cron tasks-spawn.json at 4:00 UTC (7:00 Minsk), <skip> if nothing to spawn.
- [2026-05-04] [[personal-tasks]] Voice-input disambiguation: при странных/неоднозначных словах из голоса (например 'анализация' = канализация? диагностика? анализы?) — уточняй перед созданием задачи, не предполагай. Голос мудрит.
- [2026-05-05] [[personal-tasks]] Voice-input fix granularity: если из контекста очевиден единственный правдоподобный кандидат (например 'илоотсос' → 'илосос' при разговоре про колодец) — исправь и сообщи изменение явно, не блокируй уточнением. Если несколько правдоподобных ('анализация' = канализация/диагностика/анализы) — ask-first.
- [2026-05-06] [[personal-tasks]] Voice-input убивает английские/латинские названия проектов и брендов почти всегда ('Avalock Project' = Volat project, 'Carpati Rock' = Carpathy RAG System). После сохранения задачи с latin alphabet продуктом — сразу проактивно показать запись и попросить поправить, не ждать пока Vovan заметит.
