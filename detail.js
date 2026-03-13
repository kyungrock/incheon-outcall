// 상세 페이지 데이터 로드 및 렌더링
class DetailPage {
    constructor() {
        // 상세 데이터만 사용 (shops.json)
        this.shopsDetail = window.shopsData?.shops || [];
        this.shops = this.shopsDetail;
        this.init();
    }

    init() {
        const urlParams = new URLSearchParams(window.location.search);
        const shopId = urlParams.get('id');
        
        if (!shopId) {
            this.showError('업체 정보를 찾을 수 없습니다.');
            return;
        }

        const shop = this.shops.find(s => s.id == shopId);
        if (!shop) {
            this.showError('업체 정보를 찾을 수 없습니다.');
            return;
        }

        // shops.json에서 상세 정보는 shop 자체
        const detailInfo = shop;
        
        // 디버깅: 데이터 확인
        if (detailInfo?.courses) {
            console.log('코스 데이터 발견:', detailInfo.courses);
        } else {
            console.warn('코스 데이터가 없습니다.');
        }
        
        if (detailInfo?.staffInfo) {
            console.log('관리사 정보 발견:', detailInfo.staffInfo);
        } else {
            console.warn('관리사 정보가 없습니다.');
        }
        
        if (detailInfo?.features) {
            console.log('특징 데이터 발견:', detailInfo.features);
        } else {
            console.warn('특징 데이터가 없습니다.');
        }
        
        this.renderDetail(shop, detailInfo);
    }

    renderDetail(shop, detailInfo) {
        // 제목 업데이트
        document.title = `${shop.name} - 인천출장마사지`;
        
        // 메타 설명 업데이트
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) {
            metaDesc.content = shop.description || `${shop.name} 상세 정보`;
        }

        // 헤더
        const title = document.querySelector('.detail-title');
        if (title) title.textContent = shop.name;

        // 메타 정보
        const rating = document.querySelector('.detail-rating');
        if (rating) {
            rating.innerHTML = `⭐ ${(shop.rating || 0).toFixed(1)} (${shop.reviewCount || 0})`;
        }

        const locationParts = [];
        if (shop.region) locationParts.push(shop.region);
        if (shop.district) locationParts.push(shop.district);
        if (shop.dong) locationParts.push(shop.dong);
        const location = locationParts.join(' ');

        const locationEl = document.querySelector('.detail-meta div:nth-child(2)');
        if (locationEl) locationEl.textContent = `📍 ${location}`;

        // 전화번호 (헤더 - 클릭 시 전화 걸기)
        const phoneLink = document.querySelector('.detail-meta-phone');
        const rawPhone = shop.phone || detailInfo?.phone || '';
        if (phoneLink) {
            const tel = rawPhone ? rawPhone.replace(/[^0-9+]/g, '') : '';
            // 번호는 숨기고, 문구만 표시
            phoneLink.textContent = '📞 전화 문의';
            if (tel) {
                phoneLink.href = `tel:${tel}`;
            } else {
                phoneLink.removeAttribute('href');
            }
        }

        const priceEl = document.querySelector('.detail-meta-price');
        if (priceEl) priceEl.textContent = `💰 ${shop.price || detailInfo?.price || '가격 문의'}`;

        // 이미지
        const image = document.querySelector('.detail-image');
        if (image) {
            image.src = shop.image || 'images/default.jpg';
            image.alt = shop.name;
        }

        // 설명
        const description = document.querySelector('.detail-description');
        if (description) {
            description.textContent = detailInfo?.description || shop.description || '';
        }

        // 운영시간
        const operatingHours = document.querySelector('.detail-info-item .detail-info-value');
        if (operatingHours) {
            operatingHours.textContent = detailInfo?.operatingHours || shop.operatingHours || '문의';
        }

        // 상세주소
        const detailAddressItems = document.querySelectorAll('.detail-info-item .detail-info-value');
        const fullAddress = detailInfo?.detailAddress || shop.detailAddress || shop.address || '';
        if (detailAddressItems.length > 1 && fullAddress) {
            detailAddressItems[1].textContent = fullAddress;
        } else if (detailAddressItems.length > 1 && !fullAddress) {
            detailAddressItems[1].textContent = '상세 주소 정보가 없습니다.';
        }

        // 하단 고정 바 설정 (전화 + 지도)
        this.setupBottomBar(shop, detailInfo, rawPhone, fullAddress, location);

        // 코스 정보
        this.renderCourses(detailInfo);

        // 관리사 정보
        this.renderStaffInfo(detailInfo);

        // 특징
        this.renderFeatures(detailInfo);

        // 리뷰
        this.renderReviews(shop, detailInfo);
    }

    setupBottomBar(shop, detailInfo, rawPhone, fullAddress, location) {
        const bottomBar = document.querySelector('.detail-bottom-bar');
        if (!bottomBar) return;

        // 전화 버튼
        const bottomPhoneBtn = bottomBar.querySelector('.bottom-bar-phone');
        if (bottomPhoneBtn) {
            const tel = rawPhone ? rawPhone.replace(/[^0-9+]/g, '') : '';
            if (tel) {
                bottomPhoneBtn.href = `tel:${tel}`;
                // 번호는 숨기고 문구만 표시
                bottomPhoneBtn.textContent = '📞 전화걸기';
            } else {
                bottomPhoneBtn.removeAttribute('href');
                bottomPhoneBtn.textContent = '📞 전화 문의';
            }
        }

        // 출장마사지 타입인지 확인 (지도 숨김용)
        const type = (detailInfo?.type || shop.type || '').toString();
        const isOutcall =
            type.includes('출장') ||
            type.includes('outcall') ||
            (shop.services || []).some((s) => s.includes('출장'));

        const mapPanel = bottomBar.querySelector('.bottom-bar-map-panel');
        const mapToggle = bottomBar.querySelector('.bottom-bar-map-toggle');
        if (!mapPanel || !mapToggle) return;

        if (isOutcall) {
            // 출장마사지는 지도 버튼 숨김
            mapPanel.style.display = 'none';
            mapToggle.style.display = 'none';
            return;
        }

        // 초기에는 패널 닫힘 상태
        mapPanel.style.display = 'none';

        const coords = detailInfo?.coordinates || shop.coordinates || null;
        const hasCoords =
            coords && typeof coords.latitude === 'number' && typeof coords.longitude === 'number';

        const query = encodeURIComponent(fullAddress || location || shop.name || '');

        const openTmap = () => {
            if (hasCoords) {
                const { latitude, longitude } = coords;
                window.open(
                    `tmap://route?goalx=${longitude}&goaly=${latitude}&goalname=${encodeURIComponent(
                        shop.name || '목적지'
                    )}`,
                    '_blank'
                );
            } else {
                window.open(`tmap://search?name=${query}`, '_blank');
            }
        };

        const openKakao = () => {
            if (hasCoords) {
                const { latitude, longitude } = coords;
                window.open(
                    `https://map.kakao.com/link/map/${encodeURIComponent(
                        shop.name || '목적지'
                    )},${latitude},${longitude}`,
                    '_blank'
                );
            } else {
                window.open(`https://map.kakao.com/link/search/${query}`, '_blank');
            }
        };

        const openNaver = () => {
            if (hasCoords) {
                const { latitude, longitude } = coords;
                window.open(
                    `https://map.naver.com/v5/search/${query}/place/${longitude}/${latitude}`,
                    '_blank'
                );
            } else {
                window.open(`https://map.naver.com/v5/search/${query}`, '_blank');
            }
        };

        const tmapBtn = bottomBar.querySelector('.map-btn-tmap');
        const kakaoBtn = bottomBar.querySelector('.map-btn-kakao');
        const naverBtn = bottomBar.querySelector('.map-btn-naver');

        if (tmapBtn) tmapBtn.onclick = openTmap;
        if (kakaoBtn) kakaoBtn.onclick = openKakao;
        if (naverBtn) naverBtn.onclick = openNaver;

        // 지도보기 토글
        mapToggle.onclick = () => {
            if (mapPanel.style.display === 'none') {
                mapPanel.style.display = 'flex';
            } else {
                mapPanel.style.display = 'none';
            }
        };
    }

    renderCourses(detailInfo) {
        // 코스 섹션을 클래스로 찾기 (더 안정적)
        const coursesSection = document.querySelector('.courses-section');
        if (!coursesSection) {
            console.warn('코스 섹션을 찾을 수 없습니다.');
            return;
        }

        // ul 요소 찾기
        const coursesList = coursesSection.querySelector('.courses-list');
        if (!coursesList) {
            console.warn('코스 리스트를 찾을 수 없습니다.');
            return;
        }

        // 코스 데이터 확인
        if (!detailInfo?.courses || detailInfo.courses.length === 0) {
            coursesList.innerHTML = '<li style="padding: 2rem; text-align: center; color: #999;">코스 정보가 없습니다. 문의 바랍니다.</li>';
            return;
        }

        let html = '';

        detailInfo.courses.forEach(category => {
            if (!category || !category.items || category.items.length === 0) return;
            
            html += `<li class="course-category">`;
            html += `<h3 class="course-category-title">${category.category || '코스'}</h3>`;
            
            category.items.forEach(item => {
                if (!item) return;
                
                html += `<div class="course-item">`;
                html += `<div class="course-name">${item.name || '코스명'}</div>`;
                html += `<div class="course-details">`;
                html += `<span class="course-price">💰 ${item.price || '문의'}</span>`;
                html += `<span class="course-duration">⏱️ ${item.duration || '문의'}</span>`;
                html += `</div>`;
                if (item.description) {
                    html += `<div class="course-description">${item.description}</div>`;
                }
                html += `</div>`;
            });
            
            html += `</li>`;
        });

        if (html === '') {
            coursesList.innerHTML = '<li style="padding: 2rem; text-align: center; color: #999;">코스 정보가 없습니다. 문의 바랍니다.</li>';
        } else {
            coursesList.innerHTML = html;
        }
    }

    renderStaffInfo(detailInfo) {
        // 관리사 섹션을 클래스로 찾기 (더 안정적)
        const staffSection = document.querySelector('.staff-section');
        if (!staffSection) {
            console.warn('관리사 섹션을 찾을 수 없습니다.');
            return;
        }

        // 관리사 정보 확인
        if (!detailInfo?.staffInfo) {
            const staffDesc = staffSection.querySelector('.detail-description');
            if (staffDesc) {
                staffDesc.textContent = '상세 정보는 문의 바랍니다.';
            }
            return;
        }

        // 관리사 정보 파싱 (예: "소율(24), 제니(20), 연우(25)")
        const staffText = detailInfo.staffInfo;
        const staffList = staffText.split(',').map(s => s.trim()).filter(s => s);
        
        let html = '<div class="staff-info-container">';
        
        if (staffList.length > 0) {
            html += '<div class="staff-grid">';
            staffList.forEach(staff => {
                // 이름과 나이 추출 (예: "소율(24)" -> 이름: 소율, 나이: 24)
                const match = staff.match(/^(.+?)\((\d+)\)$/);
                if (match) {
                    const name = match[1].trim();
                    const age = match[2];
                    html += `<div class="staff-card">`;
                    html += `<div class="staff-name">${name}</div>`;
                    html += `<div class="staff-age">${age}세</div>`;
                    html += `</div>`;
                } else {
                    // 형식이 맞지 않으면 그대로 표시
                    html += `<div class="staff-card">`;
                    html += `<div class="staff-name">${staff}</div>`;
                    html += `</div>`;
                }
            });
            html += '</div>';
        } else {
            html += `<p class="detail-description">${staffText}</p>`;
        }
        
        html += '</div>';
        
        const staffDesc = staffSection.querySelector('.detail-description');
        if (staffDesc) {
            staffDesc.outerHTML = html;
        } else {
            // detail-description이 없으면 섹션 내용 전체 교체
            const title = staffSection.querySelector('.detail-section-title');
            if (title) {
                title.outerHTML = title.outerHTML + html;
            }
        }
    }

    renderFeatures(detailInfo) {
        // 특징 섹션을 클래스로 찾기 (더 안정적)
        const featuresSection = document.querySelector('.features-section');
        if (!featuresSection) {
            console.warn('특징 섹션을 찾을 수 없습니다.');
            return;
        }

        // 특징 리스트 찾기
        const featuresList = featuresSection.querySelector('.features-list');
        if (!featuresList) {
            console.warn('특징 리스트를 찾을 수 없습니다.');
            return;
        }

        // 특징 데이터 확인
        if (!detailInfo?.features || detailInfo.features.length === 0) {
            featuresList.innerHTML = '<li style="padding: 1rem; text-align: center; color: #999;">특징 정보가 없습니다.</li>';
            return;
        }

        // 특징 렌더링
        featuresList.innerHTML = detailInfo.features.map(feature => 
            `<li class="feature-item">${feature}</li>`
        ).join('');
    }

    renderReviews(shop, detailInfo) {
        const reviewsSection = document.querySelector('.detail-section:last-of-type');
        if (!reviewsSection) return;

        // shop-card-data의 리뷰와 shops.json의 리뷰 병합
        const reviews = [];
        
        // shop-card-data의 리뷰 추가
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

        // shops.json의 리뷰 추가
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

        // 익명이고 내용이 없는 리뷰 필터링
        const filteredReviews = reviews.filter(review => {
            const isAnonymous = !review.name || review.name === '익명' || review.name.trim() === '';
            const hasNoComment = !review.comment || review.comment.trim() === '';
            // 익명이고 내용이 없으면 제거
            return !(isAnonymous && hasNoComment);
        });

        if (filteredReviews.length === 0) {
            reviewsSection.innerHTML = '<h2 class="detail-section-title">리뷰</h2><p>아직 리뷰가 없습니다.</p>';
            return;
        }

        // 최신순 정렬
        filteredReviews.sort((a, b) => new Date(b.date) - new Date(a.date));

        let html = '<h2 class="detail-section-title">리뷰</h2>';
        html += '<ul class="reviews-list">';
        
        filteredReviews.slice(0, 10).forEach(review => {
            html += `<li class="review-item">`;
            html += `<div class="review-header">`;
            html += `<span class="review-author">${review.name}</span>`;
            html += `<div>`;
            html += `<span class="review-rating">⭐ ${review.rating}</span>`;
            html += `<span class="review-date">${review.date}</span>`;
            html += `</div>`;
            html += `</div>`;
            html += `<div class="review-comment">${review.comment}</div>`;
            html += `</li>`;
        });

        html += '</ul>';
        reviewsSection.innerHTML = html;
    }

    showError(message) {
        const main = document.querySelector('.main');
        if (main) {
            main.innerHTML = `
                <div class="detail-container">
                    <a href="index.html" class="btn-back">← 목록으로 돌아가기</a>
                    <div class="empty-state">
                        <p>${message}</p>
                    </div>
                </div>
            `;
        }
    }
}

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', () => {
    // shops.json이 로드될 때까지 대기
    if (window.shopsData) {
        new DetailPage();
    } else {
        // shops.json이 아직 로드되지 않았으면 대기
        const checkInterval = setInterval(() => {
            if (window.shopsData) {
                clearInterval(checkInterval);
                new DetailPage();
            }
        }, 100);
        
        // 최대 5초 대기
        setTimeout(() => {
            clearInterval(checkInterval);
            if (!window.shopsData) {
                console.error('shops.json을 로드할 수 없습니다.');
                new DetailPage(); // 그래도 시도
            }
        }, 5000);
    }
});
