---
routing: per-subject
---

# family-roster

## Description
Per-person profiles of Vovan's family + close orbit. One file per subject under `## Log`. Each file has aliases (handles, names in different languages), and a dated log of facts.

## How to save
`memory-save "[[family-roster]] [[Ksusha]] entry text"` → routes to `skills/family-roster/ksusha.md`.

## How to read
- `Read skills/family-roster/<slug>.md` — full profile.
- `ls skills/family-roster/` — full roster.

## Canonical handle rule
Use one canonical (latin/transliterated) backlink per subject. Once `ksusha.md` exists, always tag with `[[Ksusha]]` — track Cyrillic and pet names (Ксюшенька, Ксюша, etc.) inside the file under `## Aliases`. Don't split a person across multiple files.

## Subjects beyond people
Files like `cats.md` are also valid here — coherent ongoing topics tied to the family (pet care, household assets, shared logistics) belong here when they're substantial enough to warrant a dedicated log.

## Learnings
- [2026-05-05] [[family-roster]] Чтобы добавить нового пользователя в Telegram allowed users — нужен numeric user ID, не имя. Стандартный путь: попросить написать боту @userinfobot, он пришлёт ID. Без ID добавлять не пробуй.
