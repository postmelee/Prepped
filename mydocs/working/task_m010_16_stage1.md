# Task #16 Stage 1 완료 보고서 — viewport 고정 레이어 회귀 수정

GitHub Issue: [#16](https://github.com/postmelee/Prepped/issues/16)
구현계획서: [`task_m010_16_impl.md`](../plans/task_m010_16_impl.md)
Stage: 1

## 단계 목적

긴 메뉴 목록의 문서 높이에 종속되던 PWA 하단 메뉴바와 선택 메뉴 backdrop을 viewport 기준 고정 레이어로 전환한다. 모바일과 데스크톱 모두 고정 UI를 최대 480px PWA 셸 안에 유지하고 바텀시트 내부 스크롤 경계를 보강한다.

## 산출물

| 파일 | 변경 요약 |
|---|---|
| `app/globals.css` | 하단 메뉴바·sheet backdrop fixed 중앙 정렬, 데스크톱 24px inset, 바텀시트 동적 viewport 높이·overscroll 적용 |
| `tests/rendered-html.test.mjs` | CSS 원문을 읽어 두 fixed 레이어, 480px 경계와 바텀시트 내부 스크롤 계약을 검사 |

## 본문 변경 정도 / 본문 무손실 여부

코드 작업으로 문서 본문 변경은 해당 없다. QR payload, 카탈로그, 저장 상태와 컴포넌트 markup은 변경하지 않았으며 CSS 배치와 해당 계약 테스트만 수정했다.

## 검증 결과

실행 명령:

```bash
node --test tests/rendered-html.test.mjs
npm run build
git diff --check
```

결과:

- OK — 렌더링·PWA·QR 계약 테스트 3/3 통과
- OK — vinext 프로덕션 빌드 완료, `/`와 `/kiosk` route 생성 확인
- OK — `git diff --check` 경고 없음

## 잔여 위험

- 실제 브라우저의 긴 문서 스크롤 위치와 iOS safe-area 체감은 Stage 3에서 수동 검증한다.
- QR 매장 카드 grid는 아직 기존 토글 열을 유지하므로 Stage 2에서 액션 배치를 정리한다.

## 다음 단계 영향

- Stage 2는 fixed 레이어의 중앙 정렬 transform을 변경하지 않고 QR 카드 내부 grid와 markup만 수정한다.
- 공유 버튼은 기존 세 번째 grid 열을 사용하되 토글 제거 이후 두 행 중앙에 배치한다.

## 승인 요청

- 작업지시자는 PR 생성까지 단계 연속 진행을 승인했다. Stage 1 산출물과 검증 결과를 승인한 것으로 기록하고 Stage 2로 진행한다.
