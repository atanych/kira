# Instagram support для volatclaw

Vovan хочет добавить Instagram support в платформу volatclaw (как сейчас telegram / slack / discord).

---

## 🎯 Рекомендация: ManyChat Pro как BSP-прокси

**Не** своё Meta App. ManyChat — Meta-аппрувленный партнёр (BSP).

### Почему ManyChat

- OAuth-онбординг IG за **5 минут** (vs App Review 3-4 недели у своего Meta App, могут реджектнуть)
- **DM + комменты** из коробки
- External Request / Webhooks
- Цена: **$15-99/мес за аккаунт**

### Архитектура

```
Meta → webhook → ManyChat → webhook → volatclaw → бот → ответ через ManyChat API → IG
```

### Что нужно сделать

Создать новый transport `volatclaw/src/manychat.ts` (по аналогии с telegram.ts / slack.ts).

⚠️ **Это вне моей territory** — могу предложить diff, но не редактировать `volatclaw/src/`.

### Ограничение Meta (не ManyChat)

**24-часовое окно DM остаётся.** После 24h с последнего сообщения юзера — только tagged messages.

---

## 🚫 Альтернативы (отказались)

| Вариант | Минусы |
|---|---|
| **Своё Meta App** | App Review 3-4 недели, могут реджектнуть |
| **Twilio Conversations** | DM ок, комменты — нет |
| **MessageBird / Sendbird** | Enterprise цены |
| **Apify** | Read-only, на запись — бан |

Источник: зафиксировано 2026-05-16.
