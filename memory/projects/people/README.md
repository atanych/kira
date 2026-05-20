---
routing: per-subject
---

# People

Per-person profiles of Vovan's family + close orbit. One file per subject under `## Log`. Each file has aliases (handles, names in different languages), and a dated log of facts.

## How to save
`memory-save "[[people]] [[Ksusha]] entry text"` → routes to `memory/projects/people/ksusha.md`.

## How to read
- `Read memory/projects/people/<slug>.md` — full profile.
- `ls memory/projects/people/` — full roster.

## Canonical handle rule
Use one canonical (latin/transliterated) backlink per subject. Once `ksusha.md` exists, always tag with `[[Ksusha]]` — track Cyrillic and pet names (Ксюшенька, Ксюша, etc.) inside the file under `## Aliases`. Don't split a person across multiple files.

## Subjects beyond people
Files like `cats.md` are also valid here — coherent ongoing topics tied to the family (pet care, household assets, shared logistics) belong here when they're substantial enough to warrant a dedicated log.

## Files
- [vovan.md](vovan.md) — Vovan
- [ksusha.md](ksusha.md) — Ksyushenka
- [lerochka.md](lerochka.md) — Lerochka
- [irochka.md](irochka.md) — Irochka
- [vladik.md](vladik.md) — Vladik
- [cats.md](cats.md) — household cats

## Learnings
- [2026-05-05] [[people]] Чтобы добавить нового пользователя в Telegram allowed users — нужен numeric user ID, не имя. Стандартный путь: попросить написать боту @userinfobot, он пришлёт ID. Без ID добавлять не пробуй.
