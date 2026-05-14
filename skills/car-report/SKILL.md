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
- [2026-05-09] [[car-report]] Skill для генерации PDF-отчётов по машинам создан 2026-05-08. Workflow: обновить markdown в projects/cars/ (shortlist.md и др.) → обновить template.html → bash skills/car-report/render-pdf.sh tmp/car-report.html. PDF идёт в tmp/output/ автоматически. Шаблон в skills/car-report/template.html (35K). При следующих итерациях не делать заново — использовать этот pipeline.
- [2026-05-10] [[car-report]] Ключевые факты про дилеров EV в РБ (май 2026): (1) avatr.by + xpeng.by — официалы от ООО АВТОВЕЛЬТ, общий шоурум на пр. Победителей пер. Веснинка 16 (один контакт = две марки). (2) Atlant-M Электромобили — официал BYD/Zeekr/Lixiang/VW/Leapmotor, шоурумы Лещинского 4 и Тойота-центр Восток (Независимости 202/1). Trade-in аукцион: +375 44 712-24-81, atlantm-auction.by — лучший вариант для Volvo XC90 (они же официал Volvo). (3) Evolution Car (evolutioncar.by) — Слава брал у них Zeekr и недоволен, после оплаты забили. Помечено как 'не идти'. (4) Zeekr 001 цены на av.by сильно зависят от комплектации: Standard/WE/Long Range RWD ~$32-39к, YOU RWD топ ~$35-39к, Privilege AWD топ ~$42-46к, FR (1265 л.с.) ~$65к. При оценке 2nd-hand Zeekr — всегда уточнять полную комплектацию (привод, моторов сколько, батарею).
- [2026-05-11] [[car-report]] 'BYD Bao 7' не существует на autohome — на самом деле это **方程豹 钛7 (FangChengBao Titanium 7)**, series 8171. Актуальный модельный ряд FangChengBao: 钛7 (BEV+EREV), 钛3, 豹8 (PHEV), 豹5 (PHEV). Под профиль Vovan'а (AWD BEV) подходит 2026款 EV 675KM 四驱闪充版 — Blade 2gen LMFP, мегаваттная зарядка 10-70% за 5 мин. Во всех файлах projects/cars/ нужно переименовать.
- [2026-05-11] [[car-report]] autohome series IDs финалистов шортлиста (мэппинг для будущих сессий): Leapmotor D19 = 8273 | Xpeng G9 = 6492 | Avatr 11 = 6354 | BYD Tang L EV = 8005 | FangChengBao 钛7 (Titanium 7) = 8171 | BYD Sealion 7 = 6851. Открывать через autohome.com.cn/config/series/{ID}.html для конфига и цен, /price/series-{ID}.html для текущих скидок, /cars/imglist-x-x-{ID}-x-x-{trim}-x-x-1-1.html для цветов кузова и интерьера.
- [2026-05-12] [[car-report]] Финальный pivot шортлиста (2026-05-11 вечер): **Xpeng G9 2026款 680 四驱 Max** (27.88万¥, ~$38.5к) переходит в pole position вместо BYD Tang L EV. Причина: у Tang L EV 600KM 四驱 旗舰 — **СТАЛЬНЫЕ ПРУЖИНЫ, не пневма** (несмотря на мой первоначальный stereotype 'BYD топ = пневма'). DiSus-A пневма у BYD только в Denza Z9 GT/N9, Yangwang U8/U9, Han L топовые DM AWD. G9 имеет dual-chamber пневму + CDC (175→215мм lift mode, почти XC90 228мм), эффективнее (15.6 vs 19.1 кВтч/100км), +50 км реальный запас зимой (408 vs 360), 12-мин DC зарядка vs Tang L 7-мин но 1000 кВт станций в РБ нет. Tang L побеждает только в кинематике (5-link vs 4-link), размере (5040×1996×1760 vs 4891×1937×1670), 7 мест, мощности (1102 vs 575 л.с., overkill). Под профиль Vovan'а 100-130 км/день + дача + бордюры пневма решает.
- [2026-05-12] [[car-report]] BYD DiSus-A полная воздушная подвеска идёт только в: Denza Z9 GT, Denza N9, Yangwang U8 (там и DiSus-P гидравлическая), Yangwang U9, BYD Han L топовые DM AWD trim'ы. **НЕ идёт в** Sealion 7 (любые), Tang L EV любой, Song L EV, FangChengBao 钛7. DiSus-C это adaptive damping (стальные пружины + регулируемые амортизаторы, не пневма). Не предполагать что 'топ-BYD = пневма', проверять конкретный trim по строке 空气悬挂类型 на autohome — если её нет, пневмы нет.
- [2026-05-13] [[car-report]] Xpeng G9 2025-2026 моделей перешёл на **LFP** (CALB 磷酸铁锂 Shenxing PLUS 5C super-charging), НЕ NMC как я думала ранее. Третья ошибка за неделю с батареями. Сейчас в нашем шортлисте: G9, Tang L EV, Avatr 07, Sealion 7, FangChengBao 钛7, Song L — все на LFP. NMC только у Avatr 11, Zeekr 7X, Voyah Free (старые модели). Реальная зимняя просадка при -20°C: обе LFP теряют ~50% от CLTC. Разница в реальном запасе между G9 и Tang L (~30 км) — в основном из-за расхода машины (15.6 vs 19.1 кВтч/100км), не из-за химии. BYD Blade 2.0 LMFP лучше Blade 1.0 на 10-15% по холоду, но CALB 5C тоже next-gen — разница маленькая. 1000V Tang L — преимущество только для Китая (в РБ 1000V станций нет).
- [2026-05-13] [[car-report]] **Voltauto (Евгений) — серый импорт BYD через MOFCOM "спецтехника" схему.** Не рекомендовать Vovan. Машина растамаживается в Китае как "учебный авто" (доп.педали, сверлят пол) или "спецтехника" (маячки, сверлят крышу) — после вывоза "доработки" снимают, дырки заваривают. Риски: (1) дырки = потеря герметичности + точка коррозии; (2) сбитая калибровка LiDAR/ADAS; (3) BYD blacklist VIN → 0 заводской гарантии (особенно 8 лет/160k на батарею); (4) MOFCOM делится с EAEU с 2026 → постимпортная проверка → конфискация + штраф до 30%; (5) перепродажа просядет на 30-50%. Цена 0 700 за Tang L EV 600KM 4WD Flagship с обещанным полным PPF полиуретан 190мкм + шведский антикор + ключ-карта МАТЕМАТИЧЕСКИ НЕВОЗМОЖНА (китайская дилерская 7.6k, накрутка .1k не покрывает PPF -5k + антикор -2k + логистику -3k). Альтернативы: Atlant-M официально, Avatr/Zeekr/Xpeng через прямые каналы, или машина >180 дней с регистрации.
