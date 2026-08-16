# Task #7 최종 보고서 — 실메뉴 카탈로그 API와 다중 매장 QR·키오스크 연동

GitHub Issue: [#7](https://github.com/postmelee/Prepped/issues/7)
마일스톤: M010

## 작업 요약

- 대상 이슈: #7
- 마일스톤: M010
- 단계 수: 6
- 작업 목적: 맥도날드·서브웨이·스타벅스의 실제 메뉴 카탈로그를 조회 API로 제공하고, 모바일 다중 매장 설정 QR을 선택 매장 키오스크에서 실제 메뉴로 복원한다.
- 기준 브랜치: PR 직전 다시 fetch한 `origin/develop/backend`의 Task #3 최신 커밋 `2145caa`까지 `local/task7`에 병합해 주문 초안 백엔드와 실제 Sites 운영 URL 문서 위에 카탈로그·프론트 흐름을 통합했다.

## 변경 파일 목록과 영향 범위

| 경로 | 변경 요약 | 영향 범위 |
|---|---|---|
| `shared/catalog/**` | 세 브랜드 계약, 런타임 검증, 495개 검토 스냅샷, 13개 옵션 그룹, DynamoDB projection | 프론트·백엔드 공통 메뉴 진실 원천 |
| `shared/qr/payload.ts` | 결정적 다중 매장 serializer, 호환 parser, 선택 매장 추출 | 모바일 QR·키오스크 계약 |
| `backend/src/catalog/**`, `backend/src/handlers/**` | 매장·목록·상세·일괄 해석 도메인과 Lambda 핸들러 | 공개 읽기 API 4개 |
| `backend/template.yaml`, `backend/infra/**` | CatalogTable, 카탈로그 전용 읽기 역할, 명시적 함수·테이블 이름 | SAM·CloudFormation·최소 권한 |
| `backend/scripts/**` | 공식 페이지 fixture/live 수집 검증과 1,022개 항목 DynamoDB 시드 | 카탈로그 갱신·운영 |
| `worker/index.ts`, `shared/catalog/local-api.ts` | 같은 Origin `/api/catalog` AWS proxy와 검증 스냅샷 fallback | 로컬·Sites·AWS 연결 경계 |
| `app/page.tsx`, `app/components/menu-catalog.tsx`, `app/components/store-settings.tsx`, `app/lib/catalog/**` | 세 매장 전체 메뉴, 이미지·가격 유형·옵션 안내, 매장별 설정과 다중 매장 QR | 모바일 `/` |
| `app/kiosk/page.tsx`, `app/components/kiosk-*.tsx`, `app/lib/catalog/resolve.ts` | 키오스크 매장 선택, 선택 그룹 resolve, 실제 메뉴·미확인 ID·재시도·결제 데모 | 키오스크 `/kiosk` |
| `tests/**`, `backend/tests/**` | 공용 계약, API, 저장 마이그레이션, 모바일·키오스크, DynamoDB·SAM 회귀 테스트 | 자동 검증 |
| `README.md`, `docs/**`, `mydocs/tech/task_m010_7_catalog_sources.md` | 사용법, API·아키텍처·AWS 운영, 출처·이미지·가격 정책 | 개발·리뷰·운영 문서 |

## 문서 위치 검증

| 파일 | 계획된 위치 | 실제 위치 | 결과 | 근거 |
|---|---|---|---|---|
| `docs/technical-specification.md` | `docs/` | `docs/technical-specification.md` | OK | 수행계획서의 제품 기술 명세 위치와 일치 |
| `docs/api-specification.md` | `docs/` | `docs/api-specification.md` | OK | 기존 #3 API 문서를 같은 공식 경로에서 확장 |
| `docs/backend-architecture.md` | `docs/` | `docs/backend-architecture.md` | OK | 기존 #3 아키텍처 문서를 같은 공식 경로에서 확장 |
| `docs/aws-deployment.md` | `docs/` | `docs/aws-deployment.md` | OK | 기존 AWS 운영 문서에 카탈로그 시드·Sites 연결 절차 추가 |
| `mydocs/tech/task_m010_7_catalog_sources.md` | `mydocs/tech/` | `mydocs/tech/task_m010_7_catalog_sources.md` | OK | 공식 출처·수집 근거를 내부 기술 조사 위치에 기록 |
| `README.md` | 저장소 루트 | `README.md` | OK | 실행·검증·현재 범위 진입 문서 유지 |

`mydocs/manual`에는 제품 문서를 추가하지 않았다.

## 변경 전·후 정량 비교

| 지표 | 변경 전 | 변경 후 |
|---|---:|---:|
| 웹앱 메뉴 데이터 | 맥도날드 mock 메뉴 | 공식 페이지 기반 3개 브랜드 495개 |
| 브랜드별 메뉴 | 맥도날드 mock만 | 맥도날드 91, 서브웨이 93, 스타벅스 311 |
| 카탈로그 옵션 그룹 | 없음 | 13개, 모든 참조 무결성 검증 |
| 카탈로그 조회 API | 없음 | 매장·목록·상세·resolve 4개 |
| DynamoDB 시드 projection | 없음 | 1,022개 |
| QR 매장 그룹 | 단일 mock 중심 | 최대 3개 매장 결정적 직렬화, 매장별 최대 20개 |
| 백엔드 자동 테스트 | 카탈로그 이전 #3 범위 | 31개 통과 |
| `develop/backend` 기준 PR diff | 해당 없음 | 87개 파일, +7,831/-482줄; Task #1·#4 선행 프론트 포함 |

## 검증 결과

| 수용 기준 | 결과 |
|---|---|
| 공식 메뉴명·이미지 URL 수집 가능성과 출처 정책 | OK — live/fixture 수집 검증으로 91/94/311 원본 항목 확인, 정규화 후 서브웨이 93개; 이미지는 공식 호스트 `reference-only` URL만 사용 |
| 세 브랜드 전체 메뉴 조회 | OK — `/api/catalog/stores`와 페이지네이션으로 495개 로드, API 계약 테스트 11개 통과 |
| 옵션·커스텀을 고려한 DB | OK — 13개 옵션 그룹을 메뉴 상세·projection에 연결하고 모든 참조·선택 제약 검증 |
| 모바일 매장별 설정과 다중 매장 QR | OK — v2 로컬 저장, 숫자형 ID 마이그레이션, 최대 20개/매장, 세 매장 QR 저장·재로드 브라우저 확인 |
| 키오스크 매장 선택과 해당 그룹만 복원 | OK — 매장 선택, 다른 그룹 무시, 실제 이미지·제품명·가격 유형·옵션, 미확인 ID 부분 성공 확인 |
| QR 계약 보존 | OK — `store={menuId,menuId}`와 세미콜론 구분 유지, QR에는 메뉴 ID만 직렬화 |
| `/`·`/kiosk` UI 빌드 | OK — vinext 프로덕션 빌드와 서버 렌더 테스트 3개 통과 |
| 프론트 정적·회귀 검증 | OK — ESLint, 공용 계약 11개, 모바일 9개, 키오스크 12개 통과 |
| 백엔드·인프라 로컬 검증 | OK — TypeScript·백엔드 31개, YAML 구문, 8개 Lambda 번들, 카탈로그 dry-run 통과 |
| Sites 산출물 | OK — 검증 커밋 `9834fc0`과 같은 SHA의 Sites 저장 버전 6, 73개 파일 아카이브 확인 |
| 실제 AWS 개발 스택 카탈로그 API | MISS — 현재 환경에 AWS CLI·SAM CLI와 자격 증명이 없어 배포·시드·API Gateway 스모크 미실행 |
| Sites 프로덕션 공개 전환 | MISS — 기존 사이트가 공개 접근 상태이므로 별도 공개 배포 승인 없이 저장 버전만 만들고 라이브 전환하지 않음 |

### 단계별 검증 결과

- Stage 1: [`task_m010_7_stage1.md`](../working/task_m010_7_stage1.md) — 공용 카탈로그·QR 계약과 공식 출처 확정.
- Stage 2: [`task_m010_7_stage2.md`](../working/task_m010_7_stage2.md) — DynamoDB 접근 패턴과 네 개 조회 API 구현.
- Stage 3: [`task_m010_7_stage3.md`](../working/task_m010_7_stage3.md) — 495개 실메뉴 스냅샷, 수집·시드, 동일 출처 API 구현.
- Stage 4: [`task_m010_7_stage4.md`](../working/task_m010_7_stage4.md) — 모바일 전체 메뉴·매장별 설정·다중 매장 QR 구현.
- Stage 5: [`task_m010_7_stage5.md`](../working/task_m010_7_stage5.md) — 선택 매장 키오스크·실메뉴 매칭 구현.
- Stage 6: [`task_m010_7_stage6.md`](../working/task_m010_7_stage6.md) — 전체 회귀, 최소 권한 배포 보정, 운영 문서와 Sites 버전 정리.

## 잔여 위험과 후속 작업

### 잔여 위험

- 공식 사이트 DOM·API·제품 ID·이미지 URL이 바뀌면 수집기가 실패하거나 기존 QR ID 이관이 필요하다. fixture 하한과 diff 검토를 거쳐 스냅샷을 갱신해야 한다.
- 공식 이미지 URL은 재배포 권리를 뜻하지 않으며 외부 차단 시 플레이스홀더가 표시된다.
- 서브웨이 에그마요 길이별 가격 외 현재 가격은 `estimated` 표시값이다. 실제 POS·매장별 가격으로 사용하면 안 된다.
- 옵션 그룹은 커스텀 가능성을 설명하지만 QR v0.1.0은 옵션 선택값을 저장하지 않는다.
- CatalogTable 시드는 대상 테이블의 같은 키를 덮어쓴다. 자동 배포 역할에는 쓰기 권한을 주지 않았으며 운영자가 dry-run과 테이블 이름을 확인해야 한다.
- PR은 사용자 지시에 따라 `develop/backend`를 base로 한다. 해당 base에 아직 없는 Task #1·#4 프론트 커밋도 종단 흐름 의존성으로 포함된다.

### 후속 작업 후보

- AWS 개발 스택에 최신 SAM 템플릿 배포 → `CatalogTableName` 확인 → 명시적 시드 → 4개 카탈로그 API와 CORS 스모크.
- Sites Worker `PREPPED_API_BASE_URL`을 개발/프로덕션 API Gateway 출력으로 설정하고 승인된 저장 버전을 공개 배포.
- 실제 POS 가격·재고·판매 가능 여부 연동과 이미지 사용 권리 확인·자체 에셋 파이프라인.
- 옵션 선택값을 QR에 넣어야 한다면 현재 원문 계약의 새 버전 설계와 키오스크 커스텀 UI를 별도 이슈로 진행.

## 작업지시자 승인 요청

- 작업지시자가 같은 스레드에서 PR 생성까지 모든 하이퍼-워터폴 승인 게이트를 명시적으로 승인했다. 이 최종 보고서를 커밋하고 `publish/task7`을 `develop/backend` 대상으로 게시한다.
