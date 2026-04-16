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
```

## Input
- Команда: `add`, `list`, `done`, `remove`, `edit`
- Текст задачи, индексы, опциональный дедлайн

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
