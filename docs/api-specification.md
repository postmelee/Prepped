# Prepped 카탈로그·주문 초안 API 명세 v1

## 공통

| 항목 | 값 |
|---|---|
| 공개 API Base URL | 환경 변수 `PREPPED_API_BASE_URL`로 주입하는 API Gateway HTTPS URL |
| 웹앱 호출 경계 | 같은 Origin의 `/api/catalog/*`; Sites Worker가 공개 API `/v1/*`로 전달하거나 검증된 스냅샷으로 응답 |
| 콘텐츠 유형 | `application/json; charset=utf-8` |
| 버전 | URL 경로 `/v1` |
| 인증 | MVP 카탈로그는 공개 읽기. 주문 초안 토큰은 키오스크 조회를 허용하는 난수 권한 증표 |
| 시간 형식 | UTC ISO 8601 (`2026-08-16T05:00:00Z`) |
| 금액 | KRW 정수 (`7200`) |

브라우저의 CORS 요청은 배포 환경에서 명시된 ChatGPT Sites Origin과 개발용 로컬 Origin에서만 허용합니다. 요청에 `price`, `totalPrice`, 메뉴명처럼 서버가 계산할 값을 넣어도 서버는 신뢰하지 않습니다.

## 공통 오류 형식

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "메뉴 선택 정보를 다시 확인해주세요.",
    "retryable": false,
    "requestId": "01J..."
  }
}
```

| HTTP | 코드 | 의미 | 프론트엔드 동작 |
|---|---|---|---|
| 400 | `VALIDATION_ERROR` | 본문·토큰·멱등 키 형식이 잘못됨 | 입력을 유지하고 수정 안내 |
| 404 | `STORE_NOT_FOUND` | 지원하지 않는 매장 | 매장 목록을 다시 조회 |
| 404 | `MENU_NOT_FOUND` | 단건 메뉴 ID가 없음 | 목록을 다시 조회하고 저장 설정 확인 |
| 404 | `DRAFT_NOT_FOUND` | 없는·삭제된·만료된 초안 | "QR을 다시 받아주세요"와 재스캔 |
| 409 | `IDEMPOTENCY_CONFLICT` | 같은 멱등 키에 다른 요청을 사용 | 새 키로 한 번만 다시 시도 |
| 429 | `RATE_LIMITED` | 요청 제한 초과 | `Retry-After` 뒤 재시도 |
| 500 | `INTERNAL_ERROR` | 처리 실패 | 안내 후 재시도 |
| 503 | `SERVICE_UNAVAILABLE` | 일시적 서비스·네트워크 오류 | 재시도 버튼 제공 |

`requestId`는 고객 지원과 CloudWatch 로그 연결에만 사용합니다. 토큰·개인정보·결제수단은 오류 응답과 로그에 포함하지 않습니다.

## 도메인 타입

### 카탈로그 메뉴

```json
{
  "id": "subway-1530-15cm",
  "storeId": "subway",
  "categoryId": "sandwich",
  "baseProductId": "1530",
  "name": "에그마요",
  "variant": {
    "label": "15cm",
    "attributes": { "length": "15cm" }
  },
  "price": {
    "amount": 6200,
    "currency": "KRW",
    "type": "official",
    "sourceUrl": "https://www.subway.co.kr/menuList/sandwich"
  },
  "optionGroups": [
    {
      "id": "subway-bread",
      "name": "빵",
      "selectionMode": "single",
      "minSelections": 1,
      "maxSelections": 1,
      "values": [
        { "id": "white", "name": "화이트", "priceDelta": 0, "isDefault": true }
      ]
    }
  ],
  "source": {
    "provider": "subway",
    "productId": "1530",
    "productUrl": "https://www.subway.co.kr/menuList/sandwich",
    "imageUrl": "https://...",
    "imageUsage": "reference-only",
    "collectedAt": "2026-08-16T07:00:00Z"
  },
  "isAvailable": true
}
```

- `id`는 QR에 넣는 카탈로그 ID이며 영문·숫자·하이픈·밑줄만 허용합니다. 현재 스냅샷은 `{storeId}-{sourceProductId}`에 핵심 변형 suffix를 붙여 만듭니다.
- `baseProductId`와 `source.productId`는 공식 페이지의 원본 식별자입니다. 공식 식별자가 바뀌면 수집 검토와 레거시 매핑을 거쳐 QR ID를 이관합니다.
- `price.type=estimated`이면 표시용 예상 가격이며 실제 결제 가격으로 신뢰하지 않습니다.
- `source.imageUsage=reference-only`는 이미지 URL이 출처 참조일 뿐 바이너리 재배포 허가가 아님을 뜻합니다.
- 핵심 주문 변형은 별도 메뉴 ID이고, `optionGroups`는 해당 변형에서 가능한 추가 선택을 설명합니다. 원문 QR v0.1.0은 옵션 ID를 별도 전송하지 않습니다.

### 주문 항목

```json
{
  "menuId": "103",
  "quantity": 1,
  "optionIds": ["single", "no-pickle"]
}
```

| 필드 | 규칙 |
|---|---|
| `menuId` | 서버 카탈로그에 존재하는 문자열 ID |
| `quantity` | 1 이상 9 이하 정수 |
| `optionIds` | 해당 메뉴에서 허용된 중복 없는 옵션 ID 배열, 생략 시 `[]` |

### 주문 초안 스냅샷

```json
{
  "token": "opaque-token",
  "store": { "id": "mcdonald", "name": "맥도날드" },
  "items": [
    {
      "menuId": "103",
      "name": "1955 버거",
      "quantity": 1,
      "unitPrice": 7200,
      "options": [
        { "id": "single", "name": "단품", "priceDelta": 0 },
        { "id": "no-pickle", "name": "피클 제외", "priceDelta": 0 }
      ],
      "lineTotal": 7200
    }
  ],
  "totalPrice": 7200,
  "currency": "KRW",
  "createdAt": "2026-08-16T05:00:00Z",
  "expiresAt": "2026-09-15T05:00:00Z"
}
```

`name`, `unitPrice`, `options`, `lineTotal`, `totalPrice`는 모두 서버 카탈로그가 계산해 저장한 스냅샷입니다. 클라이언트가 생성 요청에서 제출한 값은 반영하지 않습니다.

## `GET /v1/stores`

지원 매장과 카테고리를 정렬 순서대로 반환합니다.

### 성공 응답 — `200`

```json
{
  "data": {
    "stores": [
      {
        "id": "mcdonald",
        "name": "맥도날드",
        "shortName": "맥도날드",
        "sortOrder": 1,
        "categories": [
          { "id": "burger", "name": "버거", "sortOrder": 1 }
        ]
      }
    ],
    "catalogVersion": "2026-08-16.1"
  }
}
```

## `GET /v1/stores/{storeId}/menus`

선택 매장의 판매 가능 메뉴 요약을 반환합니다. `storeId`는 `mcdonald`, `subway`, `starbucks` 중 하나입니다.

### 쿼리

| 필드 | 필수 | 규칙 |
|---|---|---|
| `category` | 아니오 | 매장에 속한 카테고리 ID |
| `limit` | 아니오 | 기본 100, 1~200 |
| `cursor` | 아니오 | 이전 응답의 불투명 커서 |

### 성공 응답 — `200`

```json
{
  "data": {
    "store": { "id": "starbucks", "name": "스타벅스" },
    "menus": [
      {
        "id": "starbucks-94",
        "storeId": "starbucks",
        "categoryId": "drink-espresso",
        "name": "카페 아메리카노",
        "variant": { "label": "HOT", "attributes": { "temperature": "hot" } },
        "price": { "amount": 5700, "currency": "KRW", "type": "estimated" },
        "source": {
          "provider": "starbucks",
          "productId": "94",
          "productUrl": "https://www.starbucks.co.kr/menu/drink_view.do?product_cd=94",
          "imageUsage": "reference-only",
          "collectedAt": "2026-08-16T07:00:00Z"
        },
        "isAvailable": true
      }
    ],
    "nextCursor": null,
    "catalogVersion": "2026-08-16.1"
  }
}
```

목록은 `category.sortOrder`, `menu.sortOrder`, `menu.id` 순서로 결정적입니다. 목록 응답은 옵션 전체를 생략하고 상세 또는 일괄 해석 응답에서 제공합니다.

## `GET /v1/menus/{menuId}`

하나의 안정 메뉴 ID에 대한 전체 카탈로그 메뉴와 옵션 그룹을 반환합니다.

### 성공 응답 — `200`

```json
{
  "data": {
    "menu": { "id": "subway-1530-15cm", "optionGroups": [] },
    "catalogVersion": "2026-08-16.1"
  }
}
```

없는 ID는 `404 MENU_NOT_FOUND`입니다.

## `POST /v1/catalog/resolve`

키오스크가 선택한 매장 그룹의 메뉴 ID를 현재 카탈로그와 일괄 대응합니다. 다른 매장에 속하거나 없는 ID는 전체 요청을 실패시키지 않고 `unknownMenuIds`로 반환합니다.

### 요청

```json
{
  "storeId": "mcdonald",
  "menuIds": ["mcdonald-178", "mcdonald-720", "unknown-id"]
}
```

| 필드 | 필수 | 규칙 |
|---|---|---|
| `storeId` | 예 | 지원 매장 키 |
| `menuIds` | 예 | 중복 없는 QR-safe ID 0~20개, 요청 순서 유지 |

### 성공 응답 — `200`

```json
{
  "data": {
    "store": { "id": "mcdonald", "name": "맥도날드" },
    "menus": [
      { "id": "mcdonald-178", "name": "빅맥® 세트", "optionGroups": [] },
      { "id": "mcdonald-720", "name": "후렌치 후라이 Medium", "optionGroups": [] }
    ],
    "unknownMenuIds": ["unknown-id"],
    "catalogVersion": "2026-08-16.1"
  }
}
```

`menus`와 `unknownMenuIds`는 각각 요청에서 처음 등장한 순서를 유지합니다. 동일 ID가 반복되면 첫 항목만 처리합니다.

## `GET /v1/health`

배포 스모크 테스트와 운영 점검용 경로입니다. 인증·주문 데이터를 요구하지 않습니다.

### 성공 응답 — `200`

```json
{
  "data": {
    "status": "ok",
    "service": "prepped-order-api",
    "version": "v1"
  }
}
```

## `POST /v1/drafts`

보호자 화면에서 서버 주문 초안을 만들고 QR에 넣을 토큰 URL을 반환합니다.

### 요청

```json
{
  "storeId": "mcdonald",
  "items": [
    { "menuId": "103", "quantity": 1, "optionIds": ["single", "no-pickle"] },
    { "menuId": "201", "quantity": 1, "optionIds": [] }
  ]
}
```

| 필드 | 필수 | 규칙 |
|---|---|---|
| `storeId` | 예 | 서버 카탈로그에 등록된 매장 ID |
| `items` | 예 | 1개 이상 20개 이하 |
| `items[].menuId` | 예 | 선택 매장에 속하는 메뉴 ID |
| `items[].quantity` | 예 | 1~9 |
| `items[].optionIds` | 아니오 | 메뉴별 허용 옵션 ID |

### 성공 응답 — `201`

```json
{
  "data": {
    "draft": {
      "token": "opaque-token",
      "store": { "id": "mcdonald", "name": "맥도날드" },
      "items": [
        {
          "menuId": "103",
          "name": "1955 버거",
          "quantity": 1,
          "unitPrice": 7200,
          "options": [
            { "id": "single", "name": "단품", "priceDelta": 0 },
            { "id": "no-pickle", "name": "피클 제외", "priceDelta": 0 }
          ],
          "lineTotal": 7200
        }
      ],
      "totalPrice": 7200,
      "currency": "KRW",
      "createdAt": "2026-08-16T05:00:00Z",
      "expiresAt": "2026-09-15T05:00:00Z"
    },
    "qrPayload": "https://{KIOSK_WEB_BASE_URL}/kiosk?draft=opaque-token"
  }
}
```

`qrPayload` 전체를 QR 이미지로 인코딩합니다. 프론트엔드는 토큰을 별도 조합하거나 주문 세부 정보를 URL 쿼리에 넣지 않습니다.

## `GET /v1/drafts/{token}`

키오스크가 QR 스캔 후 주문을 큰 글씨로 복원하는 읽기 전용 경로입니다. 호출해도 초안은 소진·변경되지 않습니다.

### 성공 응답 — `200`

```json
{
  "data": {
    "draft": {
      "token": "opaque-token",
      "store": { "id": "mcdonald", "name": "맥도날드" },
      "items": [
        {
          "menuId": "103",
          "name": "1955 버거",
          "quantity": 1,
          "unitPrice": 7200,
          "options": [{ "id": "single", "name": "단품", "priceDelta": 0 }],
          "lineTotal": 7200
        }
      ],
      "totalPrice": 7200,
      "currency": "KRW",
      "createdAt": "2026-08-16T05:00:00Z",
      "expiresAt": "2026-09-15T05:00:00Z"
    }
  }
}
```

`DRAFT_NOT_FOUND`는 존재하지 않는 토큰, 명시 삭제, TTL 만료를 구분하지 않고 동일하게 반환합니다.

## `POST /v1/drafts/{token}/complete`

키오스크의 최종 확인과 데모 결제 완료를 별도 주문 기록으로 남깁니다. 실제 결제 승인·카드 정보 처리는 하지 않습니다.

### 헤더

```http
Idempotency-Key: 5a9d3b8c-9f3a-4adc-ae8a-10a9b3477d3c
```

`Idempotency-Key`는 클라이언트가 한 번의 최종 확인에 대해 생성한 UUID이며 필수입니다. 시간 초과나 네트워크 오류가 나면 **같은 키**로 재시도합니다.

### 요청

```json
{
  "paymentMethod": "demo"
}
```

현재 허용값은 `demo`뿐입니다. 실제 결제 수단, 카드 토큰, 적립 정보는 보내거나 저장하지 않습니다.

### 성공 응답 — `201`

```json
{
  "data": {
    "order": {
      "id": "ord_01J...",
      "draftToken": "opaque-token",
      "status": "COMPLETED",
      "paymentMethod": "demo",
      "confirmedAt": "2026-08-16T05:03:00Z",
      "totalPrice": 7200,
      "currency": "KRW"
    },
    "idempotentReplay": false
  }
}
```

같은 토큰을 다른 `Idempotency-Key`로 완료하면 별도 주문 기록이 생성됩니다. 이는 보호자가 보낸 하나의 QR을 여러 번 사용할 수 있다는 MVP 요구사항을 유지합니다. 동일 키의 재시도는 `200`과 `idempotentReplay: true`로 기존 결과를 반환합니다.

## QR 파싱·주문 초안 전환 규칙

키오스크는 다음 순서로 QR 값을 판단합니다.

1. v0.1.0의 기본 흐름은 기존 `store={menuId,menuId}` 파서를 사용하고, 사용자가 선택한 매장 그룹만 `POST /v1/catalog/resolve`로 보냅니다.
2. URL 경로가 `/kiosk`이고 `draft` 쿼리가 있는 주문 초안 QR을 별도 기능으로 활성화한 환경에서는 토큰 형식을 확인하고 초안 조회 API를 호출할 수 있습니다.
3. 둘 다 아니면 `VALIDATION_ERROR` 안내와 재스캔 버튼을 제공합니다.

Task #7은 원문 다중 매장 QR을 계약 경계로 유지하며 주문 초안 URL을 기본 QR로 바꾸지 않습니다. 토큰 QR의 제품 적용은 별도 승인·프론트 통합 전까지 #3 백엔드 기능으로만 존재합니다.

## 현재 카탈로그 스냅샷

버전 `2026-08-16.1`은 공식 메뉴 페이지에서 수집·검토한 맥도날드 91개, 서브웨이 93개, 스타벅스 311개 메뉴를 포함합니다. 메뉴 목록 API는 총 495개를 페이지 단위로 반환합니다. 이미지 URL은 공식 호스트의 `reference-only` 참조이며, 서브웨이 에그마요 15cm/30cm 외 현재 가격 값은 모두 `estimated`입니다. 옵션 그룹은 화면의 커스텀 가능성을 설명하지만 QR v0.1.0에는 선택 옵션을 넣지 않습니다.
