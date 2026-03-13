# 인천출장마사지 사이트

인천출장마사지 사이트는 지역 및 테마별 필터링 기능을 제공하는 마사지 업체 정보 사이트입니다.

## 파일 구조

- `index.html` - 홈페이지 (업체 카드 목록 및 필터링)
- `styles.css` - 스타일시트
- `app.js` - 필터링 및 카드 렌더링 로직
- `detail.js` - 상세 페이지 로직
- `detail-template.html` - 상세 페이지 템플릿
- `shop-card-data.js` - 업체 카드 데이터
- `shops.json` - 업체 상세 정보 데이터
- `generate-static-pages.js` - 정적 HTML 생성 스크립트
- `images/` - 업체 이미지 폴더

## 기능

### 1. 필터링 기능
- **지역 필터**: 전체 지역 / 상세지역 / 동,역 선택
- **테마 필터**: 전체, 마사지, 출장마사지, 스웨디시, 아로마마사지, 출장

### 2. 업체 카드
- 업체 이미지, 이름, 평점, 위치, 가격 정보 표시
- `shop-card-data.js`의 데이터를 기반으로 자동 렌더링
- `showHealingShop: true`인 업체가 상단에 배치됨

### 3. 상세 페이지
- 업체 카드 클릭 시 상세 페이지로 이동
- `shops.json`의 상세 정보 표시 (코스, 관리사 정보, 특징, 리뷰 등)

## 사용 방법

### 1. 정적 HTML 생성

각 업체에 대해 지역/테마 조합별로 정적 HTML을 생성하려면:

```bash
node generate-static-pages.js
```

이 스크립트는 각 업체에 대해 다음 조합으로 HTML 파일을 생성합니다:
- 지역 (전체/상세지역/동,역)
- 테마 (전체/마사지/출장마사지/스웨디시/아로마마사지/출장)

생성된 파일명 형식: `company-{지역}-{상세지역}-{동}-{테마}-{업체명}.html`

### 2. 로컬 서버 실행

브라우저에서 직접 열면 CORS 오류가 발생할 수 있으므로, 로컬 서버를 사용하는 것을 권장합니다:

```bash
# Python 3
python -m http.server 8000

# Node.js (http-server 설치 필요)
npx http-server -p 8000

# PHP
php -S localhost:8000
```

그 후 브라우저에서 `http://localhost:8000` 접속

## 데이터 구조

### shop-card-data.js
```javascript
{
  id: 1,
  name: '업체명',
  region: '서울',
  district: '강남',
  dong: '논현동',
  address: '주소',
  detailAddress: '상세주소',
  phone: '전화번호',
  rating: 4.9,
  reviewCount: 142,
  price: '120,000원~',
  description: '설명',
  image: 'images/이미지.jpg',
  services: ['스웨디시', '아로마'],
  operatingHours: '운영시간',
  showHealingShop: true,
  greeting: '인사말',
  reviews: [...]
}
```

### shops.json
```json
{
  "shops": [
    {
      "id": "shop_id",
      "name": "업체명",
      "courses": [...],
      "staffInfo": "관리사 정보",
      "features": [...],
      "reviews": [...]
    }
  ]
}
```

## 커스터마이징

### 스타일 수정
`styles.css` 파일을 수정하여 디자인을 변경할 수 있습니다.

### 필터 옵션 추가
`index.html`의 테마 필터 옵션을 수정하거나, `app.js`의 `matchesTheme` 함수를 수정하여 필터링 로직을 변경할 수 있습니다.

## 주의사항

- 이미지 파일은 `images/` 폴더에 저장되어 있어야 합니다.
- `shop-card-data.js`와 `shops.json`의 데이터 형식을 유지해야 합니다.
- 정적 HTML 생성 시 많은 파일이 생성될 수 있으므로 디스크 공간을 확인하세요.
