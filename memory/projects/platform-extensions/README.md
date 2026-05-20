# Platform Extensions

Заметки по расширению volatclaw платформы новыми transport-ами и интеграциями.

## Files

- [[instagram]] — план добавления IG support через ManyChat Pro как BSP-прокси (vs своё Meta App). Архитектура: Meta → ManyChat webhook → volatclaw webhook → ответ через ManyChat API. 24-часовое окно DM. Реализация — вне territory Kira (volatclaw/src/manychat.ts).
