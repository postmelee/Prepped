# Task #7 Stage 1 보고서 — 카탈로그 계약·출처·공용 모델

GitHub Issue: [#7](https://github.com/postmelee/Prepped/issues/7)
구현계획서: [`task_m010_7_impl.md`](../plans/task_m010_7_impl.md)
Stage: 1

## 단계 목적

Issue #3의 AWS 주문 백엔드 기반과 Issue #4의 매장별 설정 화면을 한 브랜치에서 보존한 뒤, 세 브랜드 실메뉴가 공통으로 따를 타입·런타임 검증·안정 ID 정책과 다중 매장 QR 파서/serializer 계약을 확정한다. 실제 데이터·API 구현 전에 공식 출처, 가격 유형, 이미지 사용 경계, DynamoDB 접근 패턴을 코드와 공식 문서에서 일치시킨다.

## 산출물

| 파일 | 변경 요약 |
|---|---|
| `backend/**`, `docs/aws-deployment.md` | `origin/develop/backend`의 Issue #3 Stage 1~2 산출물을 병합해 주문 초안 백엔드 기반을 보존 |
| `shared/catalog/types.ts` | 매장·카테고리·메뉴·변형·가격·출처·옵션 그룹의 공용 타입 정의 |
| `shared/catalog/schema.ts` | QR-safe ID, 참조 무결성, 가격·출처·옵션의 런타임 검증과 오류 수집 구현 |
| `shared/qr/payload.ts` | 결정적 다중 매장 직렬화, 호환 파싱, 매장 선택, 중복 제거, 길이·개수 제한 구현 |
| `tests/catalog-contract.test.mjs` | 정상 카탈로그와 중복·교차 매장·가격·옵션 오류 계약 검증 |
| `tests/qr-payload.test.mjs` | 다중 매장 순서, 선택 매장 추출, 레거시 숫자 ID, 유해 토큰, 개수 제한 검증 |
| `mydocs/tech/task_m010_7_catalog_sources.md` | 세 공식 사이트의 수집 필드, 가격·ID 차이, 이미지 권리, 안전 수집 조건 기록 |
| `docs/technical-specification.md` | 세 매장 API 메뉴, 안정 ID, 로컬 저장 v2, 선택 매장 키오스크, 원문 QR 계약으로 갱신 |
| `docs/api-specification.md` | 카탈로그 도메인과 매장·목록·상세·일괄 해석 API 계약 추가 |
| `docs/backend-architecture.md` | CatalogTable projection, 원문 QR 종단 흐름, #3 주문 기능과의 경계 추가 |
| `mydocs/orders/20260816.md` | #1·#3·#4·#7을 모두 보존하도록 add/add 병합 충돌 해결 |
| `app/page.tsx`, `backend/src/domain/drafts.ts` | 선행 동작을 유지하며 기존 린트 오류에 근거 주석/명시적 미사용 처리 추가 |
| `package.json`, `tsconfig.json` | 공용 계약 테스트 명령과 TypeScript 확장자 import 설정 추가 |

## 본문 변경 정도 / 본문 무손실 여부

- `origin/develop/backend`는 비커밋 병합했고 충돌은 `mydocs/orders/20260816.md` 한 파일뿐이었다. 오늘할일 표에 양쪽 이슈를 모두 남겨 #3 산출물과 #4/#7 상태를 무손실 보존했다.
- #3의 주문 초안 도메인·핸들러·DynamoDB 저장소·SAM 자원은 린트용 `void _expiresAt` 한 줄 이외에 재작성하지 않았다.
- #4의 편집 초안 보호와 안전 기본 포커스는 그대로 두고, 해당 `autoFocus`의 의도를 설명하는 린트 예외만 추가했다.
- 공식 문서는 기존 주문 초안 설명을 삭제하지 않고 카탈로그가 현재 기본 원문 QR 흐름이며 토큰 QR은 별도 선택 기능이라는 우선순위를 명확히 했다.

## 검증 결과

실행 명령:

```bash
node --test tests/catalog-contract.test.mjs tests/qr-payload.test.mjs
npm run lint
git diff --check
```

결과:

- OK — 공용 카탈로그·QR 계약 7개 테스트 전부 통과
- OK — ESLint 오류·경고 없음
- OK — `git diff --check` 경고 없음
- 참고 — 전용 worktree는 기존 저장소의 설치된 프론트 의존성을 심볼릭 링크로 재사용했으며, 링크는 Git 추적 대상이 아니다.

## 잔여 위험

- 실제 메뉴 스냅샷이 아직 없으므로 브랜드별 최소 항목 수와 공식 페이지 구조 변화는 Stage 3에서 검증해야 한다.
- 원문 QR은 옵션 객체를 담지 않는다. v0.1.0은 핵심 변형을 별도 메뉴 ID로 만들고 추가 커스텀 가능 범위만 카탈로그로 보여준다.
- 공식 이미지 URL은 수집 가능하지만 재배포 권한이 확인되지 않았다. `reference-only` 기본값과 플레이스홀더를 후속 단계에서 지켜야 한다.
- #3 브랜치의 AWS 실배포 Stage는 아직 선행 작업 소유 범위이며 이번 병합이 완료를 의미하지 않는다.

## 다음 단계 영향

- Stage 2는 `shared/catalog` 계약을 DynamoDB 읽기 projection과 네 개 HTTP 경로로 구현한다.
- 카탈로그 서비스는 #3 주문 초안의 기존 `Catalog` 포트를 대체하지 않고, 이후 명시적 어댑터로 연결할 수 있게 경계를 유지한다.
- 일괄 해석은 최대 20개, 요청 순서 유지, 다른 매장·없는 ID를 `unknownMenuIds`로 반환하는 부분 성공 규칙을 따라야 한다.

## 승인 요청

- Stage 1 산출물과 검증 결과는 작업지시자가 이 스레드에서 PR 생성까지 일괄 승인했으므로 승인된 것으로 간주하고 Stage 2로 진행한다.
