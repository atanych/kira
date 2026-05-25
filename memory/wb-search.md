# Wb Search

Скилл готов: поиск товаров на wildberries.by через BY-прокси + agent-browser....

## Log
- [[2026-05-25]] [[wb-search]] Скилл готов: поиск товаров на wildberries.by через BY-прокси + agent-browser. Триггер — 'найди на WB <товар>'. WB search JSON-эндпоинт теперь требует PoW (x-pow header в 429), голым curl не пробить — обход через SPA-рендер. DOM-селекторы: article.product-card, data-nm-id, .product-card__brand, .price__lower-price, ins/del для текущей/старой цены, .address-rate-mini для рейтинга, .product-card__count для отзывов. Картинки на *.wbbasket.ru, качаем тем же BY-прокси.
