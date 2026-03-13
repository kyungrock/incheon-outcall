// 직접 실행 스크립트 (한글 경로 문제 해결)
const fs = require('fs');
const path = require('path');
const vm = require('vm');

// 현재 파일의 디렉토리
const scriptDir = __dirname;

console.log('스크립트 디렉토리:', scriptDir);

// shops.json 읽기
const shopsJsonPath = path.join(scriptDir, 'shops.json');
const indexTemplatePath = path.join(scriptDir, 'index.html');

console.log('shops.json 경로:', shopsJsonPath);
console.log('index.html 경로:', indexTemplatePath);

if (!fs.existsSync(shopsJsonPath)) {
    console.error('❌ shops.json 파일을 찾을 수 없습니다:', shopsJsonPath);
    process.exit(1);
}

if (!fs.existsSync(indexTemplatePath)) {
    console.error('❌ index.html 파일을 찾을 수 없습니다:', indexTemplatePath);
    process.exit(1);
}

// shops.json 읽기
const shopsJsonContent = fs.readFileSync(shopsJsonPath, 'utf8');
const context = { window: {} };
vm.createContext(context);
vm.runInContext(shopsJsonContent, context);
const shopsData = context.window.shopsData;

// index.html 템플릿 읽기
const template = fs.readFileSync(indexTemplatePath, 'utf8');

// 국기 이미지 HTML 생성
function generateFlagImages(country) {
    if (!country) return '';
    
    const countries = Array.isArray(country) ? country : [country];
    const flagMap = {
        'korea': { src: 'https://msg1000.com/images/한국.jpg', alt: '한국 국기', emoji: '🇰🇷' },
        'japan': { src: 'https://msg1000.com/images/일본.jpg', alt: '일본 국기', emoji: '🇯🇵' },
        'china': { src: 'https://msg1000.com/images/중국.jpg', alt: '중국 국기', emoji: '🇨🇳' },
        'thailand': { src: 'https://msg1000.com/images/태국.jpg', alt: '태국 국기', emoji: '🇹🇭' },
        'vietnam': { src: 'https://msg1000.com/images/베트남.jpg', alt: '베트남 국기', emoji: '🇻🇳' }
    };

    return countries.map(country => {
        const flag = flagMap[country.toLowerCase()] || flagMap['korea'];
        return `
                      <img
                        src="${flag.src}"
                        alt="${flag.alt}"
                        class="flag-image"
                        onerror="this.onerror=null; this.innerHTML='${flag.emoji}'; this.style.fontSize='16px'; this.style.display='flex'; this.style.alignItems='center'; this.style.justifyContent='center'; this.style.height='100%'; this.style.background='#f0f0f0'; this.style.borderRadius='3px';"
                      />`;
    }).join('');
}

// 업체 카드 HTML 생성
function createShopCardHTML(shop) {
    const imageUrl = shop.image || 'images/default.jpg';
    const altText = shop.alt || `${shop.name} - ${shop.region || ''} ${shop.district || ''} 출장마사지`;
    const shopType = shop.showHealingShop ? '힐링샵' : (shop.type || '마사지샵');
    const greeting = shop.greeting || shop.description || '';
    const flags = generateFlagImages(shop.country);

    return `
            <div class="shop-card" data-shop-id="${shop.id}">
              <div class="card-image">
              <img
                src="${imageUrl}"
                alt="${altText}"
                class="shop-image"
                     onerror="this.onerror=null; this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjhmOWZhIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPuaXoOazleWKoOi9vTwvdGV4dD48L3N2Zz4='; this.style.display='block';"
                loading="lazy"
              />
                <div class="image-overlay">
                    <div class="shop-type">${shopType}</div>
                </div>
            </div>
            
            <div class="card-content">
                <div class="card-header">
                    <div class="shop-name-container">
                        <div class="shop-name">${shop.name}</div>
                        <div class="shop-location-info">
                            <span class="shop-district">${shop.district || shop.region || ''}</span>
                            ${flags ? `
                            <div class="location-flag">
                      ${flags}
                            </div>
                            ` : ''}
                        </div>
                    </div>
                </div>
                
                <div class="card-info">
                    <div class="info-item greeting">
                        <span>${greeting}</span>
                    </div>
                </div>
            </div>
            </div>`;
}

// 메인 실행
try {
    const shops = shopsData.shops || [];
    console.log(`총 ${shops.length}개 업체 발견`);

    // showHealingShop이 true인 것과 false인 것 분리
    const healingShops = shops.filter(s => s.showHealingShop === true);
    const otherShops = shops.filter(s => s.showHealingShop !== true);

    // 각 그룹 내에서 정렬 (랜덤 대신 고정 순서로 SEO 최적화)
    const sortedShops = [...healingShops, ...otherShops];

    // 카드 HTML 생성
    const cardsHTML = sortedShops.map(shop => createShopCardHTML(shop)).join('\n');

    // 템플릿에서 카드 그리드 부분 교체
    const generatedHTML = template.replace(
        /<section class="shop-grid" id="shop-grid">[\s\S]*?<\/section>/,
        `<section class="shop-grid" id="shop-grid">
                ${cardsHTML}
            </section>`
    );

    // 결과 카운트 업데이트
    const finalHTML = generatedHTML.replace(
        /<span id="result-count">0<\/span>/,
        `<span id="result-count">${shops.length}</span>`
    );

    // 파일 저장
    const outputPath = path.join(scriptDir, 'index.html');
    fs.writeFileSync(outputPath, finalHTML, 'utf8');
    
    console.log(`✅ index.html 생성 완료! (${shops.length}개 업체 카드 포함)`);
} catch (error) {
    console.error('❌ 오류 발생:', error.message);
    console.error(error.stack);
    process.exit(1);
}
