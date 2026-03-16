// sitemap.xml 자동 생성 스크립트
// 사용법: node generate-sitemap.js
// GitHub Pages 기준 URL: https://kyungrock.github.io/incheon-outcall/

const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://kyungrock.github.io/incheon-outcall';
const OUTPUT_FILE = path.join(__dirname, 'sitemap.xml');

function generateSitemap() {
  const files = fs.readdirSync(__dirname);

  // index.html + company-로 시작하는 상세 페이지들만 포함
  const urls = [];

  // 메인 페이지
  if (files.includes('index.html')) {
    urls.push({
      loc: `${BASE_URL}/`,
      priority: '1.0',
      changefreq: 'daily',
    });
  }

  // 상세 페이지들
  files
    .filter(
      (file) =>
        file.startsWith('company-') &&
        file.endsWith('.html')
    )
    .forEach((file) => {
      urls.push({
        loc: `${BASE_URL}/${encodeURI(file)}`,
        priority: '0.8',
        changefreq: 'weekly',
      });
    });

  const now = new Date().toISOString();

  const xmlItems = urls
    .map(
      (u) => `
  <url>
    <loc>${u.loc}</loc>
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

