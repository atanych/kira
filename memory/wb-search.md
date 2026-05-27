# Wb Search

Скилл готов: поиск товаров на wildberries.by через BY-прокси + agent-browser....

## Log
- [[2026-05-25]] [[wb-search]] Скилл готов: поиск товаров на wildberries.by через BY-прокси + agent-browser. Триггер — 'найди на WB <товар>'. WB search JSON-эндпоинт теперь требует PoW (x-pow header в 429), голым curl не пробить — обход через SPA-рендер. DOM-селекторы: article.product-card, data-nm-id, .product-card__brand, .price__lower-price, ins/del для текущей/старой цены, .address-rate-mini для рейтинга, .product-card__count для отзывов. Картинки на *.wbbasket.ru, качаем тем же BY-прокси.
- [[2026-05-26]] [[wb-search]] WB search API закрутил гайки 2026-05 — требует **PoW (Proof of Work, `x-pow` header в response)**. Прямой curl/JSON отдаёт 429 даже с правильными браузерными хедерами и BY-прокси. Workaround: для search использовать agent-browser (JS-движок пробьёт PoW автоматически), для известных артикулов — JSON `card.wb.ru/cards/v2/detail?nm={article_id}` работает нормально. Скорость: 3-5 сек на search через браузер vs 0.5 сек чистого JSON, но стабильно. Ozon заблокировал даже с BY-прокси (IP в чёрных списках), пока вне скилла.
