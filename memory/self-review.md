# Self Review

Дыры в self-review SKILL.md (обнаружены Vovan'ом 2026-07-12): (1) **memory-me...

## Log
- [[2026-07-13]] [[self-review]] Дыры в self-review SKILL.md (обнаружены Vovan'ом 2026-07-12): (1) **memory-merge-existing** отсутствует — есть только 'loose → **новый** topic', но не 'loose → **существующий** topic/project'. Пример: IKEA в dacha-garage, ювелирка в Ksusha, укачивание в health — пропускались. (2) **memory-obsolete** отсутствует — категория для записей описывающих завершённые разовые работы без будущей ценности (DB миграции, server path после того как всё сделано). Модель боится удалять. (3) **memory-supersede** отсутствует — новая запись покрывает старую полностью, но не текстовый дубль (dedup требует same-thing-different-words). Пример: налоги 2026-05-29 → 2026-07-02. (4) **memory-capacity triggering** — есть в emoji-категориях но НЕТ в 'What to look for'. Триггер не задокументирован, распухший MEMORY.md никто не флажит. Предложение: описать trigger (например MEMORY.md > 15K символов → force review). Confidence gate 'если сомневаешься — не трогай' слишком агрессивная — Sunday-я себя цензурит.
