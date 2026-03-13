// 정적 HTML 페이지 생성 스크립트
// Node.js로 실행: node generate-static-pages.js

const fs = require('fs');
const path = require('path');

// shop-card-data.js와 shops.json 읽기
function loadData() {
    const shopCardDataPath = path.join(__dirname, 'shop-card-data.js');
    const shopsJsonPath = path.join(__dirname, 'shops.json');
    const templatePath = path.join(__dirname, 'detail-template.html');

    // shop-card-data.js 읽기
    const shopCardDataContent = fs.readFileSync(shopCardDataPath, 'utf8');

    // vm 모듈을 사용하여 안전하게 실행
    const vm = require('vm');

    // window.shopCardData = [...] 부분만 추출해서 실행 (파일 전체 실행 시 문법 오류 가능성 방지)
    const dataMatch = shopCardDataContent.match(/window\.shopCardData\s*=\s*(\[[\s\S]*?\]);/);
    if (!dataMatch) {
        throw new Error('shop-card-data.js에서 window.shopCardData 배열을 찾을 수 없습니다.');
    }

    let shops;
    try {
        const context = {};
        vm.createContext(context);
        // 배열 리터럴만 실행해서 결과를 shops 변수로 받기
        shops = vm.runInContext(dataMatch[1], context);
        if (!Array.isArray(shops)) {
            throw new Error('추출된 shopCardData가 배열이 아닙니다.');
        }
    } catch (e) {
        throw new Error('shop-card-data.js를 파싱할 수 없습니다: ' + e.message);
    }

    // shops.json 읽기 (JavaScript 형식)
    const shopsJsonContent = fs.readFileSync(shopsJsonPath, 'utf8');
    let shopsData;

    try {
        // window.shopsData = {...} 형식 실행
        const context2 = { window: {} };
        vm.createContext(context2);
        vm.runInContext(shopsJsonContent, context2);
        shopsData = context2.window.shopsData || { shops: [] };
    } catch (e) {
        // 실행 실패 시 빈 객체
        console.warn('shops.json 실행 실패, 빈 데이터 사용:', e.message);
        shopsData = { shops: [] };
    }

    // 템플릿 읽기
    const template = fs.readFileSync(templatePath, 'utf8');

    return { shops, shopsData, template };
}

// 파일명 생성 (URL 안전)
function sanitizeFileName(str) {
    return str
        .replace(/[^a-zA-Z0-9가-힣]/g, '-')
        .replace(/-+/g, '-')
        .toLowerCase();
}

// HTML 생성
function generateHTML(shop, detailInfo, template, filters) {
    let html = template;

    // 기본 정보 치환
    html = html.replace(/\{\{SHOP_NAME\}\}/g, shop.name || '');
    html = html.replace(/\{\{SHOP_DESCRIPTION\}\}/g, (detailInfo?.description || shop.description || '').replace(/"/g, '&quot;'));
    html = html.replace(/\{\{SHOP_RATING\}\}/g, (shop.rating || 0).toFixed(1));
    html = html.replace(/\{\{SHOP_REVIEW_COUNT\}\}/g, shop.reviewCount || 0);
    
    const locationParts = [];
    if (shop.region) locationParts.push(shop.region);
    if (shop.district) locationParts.push(shop.district);
    if (shop.dong) locationParts.push(shop.dong);
    html = html.replace(/\{\{SHOP_LOCATION\}\}/g, locationParts.join(' '));
    
    html = html.replace(/\{\{SHOP_PHONE\}\}/g, shop.phone || '문의');
    html = html.replace(/\{\{SHOP_PRICE\}\}/g, shop.price || '가격 문의');
    html = html.replace(/\{\{SHOP_IMAGE\}\}/g, shop.image || 'images/default.jpg');
    html = html.replace(/\{\{SHOP_OPERATING_HOURS\}\}/g, detailInfo?.operatingHours || shop.operatingHours || '문의');
    html = html.replace(/\{\{SHOP_DETAIL_ADDRESS\}\}/g, detailInfo?.detailAddress || shop.detailAddress || shop.address || '');

    // 코스 섹션
    let coursesSection = '';
    if (detailInfo?.courses && detailInfo.courses.length > 0) {
        coursesSection = '<div class="detail-section">';
        coursesSection += '<h2 class="detail-section-title">코스 및 가격</h2>';
        coursesSection += '<ul class="courses-list">';
        
        detailInfo.courses.forEach(category => {
            coursesSection += '<li class="course-category">';
            coursesSection += `<h3 class="course-category-title">${category.category}</h3>`;
            
            category.items.forEach(item => {
                coursesSection += '<div class="course-item">';
                coursesSection += `<div class="course-name">${item.name}</div>`;
                coursesSection += '<div class="course-details">';
                coursesSection += `<span>가격: ${item.price}</span>`;
                coursesSection += `<span>소요시간: ${item.duration}</span>`;
                coursesSection += '</div>';
                if (item.description) {
                    coursesSection += `<div style="margin-top: 0.5rem; color: #666; font-size: 0.9rem;">${item.description}</div>`;
                }
                coursesSection += '</div>';
            });
            
            coursesSection += '</li>';
        });
        
        coursesSection += '</ul>';
        coursesSection += '</div>';
    }
    html = html.replace(/\{\{COURSES_SECTION\}\}/g, coursesSection);

    // 관리사 정보
    html = html.replace(/\{\{STAFF_INFO\}\}/g, detailInfo?.staffInfo || '상세 정보는 문의 바랍니다.');

    // 특징 리스트
    let featuresList = '';
    if (detailInfo?.features && detailInfo.features.length > 0) {
        featuresList = detailInfo.features.map(feature => 
            `<li class="feature-item">${feature}</li>`
        ).join('');
    }
    html = html.replace(/\{\{FEATURES_LIST\}\}/g, featuresList);

    // 리뷰 리스트
    const reviews = [];
    if (shop.reviews && Array.isArray(shop.reviews)) {
        shop.reviews.forEach(review => {
            reviews.push({
                name: review.author || '익명',
                rating: review.rating || 5,
                date: review.date || new Date().toISOString().split('T')[0],
                comment: review.review || ''
            });
        });
    }
    if (detailInfo?.reviews && Array.isArray(detailInfo.reviews)) {
        detailInfo.reviews.forEach(review => {
            reviews.push({
                name: review.name || '익명',
                rating: review.rating || 5,
                date: review.date || new Date().toISOString().split('T')[0],
                comment: review.comment || ''
            });
        });
    }

    let reviewsList = '';
    if (reviews.length > 0) {
        reviews.sort((a, b) => new Date(b.date) - new Date(a.date));
        reviewsList = reviews.slice(0, 10).map(review => {
            return `
                <li class="review-item">
                    <div class="review-header">
                        <span class="review-author">${review.name}</span>
                        <div>
                            <span class="review-rating">⭐ ${review.rating}</span>
                            <span class="review-date">${review.date}</span>
                        </div>
                    </div>
                    <div class="review-comment">${review.comment}</div>
                </li>
            `;
        }).join('');
    } else {
        reviewsList = '<p>아직 리뷰가 없습니다.</p>';
    }
    html = html.replace(/\{\{REVIEWS_LIST\}\}/g, reviewsList);

    // 필터 정보를 URL 파라미터로 추가
    const scriptTag = html.match(/<script[^>]*src="detail\.js"[^>]*><\/script>/);
    if (scriptTag) {
        const params = new URLSearchParams();
        params.set('id', shop.id);
        if (filters.region !== 'all') params.set('region', filters.region);
        if (filters.district !== 'all') params.set('district', filters.district);
        if (filters.dong !== 'all') params.set('dong', filters.dong);
        if (filters.theme !== 'all') params.set('theme', filters.theme);
        
        const newScriptTag = scriptTag[0].replace('detail.js', `detail.js?${params.toString()}`);
        html = html.replace(scriptTag[0], newScriptTag);
    }

    return html;
}

// 파일명 생성 (필터 포함)
function generateFileName(shop, filters) {
    let fileName = 'company-';
    
    // 필터 정보 추가
    if (filters.region !== 'all') {
        fileName += sanitizeFileName(filters.region) + '-';
    }
    if (filters.district !== 'all') {
        fileName += sanitizeFileName(filters.district) + '-';
    }
    if (filters.dong !== 'all') {
        fileName += sanitizeFileName(filters.dong) + '-';
    }
    if (filters.theme !== 'all') {
        fileName += sanitizeFileName(filters.theme) + '-';
    }
    
    // 업체명 추가
    fileName += sanitizeFileName(shop.name);
    
    return fileName + '.html';
}

// 테마 매칭 확인
function matchesTheme(shop, theme) {
    if (theme === 'all') return true;
    
    const services = shop.services || [];
    const serviceStr = services.join(' ');
    
    if (theme === '마사지') {
        return serviceStr.includes('마사지') || 
               serviceStr.includes('스웨디시') || 
               serviceStr.includes('아로마');
    } else if (theme === '출장마사지' || theme === '출장') {
        return serviceStr.includes('출장') || 
               shop.type === '출장마사지' ||
               shop.description?.includes('출장') ||
               shop.description?.includes('홈타이');
    } else if (theme === '스웨디시') {
        return serviceStr.includes('스웨디시');
    } else if (theme === '아로마마사지') {
        return serviceStr.includes('아로마');
    }
    
    return false;
}

// 메인 실행
function main() {
    console.log('정적 HTML 페이지 생성 시작...');
    
    const { shops, shopsData, template } = loadData();
    const themes = ['all', '마사지', '출장마사지', '스웨디시', '아로마마사지', '출장'];
    
    let generatedCount = 0;
    const generatedFiles = new Set();

    shops.forEach(shop => {
        // shops.json에서 상세 정보 찾기
        let detailInfo = shopsData.shops?.find(s => 
            s.id === shop.id.toString() ||
            s.name === shop.name ||
            s.phone === shop.phone
        );

        // 지역 정보 추출
        const regions = shop.region ? shop.region.split(',').map(r => r.trim()) : ['all'];
        const districts = shop.district ? [shop.district] : ['all'];
        const dongs = shop.dong ? [shop.dong] : ['all'];

        // 각 조합에 대해 HTML 생성
        regions.forEach(region => {
            districts.forEach(district => {
                dongs.forEach(dong => {
                    themes.forEach(theme => {
                        // 테마 필터 확인
                        if (theme !== 'all' && !matchesTheme(shop, theme)) {
                            return;
                        }

                        const filters = {
                            region: region === 'all' ? 'all' : region,
                            district: district === 'all' ? 'all' : district,
                            dong: dong === 'all' ? 'all' : dong,
                            theme: theme
                        };

                        const fileName = generateFileName(shop, filters);
                        
                        // 중복 방지
                        if (generatedFiles.has(fileName)) {
                            return;
                        }
                        generatedFiles.add(fileName);

                        const html = generateHTML(shop, detailInfo, template, filters);
                        const filePath = path.join(__dirname, fileName);
                        
                        fs.writeFileSync(filePath, html, 'utf8');
                        generatedCount++;
                        
                        if (generatedCount % 100 === 0) {
                            console.log(`${generatedCount}개 파일 생성 완료...`);
                        }
                    });
                });
            });
        });
    });

    console.log(`완료! 총 ${generatedCount}개의 정적 HTML 파일이 생성되었습니다.`);
}

// 실행
if (require.main === module) {
    try {
        main();
    } catch (error) {
        console.error('오류 발생:', error);
        process.exit(1);
    }
}

module.exports = { generateHTML, generateFileName, matchesTheme };
