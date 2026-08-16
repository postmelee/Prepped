# Prepped 주문 초안 API 명세 v1

## 공통

| 항목 | 값 |
|---|---|
| Base URL | 환경 변수 `PREPPED_API_BASE_URL`로 주입하는 API Gateway HTTPS URL |
| 콘텐츠 유형 | `application/json; charset=utf-8` |
| 버전 | URL 경로 `/v1` |
| 인증 | MVP는 사용자 로그인 없음. 초안 토큰은 키오스크 조회를 허용하는 난수 권한 증표 |
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
| 404 | `DRAFT_NOT_FOUND` | 없는·삭제된·만료된 초안 | "QR을 다시 받아주세요"와 재스캔 |
| 409 | `IDEMPOTENCY_CONFLICT` | 같은 멱등 키에 다른 요청을 사용 | 새 키로 한 번만 다시 시도 |
| 429 | API Gateway 기본 오류 응답 | 요청 제한 초과 | 잠시 뒤 재시도 |
| 500 | `INTERNAL_ERROR` | 처리 실패 | 안내 후 재시도 |
| 503 | `SERVICE_UNAVAILABLE` | 일시적 서비스·네트워크 오류 | 재시도 버튼 제공 |

Lambda가 생성한 오류의 `requestId`는 고객 지원과 CloudWatch 로그 연결에만 사용합니다. API Gateway 단계에서 제한된 429 응답은 Lambda 이전에 반환되므로 이 오류 본문 형식과 다를 수 있습니다. 토큰·개인정보·결제수단은 오류 응답과 로그에 포함하지 않습니다.

## 도메인 타입

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

## QR 파싱 전환 규칙

키오스크는 다음 순서로 QR 값을 판단합니다.

1. URL 경로가 `/kiosk`이고 `draft` 쿼리가 있으면 토큰 형식을 확인하고 초안 조회 API를 호출합니다.
2. 없으면 기존 `store={menuId,menuId}` 파서를 사용합니다.
3. 둘 다 아니면 `VALIDATION_ERROR` 안내와 재스캔 버튼을 제공합니다.

이 규칙은 기존 `mcdonald={101,201,301}` QR을 계속 지원하면서 서버 주문 초안 QR을 추가하기 위한 호환성 계약입니다.
