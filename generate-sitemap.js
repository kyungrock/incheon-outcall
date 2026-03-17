const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://kyungrock.github.io/incheon-outcall';
const OUTPUT_FILE = path.join(__dirname, 'sitemap.xml');
const SHOPS_JSON_PATH = path.join(__dirname, 'shops.json');

function loadShops() {
  const raw = fs.readFileSync(SHOPS_JSON_PATH, 'utf8');

  // 앞부분의 window.shopsData = 제거
  let jsonStr = raw.replace(/^window\.shopsData\s*=\s*/, '').trim();
  // 끝부분의 세미콜론 제거
  jsonStr = jsonStr.replace(/;?\s*$/, '');

  const data = JSON.parse(jsonStr);
  return Array.isArray(data.shops) ? data.shops : [];
}

function escapeXml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function generateSitemap() {
  const files = fs.readdirSync(__dirname);
  const shops = loadShops();

  const urls = [];

  // 메인 페이지
  if (files.includes('index.html')) {
    urls.push({
      loc: `${BASE_URL}/`,
      priority: '1.0',
      changefreq: 'daily',
    });
  }

  // 업체별 동적 상세 페이지 (detail.html?id=업체ID)
  shops.forEach((shop) => {
    if (!shop || !shop.id) return;
    const id = encodeURIComponent(String(shop.id));
    urls.push({
      loc: `${BASE_URL}/detail.html?id=${id}`,
      priority: '0.6',
      changefreq: 'daily',
    });
  });

  const now = new Date().toISOString();

  const xmlItems = urls
    .map(
      (u) => `
  <url>
    <loc>${escapeXml(u.loc)}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`
    )
    .join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="https://www.sitemaps.org/schemas/sitemap/0.9">
${xmlItems}
</urlset>
`;

  fs.writeFileSync(OUTPUT_FILE, xml.trim() + '\n', 'utf8');
  console.log(`✅ sitemap.xml 생성 완료! (${urls.length}개 URL 포함)`);
}

if (require.main === module) {
  try {
    generateSitemap();
  } catch (err) {
    console.error('sitemap 생성 중 오류:', err);
    process.exit(1);
  }
}

module.exports = { generateSitemap };

