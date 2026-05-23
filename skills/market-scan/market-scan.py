#!/usr/bin/env python3
"""market-scan — fetch av.by listings by filter URL, render PDF report with charts."""
import argparse, sys, os, re, html, json, subprocess, time, pathlib, datetime
from concurrent.futures import ThreadPoolExecutor, as_completed

SCRIPT_DIR = pathlib.Path(__file__).parent
WORK_DIR = pathlib.Path("tmp/market-scan-work")
WORK_DIR.mkdir(parents=True, exist_ok=True)
OUTPUT_DIR = pathlib.Path("tmp/output")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# ─────────────────────────── HTML parsing ───────────────────────────

def _clean(s):
    return html.unescape(s).replace("\xa0", " ").replace(" ", " ").strip()

def parse_html(text):
    cards = re.split(r'<div[^>]*class="listing-item(?:\s|")', text)
    cars = []
    for card in cards[1:]:
        # span may contain Vue comments (<!-- -->) — match non-greedy and strip
        title_m = re.search(r'class="listing-item__link"[^>]*>\s*<span[^>]*>(.+?)</span>', card, re.DOTALL)
        title = None
        if title_m:
            raw = re.sub(r'<!--.*?-->', '', title_m.group(1), flags=re.DOTALL)
            raw = re.sub(r'<[^>]+>', '', raw)
            title = _clean(raw)

        params_block_m = re.search(
            r'class="listing-item__params">(.*?)(?=<div[^>]*class="listing-item__price)',
            card, re.DOTALL)
        params_block = params_block_m.group(1) if params_block_m else ""

        year = None
        ym = re.search(r'<div>(\d{4})\s*&nbsp;г\.</div>', params_block) or \
             re.search(r'(\d{4})\s+г\.', _clean(params_block))
        if ym:
            year = int(ym.group(1))

        specs = ""
        for sm in re.finditer(r'<div>(.+?)</div>', params_block, re.DOTALL):
            raw = re.sub(r'<!--.*?-->', '', sm.group(1), flags=re.DOTALL)
            raw = re.sub(r'<[^>]+>', '', raw)
            txt = _clean(raw)
            if any(k in txt for k in ["дизель", "бензин", "электро", "автомат", "механик"]):
                specs = txt
                break

        mileage = None
        mm = re.search(r'<span>([\d\s\xa0 ]+)\s*&nbsp;?км</span>', params_block)
        if mm:
            mileage = int(re.sub(r"[\s\xa0 ]", "", _clean(mm.group(1))))
        else:
            mm2 = re.search(r'(\d[\d\s\xa0 ]+)\s*&nbsp;км', card)
            if mm2:
                mileage = int(re.sub(r"[\s\xa0 ]", "", _clean(mm2.group(1))))

        price = None
        pm = re.search(r'class="listing-item__price-primary"[^>]*>([^<]+)<', card)
        if pm:
            ps = _clean(pm.group(1))
            mp = re.match(r"(\d[\d ]+)", ps)
            if mp:
                price = int(mp.group(1).replace(" ", ""))

        loc_m = re.search(r'class="listing-item__location"[^>]*>([^<]+)<', card)
        location = _clean(loc_m.group(1)) if loc_m else ""

        url_m = re.search(r'class="listing-item__link"[^>]*href="([^"]+)"', card)
        url = ("https://cars.av.by" + url_m.group(1)) if url_m else None

        if not price:
            continue
        cars.append({
            "title": title, "year": year, "specs": specs,
            "mileage_km": mileage, "price_byn": price,
            "location": location, "url": url,
        })
    return cars

def fuel_of(specs):
    s = specs or ""
    if "электро" in s: return "electric"
    if "гибрид" in s: return "hybrid"
    if "дизель" in s: return "diesel"
    if "бензин" in s: return "petrol"
    return "?"

# ─────────────────────────── fetching ───────────────────────────

def stealth_fetch(url, retries=2):
    """Fetch URL via stealth-browser, return HTML text."""
    for attempt in range(retries + 1):
        try:
            r = subprocess.run(
                ["stealth-browser", "html", url],
                capture_output=True, text=True, timeout=60,
            )
            if r.returncode == 0 and len(r.stdout) > 2000:
                return r.stdout
            time.sleep(1)
        except subprocess.TimeoutExpired:
            time.sleep(2)
    return ""

def detect_total_pages(first_html):
    m = re.search(r"объявлений из (\d+)", first_html)
    total = int(m.group(1)) if m else 0
    per_page = 25
    pages = (total + per_page - 1) // per_page if total else 1
    return total, pages

def make_filter_url_from_first_page(first_html, original_url):
    """If user gave a pretty URL, find the pagination filter URL from page links."""
    if "/filter?" in original_url:
        return original_url
    m = re.search(r'href="(/filter\?[^"]+?)(?:&amp;|&)page=\d+"', first_html)
    if m:
        href = m.group(1).replace("&amp;", "&")
        return "https://cars.av.by" + href
    # fallback: try appending ?page=N to original URL (might not paginate, but try)
    return original_url

def fetch_all_pages(base_filter_url, total_pages, max_pages):
    """Fetch all pages in parallel via stealth-browser."""
    pages_to_fetch = min(total_pages, max_pages)
    htmls = [None] * pages_to_fetch
    sep = "&" if "?" in base_filter_url else "?"

    def fetch_one(idx):
        page_num = idx + 1
        url = base_filter_url if page_num == 1 else f"{base_filter_url}{sep}page={page_num}"
        return idx, stealth_fetch(url)

    with ThreadPoolExecutor(max_workers=8) as ex:
        futs = [ex.submit(fetch_one, i) for i in range(pages_to_fetch)]
        for fut in as_completed(futs):
            idx, h = fut.result()
            htmls[idx] = h
            print(f"  fetched page {idx+1}/{pages_to_fetch}", file=sys.stderr)
    return htmls

# ─────────────────────────── stats ───────────────────────────

def median(xs):
    s = sorted(xs)
    n = len(s)
    if not n: return None
    return s[n//2] if n % 2 else (s[n//2-1] + s[n//2]) / 2

def percentile(xs, p):
    s = sorted(xs)
    n = len(s)
    if not n: return None
    k = int(p/100 * (n-1))
    return s[k]

def stats_block(cars, rate):
    prices = [c["price_byn"] for c in cars if c["price_byn"]]
    return {
        "count": len(cars),
        "min_byn": min(prices) if prices else 0,
        "max_byn": max(prices) if prices else 0,
        "median_byn": median(prices) or 0,
        "p25_byn": percentile(prices, 25) or 0,
        "p75_byn": percentile(prices, 75) or 0,
        "min_usd": round((min(prices) if prices else 0) / rate),
        "max_usd": round((max(prices) if prices else 0) / rate),
        "median_usd": round((median(prices) or 0) / rate),
        "p25_usd": round((percentile(prices, 25) or 0) / rate),
        "p75_usd": round((percentile(prices, 75) or 0) / rate),
    }

def by_year(cars):
    out = {}
    for c in cars:
        if not c["year"] or not c["price_byn"]: continue
        out.setdefault(c["year"], []).append(c["price_byn"])
    return {y: sorted(prices) for y, prices in sorted(out.items())}

def by_city(cars):
    out = {}
    for c in cars:
        if not c["location"] or not c["price_byn"]: continue
        out.setdefault(c["location"], []).append(c["price_byn"])
    return out

# ─────────────────────────── rendering ───────────────────────────

def render_html(cars, stats, by_year_data, by_city_data, args, query_info):
    rate = args.rate
    cars_for_js = [
        {
            "year": c["year"] or 0,
            "mileage": c["mileage_km"] or 0,
            "price_byn": c["price_byn"],
            "price_usd": round(c["price_byn"] / rate),
            "fuel": fuel_of(c["specs"]),
            "city": c["location"] or "",
            "url": c["url"] or "",
        }
        for c in cars if c["price_byn"]
    ]
    cars_for_js.sort(key=lambda x: x["price_usd"])
    cheapest = cars_for_js[:5]
    most_expensive = cars_for_js[-5:][::-1]

    # By year for box-plot-ish (we'll use min/p25/median/p75/max bars)
    yr_data = []
    for y in sorted(by_year_data.keys()):
        ps = by_year_data[y]
        yr_data.append({
            "year": y,
            "count": len(ps),
            "min": round(min(ps)/rate),
            "p25": round(percentile(ps, 25)/rate),
            "median": round(median(ps)/rate),
            "p75": round(percentile(ps, 75)/rate),
            "max": round(max(ps)/rate),
        })

    # Top cities by count (min 3 cars)
    city_ranked = sorted(
        [(c, by_city_data[c]) for c in by_city_data if len(by_city_data[c]) >= 2],
        key=lambda kv: -len(kv[1])
    )[:10]
    city_data = [
        {"city": c, "count": len(ps), "median": round(median(ps)/rate)}
        for c, ps in city_ranked
    ]

    template_path = SCRIPT_DIR / "template.html"
    template = template_path.read_text(encoding="utf-8")

    # Inline design CSS — relative URLs don't resolve from tmp/market-scan-work/
    design_dir = pathlib.Path("design")
    tokens_css = (design_dir / "tokens.css").read_text(encoding="utf-8") if (design_dir / "tokens.css").exists() else ""
    base_css = (design_dir / "base.css").read_text(encoding="utf-8") if (design_dir / "base.css").exists() else ""
    # base.css starts with `@import "./tokens.css"` — strip since we inline tokens above it
    base_css = re.sub(r'@import\s+["\'][^"\']+["\'];\s*', '', base_css)
    template = template.replace("__TOKENS_CSS__", tokens_css).replace("__BASE_CSS__", base_css)

    # Inline Chart.js — self-contained HTML, no CDN dependency
    chart_js_path = SCRIPT_DIR / "chart.umd.min.js"
    chart_js = chart_js_path.read_text(encoding="utf-8") if chart_js_path.exists() else ""
    template = template.replace("__CHARTJS__", chart_js)

    my_marker = None
    if args.my_year and args.my_mileage and args.my_price:
        my_marker = {
            "year": args.my_year,
            "mileage": args.my_mileage,
            "price": args.my_price,
            "label": args.my_label,
        }

    payload = {
        "title": query_info.get("title", "Анализ рынка av.by"),
        "filter_url": query_info.get("url", ""),
        "generated_at": datetime.datetime.now().strftime("%d.%m.%Y %H:%M"),
        "rate": rate,
        "stats": stats,
        "cars": cars_for_js,
        "year_data": yr_data,
        "city_data": city_data,
        "cheapest": cheapest,
        "most_expensive": most_expensive,
        "my_marker": my_marker,
    }

    rendered = template.replace("__PAYLOAD_JSON__", json.dumps(payload, ensure_ascii=False))
    out = WORK_DIR / "report.html"
    out.write_text(rendered, encoding="utf-8")
    return out

def render_pdf(html_path, pdf_path):
    abs_html = html_path.resolve()
    abs_pdf = pdf_path.resolve()
    subprocess.run(["npx", "agent-browser", "close", "--all"],
                   capture_output=True, text=True)
    r = subprocess.run(
        ["npx", "agent-browser", "batch",
         f"open file://{abs_html}",
         "wait 3500",
         f"pdf {abs_pdf}"],
        capture_output=True, text=True, timeout=120,
    )
    if r.returncode != 0:
        print("agent-browser stderr:", r.stderr, file=sys.stderr)
        print("agent-browser stdout:", r.stdout, file=sys.stderr)
        return False
    return abs_pdf.exists()

def export_html(html_path, dst_path):
    """Copy rendered HTML to user-visible output dir."""
    import shutil
    dst_path.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(html_path, dst_path)
    return dst_path.exists()

def render_png(html_path, png_path, width=720):
    """Render HTML to a full-page PNG via agent-browser at a fixed viewport width.
    Default 720px = fits mobile screens 1:1 without horizontal scroll."""
    abs_html = html_path.resolve()
    abs_png = png_path.resolve()
    subprocess.run(["npx", "agent-browser", "close", "--all"], capture_output=True, text=True)
    # Use a tall viewport so Chart.js renders into the actual final dimensions
    # — avoids re-layout during --full screenshot capture.
    r = subprocess.run(
        ["npx", "agent-browser", "batch",
         "open about:blank",
         f"set viewport {width} 4000",
         f"open file://{abs_html}",
         "wait 3500",
         f"screenshot {abs_png} --full"],
        capture_output=True, text=True, timeout=120,
    )
    if r.returncode != 0:
        print("agent-browser stderr:", r.stderr, file=sys.stderr)
        print("agent-browser stdout:", r.stdout, file=sys.stderr)
        return False
    return abs_png.exists()

# ─────────────────────────── main ───────────────────────────

def main():
    ap = argparse.ArgumentParser(description="av.by market scan → PDF report")
    ap.add_argument("url", help="av.by filter URL")
    ap.add_argument("--my-year", type=int)
    ap.add_argument("--my-mileage", type=int)
    ap.add_argument("--my-price", type=int)
    ap.add_argument("--my-label", default="Наша машина")
    ap.add_argument("--rate", type=float, default=2.8, help="BYN per USD")
    ap.add_argument("--max-pages", type=int, default=30)
    ap.add_argument("--exclude-damaged", action="store_true",
                    help="Exclude аварийный / на запчасти / новые (condition[0]=2)")
    ap.add_argument("--format", choices=["png", "html", "pdf"], default="png",
                    help="Output format (default: png — full-page screenshot, sent as uncompressed file)")
    ap.add_argument("--width", type=int, default=720,
                    help="PNG viewport width in px (default: 720, fits mobile screens)")
    ap.add_argument("--output")
    args = ap.parse_args()

    # Auto-append condition filter if requested
    if args.exclude_damaged and "condition" not in args.url:
        sep = "&" if "?" in args.url else "?"
        args.url = f"{args.url}{sep}condition%5B0%5D=2"
        print(f"  Applied --exclude-damaged: condition[0]=2", file=sys.stderr)

    # 1. Fetch first page → detect total pages
    print(f"[1/4] Fetching first page to detect pagination…", file=sys.stderr)
    first_html = stealth_fetch(args.url)
    if not first_html:
        print("ERROR: Could not fetch first page", file=sys.stderr)
        sys.exit(1)
    total, pages = detect_total_pages(first_html)
    print(f"  Total listings: {total}, pages: {pages}", file=sys.stderr)
    if total == 0:
        print("ERROR: 0 listings on page — bad filter URL or empty result", file=sys.stderr)
        sys.exit(1)

    # 2. Convert URL to filter URL for proper pagination
    base_filter = make_filter_url_from_first_page(first_html, args.url)
    print(f"  Pagination URL: {base_filter[:80]}…", file=sys.stderr)

    # 3. Fetch remaining pages
    print(f"[2/4] Fetching {min(pages, args.max_pages)} pages in parallel…", file=sys.stderr)
    all_htmls = [first_html]
    if pages > 1:
        # Always refetch via filter URL to be consistent
        all_htmls = fetch_all_pages(base_filter, pages, args.max_pages)

    # 4. Parse all cards
    print(f"[3/4] Parsing listings…", file=sys.stderr)
    cars = []
    for h in all_htmls:
        if h:
            cars.extend(parse_html(h))
    # Dedupe by URL
    seen, unique = set(), []
    for c in cars:
        key = c["url"] or (c["year"], c["mileage_km"], c["price_byn"], c["location"])
        if key in seen: continue
        seen.add(key)
        unique.append(c)
    print(f"  Parsed: {len(unique)} unique listings", file=sys.stderr)
    if not unique:
        print("ERROR: No listings parsed (parser may be broken)", file=sys.stderr)
        sys.exit(1)

    # Extract human title from first listing for header
    # Titles look like "Volvo XC90 II · Рестайлинг, 7 мест" — take part before comma
    sample_title = None
    for c in unique:
        if c.get("title"):
            sample_title = c["title"]; break
    if not sample_title:
        sample_title = "av.by"
    sample_title = re.sub(r"\s+", " ", sample_title).strip()
    title_for_header = sample_title.split(",")[0].strip() if "," in sample_title else sample_title

    # 5. Compute stats
    stats = stats_block(unique, args.rate)
    by_yr = by_year(unique)
    by_ct = by_city(unique)

    # 6. Render output
    print(f"[4/4] Rendering {args.format.upper()}…", file=sys.stderr)
    html_path = render_html(unique, stats, by_yr, by_ct, args, {
        "title": title_for_header,
        "url": args.url,
    })

    ts = datetime.datetime.now().strftime("%Y%m%d-%H%M%S")
    ext = args.format
    out_path = pathlib.Path(args.output) if args.output else OUTPUT_DIR / f"market-scan-{ts}.{ext}"
    out_path.parent.mkdir(parents=True, exist_ok=True)

    if args.format == "pdf":
        ok = render_pdf(html_path, out_path)
    elif args.format == "png":
        ok = render_png(html_path, out_path, width=args.width)
    else:
        ok = export_html(html_path, out_path)
    if not ok:
        print(f"Render failed. HTML draft at {html_path}", file=sys.stderr)
        sys.exit(2)

    print(f"\n✓ Report saved: {out_path}")
    print(f"  Listings: {len(unique)} | Median: {stats['median_byn']} BYN (${stats['median_usd']})")
    print(f"  Range:    ${stats['min_usd']}–${stats['max_usd']}")

if __name__ == "__main__":
    main()
