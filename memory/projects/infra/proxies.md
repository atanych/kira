# Proxies & WAF-bypass для китайских сайтов

Заметки про работу с китайскими сайтами, которые блокируют не-CN IP.

---

## 🇨🇳 Сайты, блокирующие не-китайские IP

### Dongchedi.com (ByteDance) и часть китайских сайтов

Блочат через **Tengine WAF**:
- Возвращают пустой body с фейковым Content-Type
- Или `'Download is starting'` через Content-Disposition

**Stealth-browser НЕ пробивает** — проблема не в JS-stealth (это последний слой), а в **IP geo + TLS fingerprint**.

### Что работает / не работает

| Сайт | Без proxy | Через CN-proxy |
|---|---|---|
| autohome.com.cn | ✅ | ✅ |
| dongchedi.com | ❌ | ✅ |
| 抖音商城 (Douyin Mall) | ❌ | ✅ |

---

## 🛠️ Решение — residential proxy с китайским exit

**Провайдеры** ($15-30/мес):
- Bright Data
- Smartproxy
- IPRoyal

**Подключение:** через env-переменную `STEALTH_BROWSER_PROXY`. Playwright нативно умеет `--proxy-server`.

**Stealth-browser bin живёт в `volatclaw/bin/stealth-browser.mjs`** — это вне territory Kira. Могу предложить diff, но не редактировать.

Источник: зафиксировано 2026-05-15.
