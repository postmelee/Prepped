# Prepped

시니어 사용자가 키오스크 앞에서 메뉴를 처음부터 찾지 않도록, 자주 먹는 메뉴 조합을 휴대폰에서 QR로 미리 준비하는 PWA입니다. 맥도날드·서브웨이·스타벅스의 공식 메뉴 페이지에서 수집한 카탈로그를 조회하고, 키오스크는 사용자가 고른 매장의 QR 그룹만 실제 메뉴로 복원합니다.

## 화면

- `/` — 모바일 메뉴 QR PWA
  - 세 매장의 전체 메뉴 495개를 매장·카테고리별로 조회
  - 이미지, 이름, 핵심 변형, 공식/예상 가격과 커스텀 가능 항목 표시
  - 매장별 최대 20개 메뉴 저장과 QR 포함 여부 관리
  - 여러 매장의 설정을 하나의 QR로 직렬화
- `/kiosk` — 노트북 키오스크 데모
  - 맥도날드·서브웨이·스타벅스 키오스크 선택
  - 카메라, 샘플 또는 수동 입력으로 QR 인식
  - 선택한 매장 그룹만 카탈로그 API로 해석해 실제 이미지·제품명·옵션 표시
  - 미확인 메뉴 ID 안내와 결제 데모

## QR 계약

한 매장은 `store={menuId,menuId}` 형식으로 직렬화하고 여러 매장은 세미콜론으로 구분합니다.

```text
mcdonald={mcdonald-178,mcdonald-720,mcdonald-28}
mcdonald={mcdonald-178};subway={subway-1530-15cm};starbucks={starbucks-94}
```

QR에는 매장 키와 메뉴 ID만 넣습니다. 메뉴명·가격·이미지·옵션은 스캔 시 카탈로그 API에서 조회합니다. 메뉴 조합과 QR 포함 여부는 브라우저 `localStorage`에만 저장되며 서버 또는 다른 기기로 동기화되지 않습니다. 기존 숫자형 맥도날드 설정과 QR은 알려진 ID에 한해 새 카탈로그 ID로 변환합니다.

상세 계약은 [기술 명세](docs/technical-specification.md), API 요청·응답은 [API 명세](docs/api-specification.md)를 참고하세요.

## 로컬 실행

요구 사항: Node.js `>=22.13.0`

```bash
npm install
npm run dev
```

개발 서버가 안내하는 주소에서 `/`와 `/kiosk`를 엽니다. 노트북 카메라는 브라우저 권한과 보안 컨텍스트가 필요합니다. 프론트엔드는 같은 Origin의 `/api/catalog`을 호출하며, 로컬과 API 미설정 Sites 환경에서는 검증된 내장 스냅샷을 사용합니다. 실제 AWS API를 연결할 때는 Sites Worker에 `PREPPED_API_BASE_URL`을 설정합니다.

## 메뉴 카탈로그

카탈로그 버전 `2026-08-16.1`은 맥도날드 91개, 서브웨이 93개, 스타벅스 311개 메뉴로 구성됩니다. 수집기는 런타임 크롤러가 아니라 검토 가능한 스냅샷 갱신 도구입니다.

```bash
npm --prefix backend run catalog:check
npm --prefix backend run catalog:seed:dry
node backend/scripts/collect-catalog.mjs --live --check
```

공식 페이지의 제품명과 이미지 URL만 참조하며 이미지 바이너리는 저장소나 DynamoDB에 복제하지 않습니다. `price.type=estimated`인 값은 화면 흐름을 위한 예상가이며 실제 주문·결제 가격이 아닙니다. 수집과 시드 절차는 [AWS 배포 문서](docs/aws-deployment.md)를 따릅니다.

## 검증

```bash
npm run build
npm test
npm run test:contracts
npm run test:mobile
npm run test:kiosk
npm run lint
npm --prefix backend run check
```

## 기술 구성

- React 19, TypeScript, vinext/Vite 기반 Next.js 호환 라우팅
- `qrcode` QR 생성, `jsqr` 카메라 프레임 인식
- Web App Manifest, Service Worker, `localStorage`
- AWS API Gateway HTTP API, Lambda, DynamoDB, SAM
- OpenAI Sites 배포 설정: `.openai/hosting.json`

## 현재 범위

실제 POS 재고·매장별 판매가, 사용자 계정, 서버 메뉴 설정 동기화, PG 결제는 포함하지 않습니다. `/kiosk`의 결제 버튼과 주문 완료는 사용자 흐름을 보여주는 데모입니다.

프로젝트 운영은 [Hyper-Waterfall](https://github.com/postmelee/hyper-waterfall) v0.3.0 규칙을 따릅니다.
