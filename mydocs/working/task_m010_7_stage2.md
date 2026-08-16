# Task #7 Stage 2 보고서 — DynamoDB 카탈로그와 조회 API

GitHub Issue: [#7](https://github.com/postmelee/Prepped/issues/7)
구현계획서: [`task_m010_7_impl.md`](../plans/task_m010_7_impl.md)
Stage: 2

## 단계 목적

Stage 1에서 확정한 카탈로그·QR 계약을 Issue #3의 AWS Lambda/API Gateway/DynamoDB 기반 위에 구현한다. 모바일 전체 메뉴와 키오스크 선택 매장 복원이 같은 진실 원천을 사용하도록 매장 목록, 매장별 메뉴 목록, 메뉴 상세, 메뉴 ID 일괄 해석 경로를 제공한다.

## 산출물

| 파일 | 변경 요약 |
|---|---|
| `backend/src/catalog/domain.ts` | 카탈로그 오류 코드, manifest, 매장/목록/해석 응답 도메인 정의 |
| `backend/src/catalog/repository.ts` | 카탈로그 저장소 포트와 결정적 InMemory 테스트 구현 |
| `backend/src/catalog/dynamo-catalog.ts` | Store/Category/Menu projection의 Get·BatchGet·Query, 불투명 cursor 구현 |
| `backend/src/catalog/service.ts` | 매장·카테고리·limit·ID 검증, 목록 요약, 상세, 선택 매장 부분 성공 해석 구현 |
| `backend/src/http/handlers.ts` | 네 카탈로그 HTTP 핸들러, CORS, validation/not-found 오류 응답 추가 |
| `backend/src/handlers/{list-stores,list-menus,get-menu,resolve-menus}.ts` | Lambda 진입점 추가 |
| `backend/src/runtime.ts`, `backend/src/runtime-config.ts` | `CATALOG_TABLE_NAME`과 DynamoCatalogRepository/CatalogService 런타임 연결 |
| `backend/template.yaml` | CatalogTable, 최소 읽기 IAM, 네 API Gateway 경로, 출력 추가 |
| `backend/tests/catalog-test-data.ts` | 세 매장 최소 fixture와 확장 옵션 projection 제공 |
| `backend/tests/catalog-domain.test.ts` | 정렬·요약·상세·부분 성공·오류 도메인 검증 |
| `backend/tests/catalog-dynamo.test.ts` | 키·prefix·cursor·BatchGet 접근 패턴 검증 |
| `backend/tests/catalog-http.test.ts` | 네 HTTP 계약·CORS·오류 응답 검증 |
| `backend/tests/catalog-template.test.ts` | SAM 자원·경로·읽기 전용 IAM 회귀 검증 |
| `backend/tests/config.test.ts`, `backend/tests/runtime.test.ts` | 카탈로그 테이블 환경 변수와 런타임 연결 회귀 검증 |
| `shared/catalog/types.ts` | 확장된 옵션 그룹을 포함하는 `CatalogMenuDetail` 응답 타입 추가 |

## 본문 변경 정도 / 본문 무손실 여부

- Issue #3의 주문 초안 서비스와 DynamoDraftRepository는 변경하지 않았다.
- 기존 `createHttpHandlers`에 선택적 CatalogService 세 번째 인자를 추가해 #3 단위 테스트의 기존 두 인자 호출을 보존했다.
- `docs/api-specification.md`와 `docs/backend-architecture.md`의 Stage 1 계약에 맞춰 구현했으므로 Stage 2에서 계약 본문 재작성은 필요하지 않았다.
- CatalogTable은 주문 TTL·쓰기 권한과 분리했다. Lambda 정책에는 `GetItem`, `BatchGetItem`, `Query`만 허용하고 카탈로그 쓰기는 런타임 API에 주지 않았다.

## 검증 결과

실행 명령:

```bash
(cd backend && npm test)
(cd backend && npm run build)
(cd backend && npm run check)
git diff --check
```

결과:

- OK — `npm test`: 신규 카탈로그 및 기존 주문 초안 포함 25개 테스트 통과
- OK — `npm run build`: TypeScript `noEmit` 검사 통과
- OK — `npm run check`: build 후 25개 테스트 재통과
- OK — `git diff --check` 경고 없음
- OK — 루트 ESLint 오류·경고 없음

## 잔여 위험

- CatalogTable은 아직 실메뉴 시드가 없으므로 배포 직후에는 manifest 누락 오류가 발생한다. Stage 3 시드가 API 사용의 선행 조건이다.
- BatchGet 응답의 `UnprocessedKeys` 재시도는 최대 20개 MVP 읽기에서는 아직 구현하지 않았다. 실제 스로틀링이 관찰되면 제한 재시도를 추가해야 한다.
- 카탈로그 쓰기 권한은 조회 Lambda에 없으며, Stage 3 수동 시드 실행 주체의 별도 IAM 권한이 필요하다.

## 다음 단계 영향

- Stage 3 시드기는 `STORE#.../META`, `STORE#.../CATEGORY#...`, 목록 projection, `MENU#.../META`, `CATALOG/VERSION`을 동일 버전으로 생성해야 한다.
- 웹앱 동일 출처 API는 AWS 설정 시 이 네 경로를 그대로 프록시하고 로컬 fallback도 동일 응답 외피를 반환해야 한다.
- 목록 응답은 `optionGroups`를 제외하고 상세·일괄 해석 응답은 이를 포함해야 한다.

## 승인 요청

- Stage 2 산출물과 검증 결과는 작업지시자가 이 스레드에서 PR 생성까지 일괄 승인했으므로 승인된 것으로 간주하고 Stage 3으로 진행한다.
