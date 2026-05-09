# Car Report

## Description
Generates a comparison PDF report for Vovan's car research. Takes a list of car options and renders a polished multi-page PDF with cards, comparison tables, size analysis vs current car (XC90), battery breakdown, and next steps.

Built during the EV shortlist research session 2026-05-08. Designed to be re-used when:
- New cars added to shortlist (post test-drive, new models on market)
- Filters change (e.g., open up to PHEV, or narrow by price)
- Need to print/share with Ксюшенька for family decision

## Why PDF, not PNG
Telegram сжимает PNG — текст и таблицы становятся мутными. PDF идёт как документ без сжатия, текст векторный, можно зумить. **Always use PDF for car reports.**

## Workflow

### Step 1: Update knowledge files
Living documents in `projects/cars/`:
- **`shortlist.md`** — текущая таблица сравнения с цифрами и характеристиками
- **`research-notes.md`** — бренды, дилеры, цены, action items
- **`batteries.md`** — reference по батареям

При новой инфо обновляй markdown файлы первыми. Они — source of truth.

### Step 2: Update HTML template
Live working file: `tmp/car-report.html`

Structure (proven in 2026-05-08 session):
1. **Header** (тёмный gradient) — заголовок, фильтры, ev-tag, дата
2. **Filter note** (жёлтая плашка) — что включили/исключили и почему
3. **Requirements** (белый блок) — список требований с зелёными ✓
4. **Recommendation banner** (зелёный gradient) — топ-выбор/выводы
5. **Cards grid** (3-колоночный или 2x3) — карточка на машину с бейджем, ценой, батареей, спеками, плюсами/минусами
6. **Size comparison vs XC90** — таблица где XC90 baseline (выделен жёлтым), остальные с дельтами (зелёные/красные)
7. **Battery section** — LFP vs NMC / 1.0 vs 2.0 explained для не-инженера
8. **Big comparison table** — все ключевые параметры по всем машинам, выигрышные ячейки выделены зелёным
9. **Next steps** — пронумерованный список действий
10. **Footer** — "Подготовлено: Kira ⚡"

### Step 3: Generate PDF
```bash
npx agent-browser open "file:///$(pwd)/tmp/car-report.html"
npx agent-browser pdf $(pwd)/tmp/output/Volvo-XC90-replacement-shortlist.pdf
npx agent-browser close
```

Output goes to `tmp/output/` → автоматически отправляется в чат как документ.

## Key design decisions (lessons learned)

### Цены
- **Always BYN + USD** (BYN/USD rate ~3.25)
- Источник цен: **av.by** (через google-search skill, не агент-браузером — av.by блокирует)
- В подписи карточки указывать **дилера** (Atlant-M, voyah.by, и т.д.)

### Фильтры
- **EV vs PHEV** критично — у Vovan'a фильтр "только BEV" из-за растаможки гибридов в РБ
- Размер vs текущий авто — **всегда показывать XC90 как baseline** в таблице габаритов
- Дилер в РБ — **зелёный тег "ОФИЦИАЛЬНО В РБ"** или красный "СЕРЫЙ ИМПОРТ"

### Цветовая логика
- 🟢 Зелёный (#00a86b) — winner / best in class / recommendation
- 🟠 Оранжевый (#ffa500) — runner-up / альтернатива / warning  
- 🔴 Красный (#d04444) — cons / минусы
- 🟡 Жёлтый (#fff8e6) — baseline / highlighted в таблицах

### Бейджи карточек
Клейми машины бейджами на основе их сильной стороны:
- 🥇 Лучшая цена
- 🛡️ Безопасность (для Blade Battery)
- 💎 Премиум
- 🆕 Размер XC90 (или другая фишка)
- 🦁 Уникальная (выше XC90 — для Bao 7)
- 👑 Премиум-флагман

### Что обязательно проверить перед генерацией
- [ ] Все цены актуальны (av.by-проверка)
- [ ] AWD-фильтр соблюдён
- [ ] Габариты vs XC90 baseline
- [ ] Батарея указана с типом (LFP / NMC / Blade 1/2)
- [ ] 800В/1000В architecture указана
- [ ] Дилер в РБ или серый импорт
- [ ] Гарантия на батарею (особенно у BYD vs Zeekr — большая разница)

## Memory contexts (что Kira помнит про Vovan)
- Накатывает 100-130 км/день (Минск-дача-Минск + другие)
- Фильтр: только чистый EV (растаможка PHEV дороже)
- Бюджет ориентир: $30-50к (с возможностью до $86к за топ)
- Электричество на даче: 0.3 BYN/кВт·ч, тип розетки/wallbox — TBD
- Семья: Лерочка (2015), Владик (2021), Ксюшенька (жена)
- Текущая машина: Volvo XC90, ~300к пробега, нужна замена
- Важно сохранить "размер XC90 feel" — выпускной класс XC60 ниже на 12-17 см

## Related skills
- `google-search` — для проверки цен на av.by (av.by блокирует agent-browser)
- `agent-browser` — для рендера HTML в PDF
- `memory` — для сохранения новых insights про предпочтения Vovan'a

## Files
- `SKILL.md` — этот документ
- `template.html` — рабочий шаблон car-report (с CSS и структурой)
- `render-pdf.sh` — простой shell-скрипт, открывает HTML и сохраняет PDF

## Learnings
- [2026-05-08] [[car-report]] Skill для генерации PDF-репортов по авто. Структура: shortlist.md + research-notes.md + batteries.md в projects/cars/, плюс HTML template в skills/car-report/. Workflow: обновить markdown, потом HTML, потом render-pdf.sh. Всегда PDF (не PNG) — Telegram сжимает картинки.
