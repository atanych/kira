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
