# Task #7 구현계획서 — 실메뉴 카탈로그 API와 다중 매장 QR·키오스크 연동 구축

수행계획서: [`task_m010_7.md`](task_m010_7.md)
GitHub Issue: [#7](https://github.com/postmelee/Prepped/issues/7)
마일스톤: M010

## 단계 개요

| Stage | 제목 | 주요 산출 | 검증 |
|---|---|---|---|
| 1 | 카탈로그 계약·출처·공용 모델 | `shared/catalog/**`, `shared/qr/**`, 공식·조사 문서 | 공용 계약/QR 단위 테스트, 문서 검사 |
| 2 | DynamoDB 카탈로그와 조회 API | `backend/src/catalog/**`, `backend/template.yaml` | 백엔드 테스트·빌드·체크 |
| 3 | 세 브랜드 실메뉴 스냅샷과 로컬 API | `shared/catalog/data/**`, `backend/scripts/**`, `worker/index.ts` | 데이터 무결성·수집기 fixture·API 테스트 |
| 4 | 모바일 전체 메뉴·다중 매장 설정 | `app/page.tsx`, `app/lib/catalog/**`, 모바일 컴포넌트 | 프론트 테스트·빌드·브라우저 확인 |
| 5 | 매장 선택형 키오스크·QR 매칭 | `app/kiosk/page.tsx`, 키오스크 컴포넌트 | QR 통합 테스트·빌드·브라우저 확인 |
| 6 | 종단 검증·운영 문서·Sites 버전 | `README.md`, 공식 문서, 최종 회귀 테스트 | 전체 테스트·빌드·스모크·Sites 확인 |

## 문서 위치 확인

| 파일 | 수행계획서상 선택 위치 | Stage 산출물 경로 | 일치 여부 | 비고 |
|---|---|---|---|---|
| `docs/technical-specification.md` | `docs/` | Stage 1·6 동일 경로 | OK | QR·로컬 저장·화면 흐름 계약 |
| `docs/api-specification.md` | `docs/` | Stage 1·2·6 동일 경로 | OK | #3 문서에 카탈로그 경로 추가 |
| `docs/backend-architecture.md` | `docs/` | Stage 1·2·6 동일 경로 | OK | 단일 테이블 접근 패턴 추가 |
| `mydocs/tech/task_m010_7_catalog_sources.md` | `mydocs/tech/` | Stage 1 동일 경로 | OK | 공식 출처·수집일·권리·가격 근거 |
| `README.md` | 저장소 루트 | Stage 6 동일 경로 | OK | 실행·환경 변수·사용 흐름 |

## 선행 브랜치 통합 규칙

- Stage 1 시작 시 `origin/develop/backend`를 `--no-commit --no-ff`로 병합해 Issue #3의 백엔드 기반과 공식 문서를 보존한다.
- Issue #4 화면이 포함된 현재 기준 커밋을 우선하며, 충돌은 양쪽 기능을 함께 유지하는 방향으로 해결한다.
- #3 소유의 주문 초안 도메인은 필요한 카탈로그 포트 연결 외에는 변경하지 않는다.
- 최종 PR은 선행 PR 상태에 따라 적층 base를 선택하고, `devel` 재기준화 조건과 의존 커밋을 본문에 기록한다.

## Stage 1 — 카탈로그 계약·출처·공용 모델

### 산출물

신규:

- `shared/catalog/types.ts`
- `shared/catalog/schema.ts`
- `shared/qr/payload.ts`
- `tests/catalog-contract.test.mjs`
- `tests/qr-payload.test.mjs`
- `mydocs/tech/task_m010_7_catalog_sources.md`

수정:

- `docs/technical-specification.md`
- `docs/api-specification.md`
- `docs/backend-architecture.md`
- `package.json`

### 변경 내용

- `Store`, `Category`, `MenuItem`, `MenuVariant`, `OptionGroup`, `OptionValue`, `Money`, `SourceReference` 계약과 런타임 검증 함수를 정의한다.
- 외부 ID를 `{storeKey}-{slug-or-source-id}` 형태의 안정 문자열로 정하고 QR 허용 문자 범위에 맞춘다.
- 매장 순서가 고정된 결정적 QR 직렬화기, 중복·공백·빈 그룹을 처리하는 호환 파서, 선택 매장 추출기를 구현한다.
- 맥도날드·서브웨이·스타벅스 공식 출처와 확인된 수집 필드, 가격 노출 여부, 이미지 사용 정책, 수집일을 기록한다.
- #3 API·아키텍처 문서에 카탈로그 계약, 레거시 다중 매장 QR 우선 경계, 접근 패턴을 설계 수준으로 추가한다.

### 검증

```bash
node --test tests/catalog-contract.test.mjs tests/qr-payload.test.mjs
npm run lint
git diff --check
```

### 커밋

```text
Task #7 Stage 1: 카탈로그 계약과 다중 매장 QR 모델 확정
```

## Stage 2 — DynamoDB 카탈로그와 조회 API

### 산출물

신규:

- `backend/src/catalog/domain.ts`
- `backend/src/catalog/repository.ts`
- `backend/src/catalog/dynamo-catalog.ts`
- `backend/src/catalog/service.ts`
- `backend/src/handlers/list-stores.ts`
- `backend/src/handlers/list-menus.ts`
- `backend/src/handlers/get-menu.ts`
- `backend/src/handlers/resolve-menus.ts`
- `backend/tests/catalog-domain.test.ts`
- `backend/tests/catalog-dynamo.test.ts`
- `backend/tests/catalog-http.test.ts`

수정:

- `backend/src/runtime.ts`
- `backend/src/runtime-config.ts`
- `backend/src/http/handlers.ts`
- `backend/template.yaml`
- `docs/api-specification.md`
- `docs/backend-architecture.md`

### 변경 내용

- `STORE#{storeId}`, `MENU#{menuId}`와 카테고리 정렬 키를 사용하는 DynamoDB 읽기 접근 패턴을 구현한다.
- `GET /v1/stores`, `GET /v1/stores/{storeId}/menus`, `GET /v1/menus/{menuId}`, `POST /v1/catalog/resolve`의 서비스·HTTP 응답을 구현한다.
- 목록 필터(`category`, `cursor`, `limit`)와 일괄 해석 시 입력 순서, 미확인 ID, 다른 매장 ID 처리 규칙을 고정한다.
- 카탈로그 Lambda와 최소 읽기 권한, 카탈로그 테이블/환경 변수를 SAM 템플릿에 추가한다.
- 주문 초안 카탈로그 포트와 신규 카탈로그 서비스의 경계를 유지하고 기존 #3 테스트를 회귀 검증한다.

### 검증

```bash
(cd backend && npm test)
(cd backend && npm run build)
(cd backend && npm run check)
git diff --check
```

### 커밋

```text
Task #7 Stage 2: DynamoDB 카탈로그 조회 API 구현
```

## Stage 3 — 세 브랜드 실메뉴 스냅샷과 로컬 API

### 산출물

신규:

- `shared/catalog/data/mcdonald.ts`
- `shared/catalog/data/subway.ts`
- `shared/catalog/data/starbucks.ts`
- `shared/catalog/data/index.ts`
- `backend/scripts/collect-catalog.mjs`
- `backend/scripts/seed-catalog.mjs`
- `backend/tests/catalog-data.test.ts`
- `tests/catalog-api.test.mjs`

수정:

- `backend/package.json`
- `worker/index.ts`
- `mydocs/tech/task_m010_7_catalog_sources.md`

### 변경 내용

- 공식 사이트에서 수집 가능한 활성 메뉴명·공식 제품 ID·원본 페이지·이미지 URL을 브랜드별 정규화 스냅샷으로 작성한다.
- 메뉴의 기본 가격, `official|estimated` 가격 유형, 수집일, 옵션 그룹을 포함하고 브랜드별 공통 커스텀 규칙을 실제 메뉴 변형에 연결한다.
- 사이트별 파서 fixture와 시드 변환/무결성 검사를 제공한다. 외부 페이지 구조가 바뀌면 조용히 빈 데이터가 되지 않고 실패한다.
- DynamoDB 일괄 시드 스크립트와 dry-run을 제공한다.
- 웹앱은 `/api/catalog` 동일 출처 경로를 사용한다. Worker는 `PREPPED_API_BASE_URL`이 있으면 AWS API로 프록시하고, 없으면 커밋된 카탈로그 스냅샷을 동일 계약으로 제공한다.
- 이미지 바이너리는 내려받지 않고 URL·출처만 보관하며 UI 기본 정책은 플레이스홀더로 둔다.

### 검증

```bash
node backend/scripts/collect-catalog.mjs --fixtures --check
node backend/scripts/seed-catalog.mjs --dry-run
(cd backend && npm test)
node --test tests/catalog-api.test.mjs
npm run build
git diff --check
```

### 커밋

```text
Task #7 Stage 3: 세 브랜드 실메뉴 시드와 카탈로그 API 연결
```

## Stage 4 — 모바일 전체 메뉴·다중 매장 설정

### 산출물

신규:

- `app/lib/catalog/client.ts`
- `app/lib/catalog/storage.ts`
- `app/components/menu-catalog.tsx`
- `app/components/store-settings.tsx`
- `tests/mobile-menu-flow.test.mjs`

수정:

- `app/page.tsx`
- `app/globals.css`
- `tests/rendered-html.test.mjs`

### 변경 내용

- 정적 맥도날드 배열을 제거하고 카탈로그 API의 세 매장·카테고리·전체 메뉴를 로딩한다.
- 매장 선택 → 카테고리 → 메뉴/변형·옵션 선택 → 매장별 설정 저장 흐름과 로딩·오류·재시도·빈 상태를 구현한다.
- 저장 형식을 `onemeal-menu-v1`에서 매장별 안정 ID 설정으로 확장하되 기존 숫자 맥도날드 설정을 무손실 마이그레이션한다.
- 여러 매장의 활성 설정을 결정적 순서로 직렬화해 단일 QR에 포함하고, 편집 초안 보호와 설정 탭 동작을 보존한다.
- 추정 가격과 이미지 플레이스홀더 상태를 접근 가능한 텍스트로 표시한다.

### 검증

```bash
node --test tests/mobile-menu-flow.test.mjs tests/qr-payload.test.mjs
npm test
npm run lint
git diff --check
```

브라우저에서 `/`의 세 매장 전체 메뉴, 설정 저장/재로드, 다중 매장 QR, 초안 이탈 확인을 수행한다.

### 커밋

```text
Task #7 Stage 4: 모바일 전체 메뉴와 다중 매장 QR 연동
```

## Stage 5 — 매장 선택형 키오스크·QR 매칭

### 산출물

신규:

- `app/lib/catalog/resolve.ts`
- `app/components/kiosk-store-selector.tsx`
- `app/components/kiosk-menu-result.tsx`
- `tests/kiosk-qr-flow.test.mjs`

수정:

- `app/kiosk/page.tsx`
- `app/globals.css`
- `tests/rendered-html.test.mjs`

### 변경 내용

- 카메라 실행 전에 맥도날드·서브웨이·스타벅스 키오스크를 선택하게 하고 현재 매장을 화면에 지속 표시한다.
- 스캔/수동 QR 원문에서 선택 매장 그룹만 추출해 `POST /api/catalog/resolve`로 메뉴를 해석한다.
- 다른 매장 그룹 무시, 중복 ID 제거, 빈 선택, 미확인 ID, 부분 성공, API 재시도 상태를 구현한다.
- 매칭 결과에 제품명·가격 유형·옵션 요약·이미지 플레이스홀더를 보여주고 현재 데모 결제 단계로 연결한다.
- 기존 단일 매장 QR과 다중 매장 QR을 모두 회귀 검증한다.

### 검증

```bash
node --test tests/kiosk-qr-flow.test.mjs tests/catalog-api.test.mjs tests/qr-payload.test.mjs
npm test
npm run lint
git diff --check
```

브라우저에서 `/kiosk` 매장 선택, 샘플/수동 입력, 선택 매장 필터, 미확인 ID, 다시 스캔을 확인한다.

### 커밋

```text
Task #7 Stage 5: 선택 매장 QR 파싱과 키오스크 메뉴 매칭 구현
```

## Stage 6 — 종단 검증·운영 문서·Sites 버전

### 산출물

수정:

- `README.md`
- `docs/technical-specification.md`
- `docs/api-specification.md`
- `docs/backend-architecture.md`
- `docs/aws-deployment.md`
- `tests/rendered-html.test.mjs`
- `mydocs/orders/20260816.md`

### 변경 내용

- 카탈로그 수집/갱신, dry-run/시드, API 환경 변수, 로컬 fallback, 이미지·가격 정책, 모바일·키오스크 사용법을 문서화한다.
- 모바일 저장 마이그레이션과 QR 호환 표를 확정하고, 문서 예시를 실제 안정 메뉴 ID로 갱신한다.
- 전체 프론트·백엔드·데이터 검증과 두 경로 브라우저 종단 확인을 수행한다.
- AWS 자격 증명이 있으면 dev 스택/조회 API를 스모크하고, 없으면 SAM 템플릿·핸들러 수준 결과와 미실행 사유를 기록한다.
- Sites 새 버전을 저장하고 `/`, `/kiosk`, `/api/catalog` 응답을 확인한다.

### 검증

```bash
npm test
npm run lint
(cd backend && npm run check)
node backend/scripts/collect-catalog.mjs --fixtures --check
node backend/scripts/seed-catalog.mjs --dry-run
git diff --check
git status --short
```

### 커밋

```text
Task #7 Stage 6: 종단 검증과 운영 문서 정리
```

## 검증

- 각 Stage 검증 명령은 단계 보고서 작성 전에 실행한다.
- 실패한 검증은 단계 완료로 처리하지 않는다.
- 계획 변경이 필요하면 구현계획서를 먼저 갱신한다. 본 task는 PR 생성까지 명시 승인되었지만 범위가 달라지는 변경은 별도 변경 근거를 문서화한다.
- 문서 위치가 수행계획서 판단과 달라지면 구현 전에 수행계획서 또는 구현계획서를 갱신한다.

## 커밋

- 단계 커밋은 단계 산출물과 `mydocs/working/task_m010_7_stage{N}.md`를 함께 묶는다.
- 커밋 메시지는 `Task #7 Stage {N}: {핵심 내용 요약}` 형식을 따른다.

## 단계 의존성

- Stage 1은 #3 백엔드 기반 병합과 공용 계약 확정을 함께 수행한다.
- Stage 2는 Stage 1 계약을 DynamoDB/API로 구현한다.
- Stage 3은 Stage 2 저장소에 넣을 시드와 웹앱 동일 출처 API를 완성한다.
- Stage 4와 Stage 5는 동일 카탈로그/QR 모듈을 사용하며, Stage 4 저장 형식이 Stage 5 해석 입력이 된다.
- Stage 6은 모든 단계 검증·보고서가 완료된 후 수행한다.

## 위험과 대응

- **선행 브랜치 충돌**: 병합 전에 공통 조상을 확인하고, 충돌 파일별로 #3 백엔드 계약과 #4 UI 동작을 모두 보존한 근거를 Stage 1 보고서에 기록한다.
- **vinext API Route 호환성**: Next Route Handler에 의존하지 않고 Worker 진입점에서 `/api/catalog`을 명시 처리한다.
- **외부 사이트 파서 불안정**: fixture 검증과 필수 항목 수 하한을 두고, 외부 네트워크 실패는 기존 커밋 스냅샷을 훼손하지 않는다.
- **카탈로그 규모·번들 크기**: 목록 응답은 필요한 요약만 제공하고 상세/옵션은 별도 조회 또는 선택 항목 해석 응답에 포함한다.
- **공식 이미지 표시 실패**: 안전한 플레이스홀더를 항상 제공하고 외부 이미지 허용 설정을 필수로 만들지 않는다.
- **QR 길이**: 메뉴 개수 상한과 직렬화 길이를 테스트하고 사용자에게 초과 상태를 저장 전에 안내한다.

## 승인 요청 사항

- 위 6개 Stage 분할, 산출물, 검증 명령, 커밋 메시지
- #3 병합, #4 UI 보존, 동일 출처 Worker API와 AWS 프록시/fallback 구조
- 수집 스냅샷·공식 이미지 URL·추정 가격 메타데이터 정책
- 작업지시자가 같은 스레드에서 PR 생성까지 모든 승인 게이트를 승인했으므로 본 구현계획 역시 승인된 것으로 간주하고 Stage 1을 계속한다.
