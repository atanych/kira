#!/usr/bin/env node
// Extract color palette + hero image from autohome imglist page
// Usage: node extract-colors.js <seriesId>

const seriesId = process.argv[2];
if (!seriesId) {
  console.error('Usage: node extract-colors.js <seriesId>');
  process.exit(1);
}

const url = `https://www.autohome.com.cn/cars/imglist-x-x-${seriesId}-x-x-x-x-x-1-1.html`;

async function main() {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' }
  });
  const html = await res.text();

  // Extract __NEXT_DATA__
  const m = html.match(/<script id="__NEXT_DATA__"[^>]*>(.+?)<\/script>/s);
  if (!m) {
    console.error('No __NEXT_DATA__ found');
    process.exit(1);
  }
  const data = JSON.parse(m[1]);
  const props = data.props.pageProps;

  const result = {
    seriesId,
    seriesName: props.breadInfo?.seriesname,
    brandName: props.breadInfo?.brandname,
    specs: [],
    exteriorColors: (props.colorList?.color || []).map(c => ({
      id: c.id, hex: c.value, name: c.name, photoCount: c.piccount
    })),
    interiorColors: (props.icolorList?.color || []).map(c => ({
      id: c.id, hex: c.value, name: c.name, photoCount: c.piccount
    })),
    heroImage: null,
    heroImages: {}, // map colorId → first photo URL
  };

  // Specs (trims)
  for (const year of (props.specList || [])) {
    for (const s of (year.list || [])) {
      result.specs.push({
        specId: s.specid, name: s.specname, year: year.year,
        count: s.count, hasColor: s.hascolor, state: s.state
      });
    }
  }

  // First exterior photo as overall hero
  const callist = props.SeriesPicList?.picinfo?.callist || [];
  const exterior = callist.find(c => c.claid === 1);
  if (exterior && exterior.list?.[0]) {
    result.heroImage = exterior.list[0].picpath;
  }

  console.log(JSON.stringify(result, null, 2));
}

main().catch(e => { console.error(e); process.exit(1); });
