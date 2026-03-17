// 정적 업체 상세 페이지 생성 스크립트
// 사용법: node generate-static-pages.js

const fs = require('fs');
const path = require('path');

const ROOT_DIR = __dirname;
const SHOPS_JSON_PATH = path.join(ROOT_DIR, 'shops.json');
const OUTPUT_DIR = path.join(ROOT_DIR, 'shops');

function loadShops() {
  const raw = fs.readFileSync(SHOPS_JSON_PATH, 'utf8');

  let jsonStr = raw.replace(/^window\.shopsData\s*=\s*/, '').trim();
  jsonStr = jsonStr.replace(/;?\s*$/, '');

  const data = JSON.parse(jsonStr);
  if (!Array.isArray(data.shops)) {
    throw new Error('shops.json의 shops 배열을 찾을 수 없습니다.');
  }
  return data.shops;
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildCoursesHtml(courses) {
  if (!Array.isArray(courses) || courses.length === 0) {
    return '<li class="course-item">코스 정보는 문의 부탁드립니다.</li>';
  }

  const items = [];
  courses.forEach((course) => {
    const category = escapeHtml(course.category || '');
    const header =
      category && category.trim().length > 0
        ? `<li class="course-category">${category}</li>`
        : '';

    if (Array.isArray(course.items)) {
      course.items.forEach((item) => {
        const name = escapeHtml(item.name || '');
        const price = escapeHtml(item.price || '');
        const duration = escapeHtml(item.duration || '');
        const desc = escapeHtml(item.description || '');

        items.push(
          `${header}<li class="course-item"><div class="course-main"><span class="course-name">${name}</span><span class="course-price">${price}</span></div><div class="course-sub"><span class="course-duration">${duration}</span><span class="course-desc">${desc}</span></div></li>`
        );
      });
    }
  });

  if (items.length === 0) {
    return '<li class="course-item">코스 정보는 문의 부탁드립니다.</li>';
  }
  return items.join('\n');
}

function buildFeaturesHtml(features) {
  if (!Array.isArray(features) || features.length === 0) {
    return '<li class="feature-item">업체 특징은 문의 시 안내드립니다.</li>';
  }
  return features
    .map((f) => `<li class="feature-item">${escapeHtml(f)}</li>`)
    .join('\n');
}

function buildReviewsHtml(reviews) {
  if (!Array.isArray(reviews) || reviews.length === 0) {
    return '<li class="review-item">아직 등록된 후기가 없습니다.</li>';
  }
  return reviews
    .map((r) => {
      const name = escapeHtml(r.name || r.author || '익명');
      const rating = typeof r.rating === 'number' ? r.rating : '';
      const date = escapeHtml(r.date || '');
      const comment = escapeHtml(r.comment || r.review || '');
      return `<li class="review-item"><div class="review-header"><span class="review-author">${name}</span><span class="review-rating">⭐ ${rating}</span><span class="review-date">${date}</span></div><p class="review-comment">${comment}</p></li>`;
    })
    .join('\n');
}

function buildHtmlForShop(shop) {
  const id = String(shop.id);
  const name = escapeHtml(shop.name || '업체명 미정');
  const region = escapeHtml(shop.region || '');
  const district = escapeHtml(shop.district || '');
  const dong = escapeHtml(shop.dong || '');
  const locationText = [region, district, dong].filter(Boolean).join(' ');

  const rating = typeof shop.rating === 'number' ? shop.rating.toFixed(1) : '0.0';
  const reviewCount =
    typeof shop.reviewCount === 'number'
      ? shop.reviewCount
      : Array.isArray(shop.reviews)
      ? shop.reviews.length
      : 0;

  const phone = escapeHtml(shop.phone || '');
  const telHref = phone ? `tel:${phone.replace(/[^0-9+]/g, '')}` : '#';

  const price =
    escapeHtml(
      shop.price ||
        (shop.courses &&
          shop.courses[0] &&
          shop.courses[0].items &&
          shop.courses[0].items[0] &&
          shop.courses[0].items[0].price) ||
        '가격 문의'
    );

  const description = escapeHtml(
    shop.description ||
      `${name} ${locationText} 힐링 마사지샵입니다. 자세한 내용은 문의 주세요.`
  );

  const operatingHours = escapeHtml(shop.operatingHours || '문의');
  const fullAddress = escapeHtml(
    [shop.address, shop.detailAddress].filter(Boolean).join(' ')
  );

  const imageUrl = escapeHtml(
    shop.image || 'https://kyungrock.github.io/incheon-outcall/images/default.jpg'
  );
  const altText = escapeHtml(
    shop.alt || `${name} - ${locationText} 출장마사지 / 마사지샵`
  );

  const coursesHtml = buildCoursesHtml(shop.courses);
  const featuresHtml = buildFeaturesHtml(shop.features);
  const reviewsHtml = buildReviewsHtml(shop.reviews);

  const title = `${name} - ${locationText} 인천출장마사지 / 마사지`;
  const pageDescription = `${name} | ${locationText} | ${description}`;
  const canonicalUrl = `https://kyungrock.github.io/incheon-outcall/shops/${encodeURIComponent(
    id
  )}.html`;

  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <meta name="description" content="${pageDescription}">
  <meta name="robots" content="index,follow">
  <link rel="canonical" href="${canonicalUrl}">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${pageDescription}">
  <meta property="og:type" content="article">
  <meta property="og:locale" content="ko_KR">
  <meta property="og:url" content="${canonicalUrl}">
  <meta property="og:image" content="${imageUrl}">
  <link rel="stylesheet" href="../styles.css">
</head>
<body>
  <header class="header">
    <div class="container">
      <a href="../index.html" class="logo">인천출장마사지</a>
    </div>
  </header>

  <main class="main">
    <div class="detail-container">
      <a href="../index.html" class="btn-back">← 목록으로 돌아가기</a>

      <div class="detail-header">
        <h1 class="detail-title">${name}</h1>
        <div class="detail-meta">
          <div class="detail-rating">
            ⭐ ${rating} (${reviewCount})
          </div>
          <div class="detail-meta-location">📍 ${locationText}</div>
          ${
            phone
              ? `<a href="${telHref}" class="detail-meta-phone">📞 ${phone}</a>`
              : ''
          }
          <div class="detail-meta-price">💰 ${price}</div>
        </div>
      </div>

      <img src="${imageUrl}" alt="${altText}" class="detail-image" onerror="this.src='../images/default.jpg'">

      <div class="detail-section">
        <h2 class="detail-section-title">업체 소개</h2>
        <p class="detail-description">${description}</p>
        <div class="detail-info-item">
          <span class="detail-info-label">운영시간:</span>
          <span class="detail-info-value">${operatingHours}</span>
        </div>
        ${
          fullAddress
            ? `<div class="detail-info-item"><span class="detail-info-label">상세주소:</span><span class="detail-info-value">${fullAddress}</span></div>`
            : ''
        }
      </div>

      <div class="detail-section courses-section">
        <h2 class="detail-section-title">코스 및 가격</h2>
        <ul class="courses-list">
${coursesHtml}
        </ul>
      </div>

      <div class="detail-section staff-section">
        <h2 class="detail-section-title">관리사 정보</h2>
        <p class="detail-description">${escapeHtml(
          shop.staffInfo || '관리사 정보는 문의 시 안내드립니다.'
        )}</p>
      </div>

      <div class="detail-section features-section">
        <h2 class="detail-section-title">특징</h2>
        <ul class="features-list">
${featuresHtml}
        </ul>
      </div>

      <div class="detail-section">
        <h2 class="detail-section-title">리뷰</h2>
        <ul class="reviews-list">
${reviewsHtml}
        </ul>
      </div>
    </div>
  </main>

  <div class="detail-bottom-bar">
    ${
      phone
        ? `<a href="${telHref}" class="bottom-bar-phone">📞 전화걸기</a>`
        : '<span class="bottom-bar-phone disabled">📞 전화번호 문의</span>'
    }
  </div>

  <footer class="footer">
    <div class="container">
      <p>&copy; 2025 인천출장마사지. All rights reserved.</p>
    </div>
  </footer>
</body>
</html>
`;
}

function generateStaticPages() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const shops = loadShops();
  let count = 0;

  shops.forEach((shop) => {
    if (!shop || !shop.id) return;
    const id = String(shop.id);
    const filename = `${id}.html`;
    const filepath = path.join(OUTPUT_DIR, filename);

    const html = buildHtmlForShop(shop);
    fs.writeFileSync(filepath, html, 'utf8');
    count += 1;
  });

  console.log(
    `✅ 정적 상세 페이지 생성 완료: ${count}개 파일 생성 (경로: shops/*.html)`
  );
}

if (require.main === module) {
  try {
    generateStaticPages();
  } catch (err) {
    console.error('정적 페이지 생성 중 오류:', err);
    process.exit(1);
  }
}

module.exports = { generateStaticPages };

