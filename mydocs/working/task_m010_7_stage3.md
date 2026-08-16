# Task #7 Stage 3 보고서 — 세 브랜드 실메뉴 시드와 동일 출처 카탈로그 API

GitHub Issue: [#7](https://github.com/postmelee/Prepped/issues/7)
구현계획서: [`task_m010_7_impl.md`](../plans/task_m010_7_impl.md)
Stage: 3

## 단계 목적

맥도날드·써브웨이·스타벅스 공식 사이트에서 확인 가능한 제품명·공식 ID·이미지 URL을 검증 가능한 스냅샷으로 정규화한다. DynamoDB에 같은 데이터 계약을 시드할 수 있게 만들고, 웹앱이 AWS 연결 여부와 무관하게 `/api/catalog` 동일 출처 경로로 메뉴를 조회하도록 한다.

## 산출물

| 파일 | 변경 요약 |
|---|---|
| `backend/scripts/collect-catalog.mjs` | 공식 호스트 허용 목록, 맥도날드 JSON·써브웨이 HTML·스타벅스 JSON 수집, fixture·급감 검증 구현 |
| `shared/catalog/data/{mcdonald,subway,starbucks}.ts` | 공식 수집 결과 91·94·311개 원본 tuple 스냅샷 |
| `shared/catalog/data/index.ts` | 3개 매장, 28개 카테고리, 13개 옵션 그룹, 495개 주문 가능 메뉴와 DynamoDB projection 생성 |
| `backend/scripts/seed-catalog.mjs` | 고유 키 dry-run, 25개 단위 BatchWrite, 제한 재시도 시드 명령 구현 |
| `shared/catalog/local-api.ts` | 매장·메뉴 목록, 상세, 선택 매장 일괄 해석의 로컬 동일 계약 구현 |
| `worker/index.ts` | `/api/catalog` 라우팅, `PREPPED_API_BASE_URL` 설정 시 AWS `/v1` 프록시, 미설정 시 로컬 스냅샷 fallback |
| `backend/tests/catalog-data.test.ts` | 건수·ID·출처 호스트·가격 유형·옵션·DynamoDB 키 무결성 검증 |
| `tests/catalog-api.test.mjs` | 동일 출처 목록·페이지·카테고리·상세·선택 매장 해석·오류 계약 검증 |
| `mydocs/tech/task_m010_7_catalog_sources.md` | 실제 공식 경로, 수집/최종 건수, 식별자·가격·이미지 정책 갱신 |

## 실제 수집·정규화 결과

| 매장 | 공식 응답 원본 | 주문 가능 메뉴 | 가격 정책 | 이미지 정책 |
|---|---:|---:|---|---|
| 맥도날드 | 91 | 91 | 공개 가격 부재로 `estimated` | 공식 원격 URL, `reference-only` |
| 써브웨이 | 94 | 93 | 에그마요 15cm/30cm만 확인값, 나머지 `estimated` | 공식 원격 URL, `reference-only` |
| 스타벅스 | 311 | 311 | 공개 가격 부재로 `estimated` | 공식 원격 URL, `reference-only` |
| 합계 | 496 | 495 | 유형·근거를 메뉴별 저장 | 바이너리 복제 없음 |

써브웨이 원본 94개 중 주문 상품은 68개다. 토핑 26개는 `subway-extra` 옵션 값으로 이동하고, 샌드위치 25개는 주문 결과가 다른 15cm/30cm 메뉴 ID로 각각 전개했다.

## 본문 변경 정도 / 본문 무손실 여부

- 최신 `origin/develop/backend`의 `aea40d8`을 병합하고 #3의 GitHub OIDC·배포 워크플로·명시적 Lambda Role·로그 그룹을 보존했다.
- `backend/template.yaml` 충돌은 #3의 배포 자원과 #7의 CatalogTable·조회 Lambda를 함께 유지해 해결했다.
- 주문 초안 도메인·DynamoDraftRepository는 변경하지 않았다.
- 공식 이미지 파일은 저장소·R2·DynamoDB에 내려받지 않았다. 데이터에는 공식 URL과 권리 미확정 상태만 기록했다.
- 실시간 크롤러는 수동 갱신 도구이고 웹 요청 경로에서는 실행되지 않는다.

## 검증 결과

실행 명령:

```bash
node backend/scripts/collect-catalog.mjs --live
(cd backend && npm run catalog:check)
(cd backend && npm run catalog:seed:dry)
(cd backend && npm run check)
npm run test:contracts
npm run lint
npm run build
git diff --check
```

결과:

- OK — 공식 사이트 실시간 수집: 맥도날드 91, 써브웨이 94, 스타벅스 311
- OK — 커밋 스냅샷: 맥도날드 91, 써브웨이 93, 스타벅스 311, 합계 495
- OK — DynamoDB dry-run: 고유 키 1,022개
- OK — 백엔드 TypeScript 및 신규·회귀 테스트 30개 통과
- OK — 루트 카탈로그·QR 계약 테스트 11개 통과
- OK — ESLint 오류·경고 없음
- OK — vinext `/`, `/kiosk`, Worker 번들 빌드 통과
- OK — `git diff --check` 경고 없음

## 잔여 위험

- 공식 메뉴 구조·상품 수·이미지 호스트는 운영사 변경에 따라 바뀔 수 있다. 급감 검사는 실패시키지만 의미 변경은 수동 검토가 필요하다.
- `reference-only` 이미지 URL은 공식 서버의 외부 표시 정책에 따라 UI에서 실패할 수 있으므로 프론트 단계에서 브랜드 플레이스홀더가 필요하다.
- 추정 가격은 실제 POS·매장·배달 가격이 아니며 UI와 키오스크에서 명시적으로 구분해야 한다.
- DynamoDB 시드는 전체 Put projection이며 삭제된 이전 버전 항목 정리는 포함하지 않는다. 운영 갱신 전 별도 교체 전략이 필요하다.

## 다음 단계 영향

- Stage 4는 `/api/catalog/stores`와 매장별 메뉴 페이지를 읽어 세 매장의 전체 메뉴·카테고리·이미지를 표시한다.
- 프론트 저장값과 QR에는 안정 `menu.id`만 보관하며, 상세 옵션 객체는 원문 QR에 넣지 않는다.
- 로컬 fallback과 AWS 프록시는 같은 응답 외피를 가지므로 프론트 코드는 배포 환경을 분기하지 않는다.

## 승인 처리

- Stage 3 산출물과 검증 결과는 작업지시자가 이 스레드에서 PR 생성까지 모든 하이퍼-워터폴 승인 게이트를 명시적으로 승인했으므로 승인된 것으로 간주하고 Stage 4로 진행한다.
