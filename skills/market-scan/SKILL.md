# market-scan

## Description
Сканирует объявления на av.by по заданному фильтру, считает рыночную статистику и рендерит mobile-friendly PNG-отчёт с графиками (Chart.js + BMW M дизайн). Для оценки цены при продаже / покупке б/у авто.

**Триггер**: когда Vovan присылает av.by URL машины или просит проанализировать рынок по конкретной модели — инвокать этот скилл с `--exclude-damaged`.

## Usage
Run via Bash:
```
python3 skills/market-scan/market-scan.py "<av.by-filter-url>" [options]
```

## Arguments

**Positional:**
- `<av.by-filter-url>` — URL фильтра av.by. Получить:
  - Зайти на cars.av.by, выставить фильтры (марка / модель / поколение / годы)
  - Скопировать URL из адресной строки
  - Работает как `/volvo/xc90`, так и `/filter?brands[0][brand]=...`

**Optional flags (для выделения "своей" машины на графиках):**
- `--my-year YYYY` — год твоей машины
- `--my-mileage K` — пробег в км
- `--my-price USD` — твоя желаемая цена в долларах
- `--my-label "..."` — подпись маркера (default: "Наша машина")

**Прочие:**
- `--rate FLOAT` — курс BYN/USD (default: 2.8)
- `--max-pages INT` — лимит страниц (default: 30)
- `--exclude-damaged` — отрезает аварийные / на запчасти / новые (добавляет `condition[0]=2` к URL). Рекомендуется для оценки рыночной цены — иначе outliers за $11к битых машин ломают статистику.
- `--format png|html|pdf` — формат вывода (default: `png`, рекомендуется). PNG = полная картинка в файле без сжатия Telegram. HTML/PDF — для отладки.
- `--width INT` — ширина viewport для PNG (default: `720`, fits mobile screens).
- `--output PATH` — путь файла (default: `tmp/output/market-scan-<timestamp>.<ext>`)

## Examples

Базовый скан Volvo XC90 II generation:
```
python3 skills/market-scan/market-scan.py "https://cars.av.by/filter?brands%5B0%5D%5Bbrand%5D=1238&brands%5B0%5D%5Bmodel%5D=1263&brands%5B0%5D%5Bgeneration%5D=2774"
```

С маркером "наша машина":
```
python3 skills/market-scan/market-scan.py \
  "https://cars.av.by/filter?brands%5B0%5D%5Bbrand%5D=1238&brands%5B0%5D%5Bmodel%5D=1263&brands%5B0%5D%5Bgeneration%5D=2774" \
  --my-year 2018 --my-mileage 250000 --my-price 28000 --my-label "Наша Volvo"
```

## Output

PNG (по умолчанию) в `tmp/output/market-scan-<timestamp>.png`, портретный 705×~3500. Без `photo-` префикса → летит файлом (без сжатия Telegram).

Chart.js запекается inline в HTML промежуточный → рендерится через stealth-headless Chromium при 720px viewport → PNG.

Содержит:
1. **Header** — фильтр, количество объявлений, дата сбора, медианная цена
2. **Гистограмма распределения цен**
3. **Scatter: цена vs пробег** (с маркером "наша машина" если задана)
4. **Box plot цен по годам**
5. **Bar chart медианных цен по городам** (топ-10)
6. **Топ-5 самых дешёвых** (карточки)
7. **Топ-5 самых дорогих** (карточки)

## How it works

1. Открывает URL → парсит "На странице X объявлений из N" → знает количество страниц
2. Через `stealth-browser html` тянет все страницы параллельно (av.by блочит обычный agent-browser)
3. Парсит HTML карточки (`listing-item` блоки) → достаёт год, пробег, цена BYN, топливо, объём, город, URL
4. Через matplotlib генерирует 4 чарта → PNG в tmp/
5. HTML-шаблон с инлайн-стилями + base64 PNG → `tmp/market-scan.html`
6. `agent-browser pdf` рендерит в PDF

## Network

av.by использует Tengine WAF (`Debugging Detected`). Обычный `agent-browser` блокируется. Используется `stealth-browser html` (Patchright) — работает без proxy с серверного IP.

## Limitations

- **Только av.by.** Не работает с kufar/abw — для них нужен отдельный скилл/парсер.
- **Пагинация** работает только через `/filter?...&page=N`. Если дан `/brand/model` URL — скилл сам конвертирует в filter-URL через extract из первой страницы.
- **Парсер хрупкий к редизайну av.by.** Если av.by поменяет HTML классы (`listing-item__params`, `listing-item__price-primary`) — парсер сломается. Логи покажут "Total cards: 0".
- **Анти-бот лимиты.** stealth-browser открывает ~25-секундное окно WAF-чек на каждый запрос. 16 страниц = ~6-8 минут даже параллельно.
- **Курс BYN/USD** — статичный (default 2.8). Не тянет с НБРБ онлайн. Передай актуальный через `--rate`.

## Smoke test

```bash
python3 skills/market-scan/market-scan.py \
  "https://cars.av.by/filter?brands%5B0%5D%5Bbrand%5D=1238&brands%5B0%5D%5Bmodel%5D=1263&brands%5B0%5D%5Bgeneration%5D=2774" \
  --my-year 2018 --my-mileage 250000 --my-price 28000
```

Должно вернуть путь к PDF и не упасть.

## Learnings
- [[2026-05-22]] [[market-scan]] При av.by URL машины или просьбе оценить рынок — запускать market-scan с --exclude-damaged. Дефолт PNG 720px. Для продаваемой машины добавлять --my-year/--my-mileage/--my-price/--my-label.
