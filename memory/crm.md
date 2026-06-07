# Crm

Vovan отключил CRM-cron'ы 2026-06-04 (voice 'останови CRM который фарсит грей...

## Log
- [[2026-06-06]] [[CRM]] Vovan отключил CRM-cron'ы 2026-06-04 (voice 'останови CRM который фарсит грейн'). Перенесены в `crons/.disabled/`: **grain-sync.json** (каждые 15 мин в будни тянул Grain + recap) и **daily-recap.json** (вечерний final sync). Остался активным action-items-reminder. Если Vovan скажет вернуть — переместить из `crons/.disabled/` обратно в `crons/`, hot-reload подхватит.
