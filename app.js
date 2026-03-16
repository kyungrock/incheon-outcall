// 앱 초기화 및 필터링 로직
class ShopApp {
    constructor() {
        // shops.json의 상세 데이터를 기반으로 카드용 데이터 생성
        this.shopsDetail = window.shopsData?.shops || [];
        
        // 디버깅: 데이터 확인
        console.log('shopsData:', window.shopsData);
        console.log('shopsDetail 개수:', this.shopsDetail.length);
        
        if (this.shopsDetail.length === 0) {
            console.warn('⚠️ shops.json 데이터가 없습니다. shops.json 파일이 로드되었는지 확인하세요.');
        }
        
        this.shops = this.shopsDetail.map((shop) => this.normalizeShopForCard(shop));
        console.log('정규화된 shops 개수:', this.shops.length);
        
        this.currentFilters = {
            region: 'all',
            district: 'all',
            dong: 'all',
            theme: 'all',
        };
        
        this.init();
    }

    // 구/군/시 등 꼬리 제거해서 필터용 이름으로 사용 (예: 강남구 -> 강남)
    normalizeDistrictName(name) {
        if (!name) return '';
        return name.replace(/(구|군|시)$/, '');
    }

    // shops.json 데이터를 카드 렌더링에 맞게 정규화
    normalizeShopForCard(detail) {
        return {
            id: detail.id,
            name: detail.name,
            type: detail.type || '',
            country: detail.country || 'korea',
            region: detail.region || '',
            district: detail.district || '',
            dong: detail.dong || '', // 없는 경우도 있음
            address: detail.address || '',
            detailAddress: detail.detailAddress || '',
            phone: detail.phone || '',
            rating: detail.rating || 0,
            reviewCount: detail.reviewCount || (detail.reviews ? detail.reviews.length : 0),
            price: detail.price || (detail.courses && detail.courses[0]?.items?.[0]?.price) || '가격 문의',
            description: detail.description || '',
            image: detail.image || 'images/default.jpg',
            alt: detail.alt || `${detail.name} - ${detail.region || ''} ${detail.district || ''} 출장마사지`,
            services: detail.services || [],
            operatingHours: detail.operatingHours || '',
            file: detail.file || '',
            showHealingShop: detail.showHealingShop !== undefined ? detail.showHealingShop : true,
            greeting: detail.greeting || `${detail.region || ''} ${detail.name || ''} 힐링 마사지샵`,
            reviews: detail.reviews || [],
        };
    }

    init() {
        this.setupFilters();

        // 초기 진입 시 기본 필터:
        // 지역: 인천, 테마: 출장마사지 (수도권 출장 위주 노출)
        const regionSelect = document.getElementById('region-filter');
        const themeSelect = document.getElementById('theme-filter');
        const themeChips = document.querySelectorAll('.theme-chip');

        if (regionSelect) {
            // 인천이 옵션에 있을 때만 기본값으로 설정
            const hasIncheon = Array.from(regionSelect.options).some(
                (opt) => opt.value === '인천'
            );
            if (hasIncheon) {
                regionSelect.value = '인천';
                this.currentFilters.region = '인천';
            }
        }

        if (themeSelect) {
            themeSelect.value = '출장마사지';
            this.currentFilters.theme = '출장마사지';
        }

        // 모바일 테마 칩도 출장마사지로 활성화
        if (themeChips && themeChips.length > 0) {
            themeChips.forEach((chip) => {
                chip.classList.remove('active');
                if (chip.dataset.theme === '출장마사지') {
                    chip.classList.add('active');
                }
            });
        }

        this.renderShops();
        this.setupEventListeners();
    }

    // 필터 옵션 동적 생성
    setupFilters() {
        const regions = new Set();
        const districts = new Map(); // region -> normalized districts
        const dongs = new Map(); // district -> dongs

        // 데이터에서 자동 추출
        this.shops.forEach(shop => {
            // region 처리 (쉼표로 구분된 경우도 처리)
            const shopRegions = shop.region ? shop.region.split(',').map(r => r.trim()) : [];
            shopRegions.forEach(region => {
                if (region) {
                    regions.add(region);
                    if (!districts.has(region)) {
                        districts.set(region, new Set());
                    }
                }
            });

            // district 처리
            if (shop.district) {
                const normalizedDistrict = this.normalizeDistrictName(shop.district);
                shopRegions.forEach(region => {
                    if (!region) return;
                    if (!districts.has(region)) {
                        districts.set(region, new Set());
                    }
                    districts.get(region).add(normalizedDistrict);
                });
                
                if (!dongs.has(normalizedDistrict)) {
                    dongs.set(normalizedDistrict, new Set());
                }
            }

            // dong 처리
            if (shop.dong && shop.district) {
                const normalizedDistrict = this.normalizeDistrictName(shop.district);
                if (dongs.has(normalizedDistrict)) {
                    dongs.get(normalizedDistrict).add(shop.dong);
                }
            }
        });

        // Region 필터 기본 리스트 (인구수 순서 기준 우선 노출)
        const regionSelect = document.getElementById('region-filter');
        const populationOrder = [
            '서울',
            '경기',
            '인천',
            '부산',
            '대구',
            '경남',
            '경북',
            '충남',
            '전북',
            '전남',
            '충북',
            '강원',
            '광주',
            '대전',
            '울산',
            '제주',
            '세종',
        ];

        // 실제 데이터에 존재하는 region만 남김
        const allRegions = Array.from(regions);
        const orderedRegions = [];

        // 1) 인구순 우선 지역들을 실제 존재하는 순서대로 push
        populationOrder.forEach((r) => {
            if (allRegions.includes(r)) {
                orderedRegions.push(r);
            }
        });

        // 2) 나머지 지역은 이름순으로 뒤에 붙임
        const remaining = allRegions.filter((r) => !orderedRegions.includes(r)).sort();
        orderedRegions.push(...remaining);

        // Region 필터 채우기
        orderedRegions.forEach(region => {
            const option = document.createElement('option');
            option.value = region;
            option.textContent = region;
            regionSelect.appendChild(option);
        });

        // District 필터 업데이트 함수
        const updateDistrictFilter = () => {
            const districtSelect = document.getElementById('district-filter');
            const selectedRegion = regionSelect.value;
            
            // 기존 옵션 제거 (전체 제외)
            while (districtSelect.children.length > 1) {
                districtSelect.removeChild(districtSelect.lastChild);
            }

            if (selectedRegion === 'all') {
                // 모든 district 표시
                const allDistricts = new Set();
                districts.forEach(set => set.forEach(d => allDistricts.add(d)));
                Array.from(allDistricts).sort().forEach(district => {
                    const option = document.createElement('option');
                    option.value = district;
                    option.textContent = district;
                    districtSelect.appendChild(option);
                });
            } else if (districts.has(selectedRegion)) {
                // 선택된 region의 district만 표시
                Array.from(districts.get(selectedRegion)).sort().forEach(district => {
                    const option = document.createElement('option');
                    option.value = district;
                    option.textContent = district;
                    districtSelect.appendChild(option);
                });
            }
            
            // dong 필터도 업데이트
            this.updateDongFilter();
        };

        // Dong 필터 업데이트 함수
        this.updateDongFilter = () => {
            const dongSelect = document.getElementById('dong-filter');
            const districtSelect = document.getElementById('district-filter');
            const selectedDistrict = districtSelect.value;
            
            // 기존 옵션 제거 (전체 제외)
            while (dongSelect.children.length > 1) {
                dongSelect.removeChild(dongSelect.lastChild);
            }

            if (selectedDistrict === 'all') {
                // 모든 dong 표시
                const allDongs = new Set();
                dongs.forEach(set => set.forEach(d => allDongs.add(d)));
                Array.from(allDongs).sort().forEach(dong => {
                    const option = document.createElement('option');
                    option.value = dong;
                    option.textContent = dong;
                    dongSelect.appendChild(option);
                });
            } else if (dongs.has(selectedDistrict)) {
                // 선택된 district의 dong만 표시
                Array.from(dongs.get(selectedDistrict)).sort().forEach(dong => {
                    const option = document.createElement('option');
                    option.value = dong;
                    option.textContent = dong;
                    dongSelect.appendChild(option);
                });
            }
        };

        // Region 변경 시 district 업데이트
        regionSelect.addEventListener('change', () => {
            updateDistrictFilter();
            this.currentFilters.region = regionSelect.value;
            this.currentFilters.district = 'all';
            this.currentFilters.dong = 'all';
            document.getElementById('district-filter').value = 'all';
            document.getElementById('dong-filter').value = 'all';
            this.renderShops();
        });

        // District 변경 시 dong 업데이트
        document.getElementById('district-filter').addEventListener('change', () => {
            this.updateDongFilter();
            this.currentFilters.district = document.getElementById('district-filter').value;
            this.currentFilters.dong = 'all';
            document.getElementById('dong-filter').value = 'all';
            this.renderShops();
        });

        // 초기 district 필터 채우기
        updateDistrictFilter();
    }

    setupEventListeners() {
        // District 필터 변경
        document.getElementById('district-filter').addEventListener('change', (e) => {
            this.currentFilters.district = e.target.value;
            this.renderShops();
        });

        // Dong 필터 변경
        document.getElementById('dong-filter').addEventListener('change', (e) => {
            this.currentFilters.dong = e.target.value;
            this.renderShops();
        });

        // Theme 필터 변경
        document.getElementById('theme-filter').addEventListener('change', (e) => {
            this.currentFilters.theme = e.target.value;
            this.renderShops();
        });

        // 모바일 테마 퀵 필터 (전체 / 마사지 / 출장마사지) 버튼
        const themeChips = document.querySelectorAll('.theme-chip');
        const themeSelect = document.getElementById('theme-filter');
        if (themeChips && themeChips.length > 0 && themeSelect) {
            themeChips.forEach(chip => {
                chip.addEventListener('click', () => {
                    const value = chip.dataset.theme || 'all';
                    // 내부 필터 상태 변경
                    this.currentFilters.theme = value;
                    // 셀렉트 값도 동기화
                    themeSelect.value = value;
                    // 활성화 스타일 변경
                    themeChips.forEach(c => c.classList.remove('active'));
                    chip.classList.add('active');
                    // 필터 적용
                    this.renderShops();
                });
            });
        }
    }

    // 필터링된 업체 목록 반환
    getFilteredShops() {
        return this.shops.filter(shop => {
            // Region 필터
            if (this.currentFilters.region !== 'all') {
                const shopRegions = shop.region
                    ? shop.region.split(',').map(r => r.trim())
                    : [];

                // 수도권(서울·경기·인천) 한 묶음 처리:
                // 지역=인천 + 테마=출장마사지(또는 출장)일 때
                // 서울·경기·인천 출장마사지 업체를 한 번에 보여줌
                const selectedRegion = this.currentFilters.region;
                let targetRegions = [selectedRegion];

                if (
                    (selectedRegion === '인천') &&
                    (this.currentFilters.theme === '출장마사지' || this.currentFilters.theme === '출장')
                ) {
                    targetRegions = ['서울', '경기', '인천'];
                }

                const matchesRegion = shopRegions.some(r => targetRegions.includes(r));
                if (!matchesRegion) return false;
            }

            // District 필터
            if (this.currentFilters.district !== 'all') {
                // 출장 테마일 때는 상세지역 조건은 무시 (지역+테마만으로 검색)
                if (this.currentFilters.theme !== '출장마사지' && this.currentFilters.theme !== '출장') {
                    const shopDistrict = this.normalizeDistrictName(shop.district || '');
                    if (shopDistrict !== this.currentFilters.district) {
                        return false;
                    }
                }
            }

            // Dong 필터
            if (this.currentFilters.dong !== 'all') {
                // 출장 테마일 때는 동/역 조건도 무시 (지역+테마만으로 검색)
                if (this.currentFilters.theme !== '출장마사지' && this.currentFilters.theme !== '출장') {
                    if (shop.dong !== this.currentFilters.dong) {
                        return false;
                    }
                }
            }

            // Theme 필터
            if (this.currentFilters.theme !== 'all') {
                const theme = this.currentFilters.theme;
                const services = shop.services || [];
                const serviceStr = services.join(' ');

                // 출장 여부 판별 (공통 로직)
                const isOutcall =
                    serviceStr.includes('출장') ||
                    shop.type === '출장마사지' ||
                    shop.description?.includes('출장') ||
                    shop.description?.includes('홈타이');
                
                // 테마 매칭 로직
                let matches = false;
                if (theme === '마사지') {
                    // 마사지 계열 + 출장 키워드가 없는 순수 마사지샵만
                    const isMassageType =
                        serviceStr.includes('마사지') ||
                        serviceStr.includes('스웨디시') ||
                        serviceStr.includes('아로마');
                    matches = isMassageType && !isOutcall;
                } else if (theme === '출장마사지' || theme === '출장') {
                    // 출장 키워드가 있는 출장/홈타이 계열만
                    matches = isOutcall;
                } else if (theme === '스웨디시') {
                    matches = serviceStr.includes('스웨디시');
                } else if (theme === '아로마마사지') {
                    matches = serviceStr.includes('아로마');
                }
                
                if (!matches) {
                    return false;
                }
            }

            return true;
        });
    }

    // 업체 카드 렌더링
    renderShops() {
        const filteredShops = this.getFilteredShops();
        const grid = document.getElementById('shop-grid');
        const emptyState = document.getElementById('empty-state');
        const resultCount = document.getElementById('result-count');

        console.log('필터링된 업체 개수:', filteredShops.length);
        console.log('전체 업체 개수:', this.shops.length);

        if (!grid) {
            console.error('❌ shop-grid 요소를 찾을 수 없습니다.');
            return;
        }

        if (!resultCount) {
            console.error('❌ result-count 요소를 찾을 수 없습니다.');
            return;
        }

        resultCount.textContent = filteredShops.length;

        if (filteredShops.length === 0) {
            grid.style.display = 'none';
            emptyState.style.display = 'block';
            return;
        }

        grid.style.display = 'grid';
        emptyState.style.display = 'none';

        // showHealingShop이 true인 것과 false인 것 분리
        const healingShops = filteredShops.filter(s => s.showHealingShop === true);
        const otherShops = filteredShops.filter(s => s.showHealingShop !== true);

        // 각 그룹 내에서 랜덤 정렬
        const shuffle = (array) => {
            const newArray = [...array];
            for (let i = newArray.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
            }
            return newArray;
        };

        const sortedShops = [...shuffle(healingShops), ...shuffle(otherShops)];

        console.log('렌더링할 카드 개수:', sortedShops.length);
        const cardsHTML = sortedShops.map(shop => this.createShopCard(shop)).join('');
        console.log('생성된 카드 HTML 길이:', cardsHTML.length);
        grid.innerHTML = cardsHTML;

        // 카드 클릭 이벤트 추가
        grid.querySelectorAll('.shop-card').forEach(card => {
            card.addEventListener('click', (e) => {
                e.preventDefault();
                const shopId = card.dataset.shopId;
                this.navigateToDetail(shopId);
            });
        });
    }

    // 업체 카드 HTML 생성 (단순하고 안정적인 구조)
    createShopCard(shop) {
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
            </div>
        `;
    }

    // 상세 페이지로 이동
    navigateToDetail(shopId) {
        const shop = this.shops.find(s => s.id == shopId);
        if (!shop) return;

        // URL 파라미터로 필터 정보 전달 (동적 상세 페이지)
        const params = new URLSearchParams();
        params.set('id', shopId);
        if (this.currentFilters.region !== 'all') params.set('region', this.currentFilters.region);
        if (this.currentFilters.district !== 'all') params.set('district', this.currentFilters.district);
        if (this.currentFilters.dong !== 'all') params.set('dong', this.currentFilters.dong);
        if (this.currentFilters.theme !== 'all') params.set('theme', this.currentFilters.theme);

        // 동적 상세 페이지로 이동
        window.location.href = `detail.html?${params.toString()}`;
    }
}

// 페이지 로드 시 앱 초기화
document.addEventListener('DOMContentLoaded', () => {
    // shops.json이 로드될 때까지 대기
    if (window.shopsData) {
        new ShopApp();
    } else {
        // shops.json이 아직 로드되지 않았으면 대기
        const checkInterval = setInterval(() => {
            if (window.shopsData) {
                clearInterval(checkInterval);
                new ShopApp();
            }
        }, 100);
        
        // 최대 5초 대기
        setTimeout(() => {
            clearInterval(checkInterval);
            if (!window.shopsData) {
                console.error('shops.json을 로드할 수 없습니다.');
                // 그래도 시도 (빈 배열로 작동)
                new ShopApp();
            }
        }, 5000);
    }
});
