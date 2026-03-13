// index.html 정적 생성 스크립트 (SEO를 위해 카드를 HTML에 포함)
// Node.js로 실행: node generate-index.js

const fs = require('fs');
const path = require('path');

// 현재 스크립트 파일의 디렉토리 경로 (한글 경로 처리)
// __dirname이 제대로 작동하지 않을 경우를 대비해 process.cwd() 사용
let scriptDir;
try {
    scriptDir = __dirname;
} catch (e) {
    scriptDir = process.cwd();
}

// shops.json 읽기
function loadData() {
    // 현재 작업 디렉토리 기준으로 파일 찾기
    const baseDir = process.cwd();
    const shopsJsonPath = path.join(baseDir, 'shops.json');
    const indexTemplatePath = path.join(baseDir, 'index.html');

    // shops.json 읽기 (JavaScript 형식)
    const shopsJsonContent = fs.readFileSync(shopsJsonPath, 'utf8');
    let shopsData;

    try {
        // window.shopsData = {...} 형식 실행
        const vm = require('vm');
        const context = { window: {} };
        vm.createContext(context);
        vm.runInContext(shopsJsonContent, context);
        shopsData = context.window.shopsData;
    } catch (e) {
        throw new Error('shops.json을 파싱할 수 없습니다: ' + e.message);
    }

    // index.html 템플릿 읽기
    const template = fs.readFileSync(indexTemplatePath, 'utf8');

    return { shopsData, template };
}

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

// 업체 카드 HTML 생성 (app.js와 동일한 단순 구조)
function createShopCardHTML(shop) {
    const imageUrl = shop.image || 'images/default.jpg';
    const altText = shop.alt || `${shop.name} - ${shop.region || ''} ${shop.district || ''} 출장마사지`;
    const locationText = [shop.region, shop.district].filter(Boolean).join(' ');
    const greeting = shop.greeting || shop.description || '';
    const fullAddress = [shop.address, shop.detailAddress].filter(Boolean).join(' ');
    const priceText = shop.price || '가격 문의';
    const phoneText = shop.phone || '';

    return `
            <div class="shop-card" data-shop-id="${shop.id}">
                <img
                    src="${imageUrl}"
                    alt="${altText}"
                    class="shop-card-image"
                    loading="lazy"
                    onerror="this.onerror=null; this.src='images/default.jpg';"
                />
                <div class="shop-card-content">
                    <div class="shop-card-header">
                        <div class="shop-card-name">${shop.name}</div>
                        <div class="shop-card-location">${locationText}</div>
                    </div>
                    <div class="shop-card-description">
                        ${greeting}
                    </div>
                    <div class="shop-card-meta">
                        <div class="shop-card-price">가격: ${priceText}</div>
                        ${fullAddress ? `<div class="shop-card-address">주소: ${fullAddress}</div>` : ''}
                        ${phoneText ? `<div class="shop-card-phone">전화: ${phoneText}</div>` : ''}
                    </div>
                </div>
            </div>`;
}

// 메인 실행
function generateIndex() {
    try {
        const { shopsData, template } = loadData();
        const shops = shopsData.shops || [];

        // showHealingShop이 true인 것과 false인 것 분리
        const healingShops = shops.filter(s => s.showHealingShop === true);
        const otherShops = shops.filter(s => s.showHealingShop !== true);

        // 각 그룹 내에서 정렬 (랜덤 대신 고정 순서로 SEO 최적화)
        const sortedShops = [...healingShops, ...otherShops];

        // 카드 HTML 생성
        const cardsHTML = sortedShops.map(shop => createShopCardHTML(shop)).join('\n');

        // 템플릿에서 카드 그리드 부분 교체 (문자열 인덱스로 안전하게)
        const markerStart = '<section class="shop-grid" id="shop-grid">';
        const startIndex = template.indexOf(markerStart);
        if (startIndex === -1) {
            throw new Error('index.html에서 <section class="shop-grid" id="shop-grid"> 를 찾을 수 없습니다.');
        }

        const afterStart = startIndex + markerStart.length;
        const endIndex = template.indexOf('</section>', afterStart);
        if (endIndex === -1) {
            throw new Error('index.html에서 shop-grid 섹션의 </section> 종료 태그를 찾을 수 없습니다.');
        }

        const newSection = `${markerStart}
                ${cardsHTML}
            </section>`;

        const generatedHTML =
            template.slice(0, startIndex) +
            newSection +
            template.slice(endIndex + '</section>'.length);

        // 결과 카운트 업데이트
        const finalHTML = generatedHTML.replace(
            /<span id="result-count">0<\/span>/,
            `<span id="result-count">${shops.length}</span>`
        );

        // 파일 저장
        const outputPath = path.join(process.cwd(), 'index.html');
        fs.writeFileSync(outputPath, finalHTML, 'utf8');
        
        console.log(`✅ index.html 생성 완료! (${shops.length}개 업체 카드 포함)`);
    } catch (error) {
        console.error('❌ 오류 발생:', error.message);
        process.exit(1);
    }
}

// 실행
generateIndex();
