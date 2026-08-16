# Task #7 Stage 4 보고서 — 모바일 전체 메뉴와 다중 매장 QR

GitHub Issue: [#7](https://github.com/postmelee/Prepped/issues/7)
구현계획서: [`task_m010_7_impl.md`](../plans/task_m010_7_impl.md)
Stage: 4

## 단계 목적

모바일 `/`의 정적 맥도날드 10개 메뉴를 동일 출처 카탈로그 API 기반 세 매장 495개 메뉴로 교체한다. 매장별 설정을 기기 로컬에 저장하고, 활성 매장의 안정 메뉴 ID를 기존 QR 계약에 맞춰 하나의 문자열로 직렬화한다.

## 산출물

| 파일 | 변경 요약 |
|---|---|
| `app/lib/catalog/client.ts` | 매장 목록과 200개 단위 전체 페이지 로딩, 선택 매장 메뉴 상세 일괄 해석 클라이언트 |
| `app/lib/catalog/storage.ts` | `prepped-menu-settings-v2` 매장별 설정, `onemeal-menu-v1` 숫자 ID 무손실 마이그레이션, 안전 ID·20개 한도 |
| `app/components/menu-catalog.tsx` | 세 매장 선택, 28개 카테고리, 실제 이미지·대체 표시, 변형·가격 유형 메뉴 카드, 로딩·오류·빈 상태 |
| `app/components/store-settings.tsx` | 매장별 저장 메뉴·예상 합계·QR 포함 토글·편집 카드 |
| `app/page.tsx` | 전체 모바일 흐름, 선택 상세 옵션, 다중 매장 QR, 편집 초안 보호, 새 저장 구조 연결 |
| `app/globals.css` | 세 브랜드 표시, 원격 이미지, 카탈로그 상태, 가격·옵션 안내, 다중 매장 화면 스타일 |
| `tests/mobile-menu-flow.test.mjs` | 저장 마이그레이션·매장 격리·495개 API 로딩·옵션 상세·다중 매장 QR 검증 |
| `tests/rendered-html.test.mjs` | 새 기본 QR과 모듈 분리·가격·이미지·초안 보호 계약 갱신 |
| `backend/scripts/collect-catalog.mjs`, `shared/catalog/data/subway.ts` | 써브웨이 이미지 속성 HTML entity 복호화 보정 |

## 화면 흐름

1. 내 QR에서 현재 활성 매장과 저장 메뉴를 확인한다.
2. 매장 추가 또는 메뉴 만들기에서 맥도날드·써브웨이·스타벅스를 고른다.
3. 해당 매장의 카테고리와 실제 메뉴를 보고 변형·공식/예상 가격을 확인한다.
4. 선택 목록에서 API가 반환한 커스텀 가능 그룹을 확인한다. 원문 QR에는 옵션 객체를 넣지 않고 기본 옵션과 메뉴 ID만 저장한다.
5. 저장 시 매장별 로컬 설정이 갱신되고 활성 매장은 `mcdonald={...};subway={...};starbucks={...}` 순서로 하나의 QR에 포함된다.

## 로컬 저장 마이그레이션

- 기존 `{ savedIds: number[], storeEnabled: boolean }`는 맥도날드 설정으로 읽는다.
- 대응이 확인된 과거 ID는 현재 카탈로그 ID로 변환한다. 예: `101 → mcdonald-178`, `201 → mcdonald-720`.
- 현재 공식 카탈로그에서 대응할 수 없는 과거 `301`, `303`은 삭제하지 않고 이전 설정 표시로 보존한다.
- 새 저장 키는 계정·서버 동기화가 아닌 브라우저 기기 로컬 `prepped-menu-settings-v2`다.

## 검증 결과

실행 명령:

```bash
npm run test:mobile
npm run test:contracts
npm test
npm run lint
(cd backend && npm run catalog:check)
(cd backend && npm run check)
git diff --check
```

결과:

- OK — 모바일 저장·API·QR 9개 테스트 통과
- OK — 공용 카탈로그·QR 계약 11개 테스트 통과
- OK — 서버 렌더링 3개 테스트와 vinext `/`, `/kiosk` 빌드 통과
- OK — 백엔드 TypeScript·회귀 테스트 30개 통과
- OK — ESLint 오류·경고 없음
- OK — `git diff --check` 경고 없음

브라우저 확인:

- OK — 세 매장 선택과 맥도날드 91·써브웨이 93·스타벅스 311개 메뉴 로딩
- OK — 써브웨이 샌드위치 50개 변형, 에그마요 6,200원 `official`, 나머지 `estimated` 표시
- OK — 공식 써브웨이 이미지 실제 표시 및 대체 표시 코드 확인
- OK — 써브웨이 `빵·치즈·야채·소스·추가 토핑`, 스타벅스 `사이즈·샷·우유·시럽·휘핑` 표시
- OK — 세 매장 저장 후 `mcdonald={...};subway={...};starbucks={...}` QR 생성
- OK — 새로고침 뒤 세 매장 5개 메뉴와 QR 문자열 유지
- OK — 편집 중 다른 탭 이동 시 저장/폐기 대화상자, 폐기 후 기존 QR 유지
- OK — 내 설정의 세 매장 카드·QR 토글·합계 표시와 브라우저 콘솔 오류 없음

## 본문 변경 정도 / 본문 무손실 여부

- `/`와 `/kiosk` 경로 역할은 변경하지 않았다.
- QR payload 형식과 매장 결정 순서는 공용 `serializeQrPayload`만 사용한다.
- 옵션 선택 값을 QR에 추가하지 않아 확정 계약을 보존했다. UI는 기본 옵션 저장과 키오스크 변경 가능성을 명시한다.
- 사용자 설정은 브라우저 로컬에만 저장하며 서버 동기화처럼 표시하지 않는다.

## 잔여 위험

- 원격 공식 이미지 서버가 외부 표시를 차단하면 브랜드 대체 표시가 나온다.
- 현재 공식 카탈로그와 대응하지 않는 두 과거 숫자 ID는 보존되지만, 신규 API 해석에서는 unknown이 된다.
- 495개 요약 데이터를 클라이언트가 처음 한 번 모두 가져온다. 현재 스냅샷 규모에서는 허용되나 증가하면 가상 스크롤·검색·카테고리 지연 로딩을 검토한다.

## 다음 단계 영향

- Stage 5 키오스크는 같은 QR parser와 `POST /api/catalog/resolve`를 사용해 선택한 매장 그룹만 복원한다.
- 모바일에서 확인한 옵션 그룹을 키오스크 결과에도 표시해 사용자가 실제 주문 전에 조정 가능성을 알 수 있게 한다.

## 승인 처리

- Stage 4 산출물과 검증 결과는 작업지시자가 이 스레드에서 PR 생성까지 모든 승인 게이트를 명시적으로 승인했으므로 승인된 것으로 간주하고 Stage 5로 진행한다.
