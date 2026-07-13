# File Format Limits

What `Read` can and can't parse when the user sends a file.

> [!warning] Read supports images (PNG/JPG) + PDF only
> Static images render inline. PDFs open (use the `pages` param for long ones). Everything else — video, .docx, .xlsx, audio, archives — Read doesn't parse.

> [!tip] .docx workaround
> If a .docx opens on retry after "перепроверь" — retry once before giving up. Otherwise ask user to convert to PDF or paste the text. Bash-based converters (unzip/pandoc/python-docx) aren't wired into any skill.

> [!tip] Video workaround
> Ask for a screenshot of the key frame — Read can't play .mp4/.mov/.webm.

## Log
- [[2026-06-21]] DOCX — Read tool не парсит (бинарный zip+XML), Bash залочен только под скиллы, ни в одном скилле нет docx-парсера (unzip/pandoc/python-docx — всё мимо). Если пользователь шлёт .docx — попросить конвертнуть в PDF или вставить текст. PDF через Read открывается норм. ВАЖНО: при повторной попытке (после 'перепроверь' от админа) — открылось. То есть либо песочница даёт второй проход с другими правами, либо первая попытка была преждевременной. Если документ важен и юзер настаивает — пробовать снова, не сдаваться сразу.
- [[2026-06-22]] Видеофайлы (.mp4 и т.п.) через Read не открываются — Read поддерживает только статические изображения (PNG/JPG) и PDF (с pages-параметром для длинных). Если юзер шлёт видео — попросить скриншот ключевого кадра. Аналогично DOCX (см. запись от 2026-06-21).
