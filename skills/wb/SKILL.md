# wb-search

## Description
Поиск товаров на Wildberries.by (РБ) — отдаёт топ-N карточек: название, бренд, цена в BYN, рейтинг, прямая ссылка и фото. Картинки сохраняются в `tmp/output/` префиксом `photo-` (улетают в чат превьюхами).

## When to use

Когда Vovan (или кто угодно в чате) говорит "найди на WB <запрос>" / "посмотри в вайлдберриз <товар>" — например "найди компостер", "посмотри льняную рубашку M размера" и т.д.

Не использовать для:
- Ozon — отдельный сервис, нужен другой обходной путь (Ozon банит наш BY-прокси как VPN).
- Поиск по артикулу — у WB JSON-эндпоинт `card.wb.ru/cards/v2/detail?nm=<id>` работает напрямую, скилл не нужен.

## Usage

```
npx tsx skills/wb/wb-search.ts "<query>" [--limit N] [--sort popular|priceup|pricedown|rate|newly]
```

## Arguments

**Positional:**
- `<query>` — поисковый запрос как для строки поиска WB ("рубашка лен мужская", "компостер пластиковый 200л" и т.д.).

**Optional:**
- `--limit N` — сколько товаров вернуть (default: 5, max: 10 — лимит фото-группы Telegram).
- `--sort <mode>` — сортировка: `popular` (default), `priceup`, `pricedown`, `rate`, `newly`.

## Output

**stdout:** markdown-список товаров с номерами, ценами, рейтингами и ссылками. Этот текст агент пересылает в чат.

**tmp/output/:** N фоток (по одной на товар) с именами `photo-wb-<idx>-<nmId>.jpg`. Платформа отправляет их в чат превьюхами (благодаря `photo-` префиксу).

## Network

Все запросы идут через BY-прокси:
- `agent-browser` запускается с `--proxy "$PROXY_BY"` (Chromium игнорирует `*_PROXY` env vars).
- Картинки качаются через `proxied by curl` (хосты `*.wbbasket.ru` теоретически работают и без прокси, но через тот же egress стабильнее).

Перед стартом скрипт вызывает `npx agent-browser close --all`, чтобы освободить любую не-прокси сессию. Если `$PROXY_BY` пустая — `proxied` упадёт с exit 3, скилл умрёт громко.

## How it works

1. WB search JSON-эндпоинт (`search.wb.ru/exactmatch/...`) теперь требует PoW (`x-pow` header в 429), голым curl не пробить.
2. Обход — открыть `wildberries.by/catalog/0/search.aspx?search=...` через `agent-browser` + BY-прокси. SPA рендерит карточки, JS-челлендж проходит сам.
3. Извлекаем структурированные данные из DOM (`article.product-card`) через `eval`.
4. Качаем первую картинку каждого товара через `proxied by curl`.

## Limitations

- ~3-6 секунд на запрос (cold-start + рендер SPA).
- Если WB сломает class names — DOM-селекторы (`article.product-card`, `.product-card__brand`, `.price__lower-price`) сломаются. Проверить — открыть search.aspx, заинспектить карточку.
- Только первая страница результатов (топ ~100 товаров, скилл берёт первые `--limit`).
- Цены в BYN. Курс не конвертим — что WB показал, то и отдаём.

## Examples

```
# Найти 5 льняных рубашек по популярности:
npx tsx skills/wb/wb-search.ts "рубашка лен мужская"

# Топ-10 компостеров по рейтингу:
npx tsx skills/wb/wb-search.ts "компостер садовый" --limit 10 --sort rate

# Самые дешёвые:
npx tsx skills/wb/wb-search.ts "термокружка 500мл" --sort priceup
```
