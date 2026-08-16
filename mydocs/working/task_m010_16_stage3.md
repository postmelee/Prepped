# Task #16 Stage 3 완료 보고서 — 하단 고정 UI 통합 검증

GitHub Issue: [#16](https://github.com/postmelee/Prepped/issues/16)
구현계획서: [`task_m010_16_impl.md`](../plans/task_m010_16_impl.md)
Stage: 3

## 단계 목적

Task #16의 viewport 고정 레이어와 QR 카드 액션을 실제 긴 메뉴 목록과 모바일·데스크톱 viewport에서 검증한다. 전체 테스트·lint·build와 `origin/devel` 기준 diff 무결성을 확인해 최종 보고와 PR 준비 상태로 전환한다.

## 산출물

| 파일 | 변경 요약 |
|---|---|
| `mydocs/working/task_m010_16_stage3.md` | 모바일·데스크톱 브라우저 측정값, QR 카드 상태와 전체 자동 검증 결과 기록 |

## 본문 변경 정도 / 본문 무손실 여부

Stage 3은 검증 단계로 제품 코드와 공식 문서를 추가 변경하지 않았다. Stage 1·2의 CSS와 QR 카드 markup을 대상으로 브라우저와 전체 회귀 검증만 수행했다.

## 검증 결과

실행 명령:

```bash
npm test
npm run lint
npm run build
git diff --check origin/devel...HEAD
git status --short
```

결과:

- OK — 전체 카탈로그·모바일·QR·키오스크·렌더링 테스트 28/28 통과
- OK — ESLint 경고·오류 없음
- OK — vinext 프로덕션 빌드 완료, `/`와 `/kiosk` route 생성 확인
- OK — `git diff --check origin/devel...HEAD` 경고 없음
- OK — 보고서 작성 전 `git status --short` 빈 출력

브라우저 시나리오:

- OK — 480×900 viewport의 써브웨이 샌드위치 50개 목록에서 문서 높이 7,376px, `scrollY=6,000` 상태를 만들었다. 하단 메뉴바는 `position: fixed`, bottom 900px을 유지했다.
- OK — 같은 스크롤 위치에서 선택 메뉴를 열었을 때 backdrop은 fixed, top 0px, bottom 900px, width 480px으로 현재 viewport를 덮었다.
- OK — 바텀시트는 top 470px, bottom 900px, `overflow-y: auto`, 계산된 최대 높이 `min(792px, 100%)`로 화면 하단에 표시됐다.
- OK — `내 QR`의 세 매장 카드 모두 `role="switch"` 0개였고 공유 버튼은 카드 오른쪽에서 15px 안쪽에 정렬됐다.
- OK — 맥도날드 한 매장만 포함한 공유 QR에서는 맥도날드 공유 버튼만 활성, 써브웨이·스타벅스 공유 버튼은 비활성 상태였다.
- OK — `내 설정`에서 `scrollY=262.5` 상태에도 하단 메뉴바가 fixed, bottom 900px을 유지했다.
- OK — 1280×720 desktop viewport에서 하단 메뉴바는 left 400px, right 880px, width 480px, bottom 696px으로 중앙 PWA 셸과 24px 하단 inset을 유지했다.
- OK — 검증 탭의 error·warning 콘솔 로그 없음.

## 잔여 위험

- `vinext start`로 로컬 프로덕션 서버를 직접 실행하면 기존 route runtime에서 `env`가 undefined여서 `/api/catalog/stores`가 500이 되는 현상이 확인됐다. 프로덕션 빌드와 렌더링 테스트는 통과하며 Task #16 변경과 무관하므로, UI 브라우저 검증은 API가 200을 반환하는 `vinext dev`에서 수행했다.
- iOS 실제 기기의 주소창 축소·확장과 홈 인디케이터 체감은 시뮬레이션 범위 밖이며, CSS는 기존 safe-area inset과 `svh` fallback을 보존한다.

## 다음 단계 영향

- 모든 Stage가 완료돼 `task-final-report`로 최종 결과와 PR 본문 근거를 정리할 수 있다.
- 공개 Sites 배포는 Issue #16 범위에서 제외했으므로 PR merge 이후 별도 배포 시 실제 기기 확인을 이어갈 수 있다.

## 승인 요청

- 작업지시자는 PR 생성까지 단계 연속 진행을 승인했다. Stage 3 산출물과 검증 결과를 승인한 것으로 기록하고 최종 보고 및 Open PR 생성으로 진행한다.
