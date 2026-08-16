# Task #16 Stage 2 완료 보고서 — QR 카드 액션 단순화

GitHub Issue: [#16](https://github.com/postmelee/Prepped/issues/16)
구현계획서: [`task_m010_16_impl.md`](../plans/task_m010_16_impl.md)
Stage: 2

## 단계 목적

`내 QR`의 매장 카드에서 QR 포함 토글을 제거하고 공유 버튼만 오른쪽에 남긴다. 공유 payload와 메뉴 없는 카드의 disabled 동작, `내 설정`의 매장 활성화 기능은 기존 상태로 보존한다.

## 산출물

| 파일 | 변경 요약 |
|---|---|
| `app/page.tsx` | QR 매장 카드의 `role="switch"` 버튼과 불필요해진 QR 화면 setting 조회 제거 |
| `app/globals.css` | 매장 카드 공유 버튼을 grid 세 번째 열 오른쪽에 정렬하고 토글 전용 grid 규칙 제거 |
| `tests/rendered-html.test.mjs` | QR 화면 토글 부재, 설정 화면 상태 버튼 유지, 공유 버튼 우측 배치 계약 검사 |

## 본문 변경 정도 / 본문 무손실 여부

코드 작업으로 문서 본문 변경은 해당 없다. 매장별 공유 URL 생성과 복사 동작, `settings.stores[].enabled` 저장 모델, `StoreSettings`의 상태 버튼과 QR 직렬화는 수정하지 않았다.

## 검증 결과

실행 명령:

```bash
node --test tests/rendered-html.test.mjs
npm run test:mobile
npm run lint
npm run build
git diff --check
```

결과:

- OK — 렌더링·PWA·QR 계약 테스트 3/3 통과
- OK — 모바일 메뉴 저장·마이그레이션·다중 매장 QR 테스트 9/9 통과
- OK — ESLint 경고·오류 없음
- OK — vinext 프로덕션 빌드 완료, `/`와 `/kiosk` route 생성 확인
- OK — `git diff --check` 경고 없음
- 첫 계약 테스트에서 `내 설정` 버튼을 `role="switch"`로 잘못 가정한 테스트 1건이 실패했다. 실제 구현의 `status-button`과 `onToggle` 계약을 검사하도록 수정한 뒤 전체 명령을 재실행해 통과했다.

## 잔여 위험

- CSS source 계약은 배치를 보장하지만 실제 viewport 스크롤 체감은 Stage 3 브라우저 검증이 필요하다.
- 공유받은 QR과 메뉴 없는 카드의 시각 상태는 Stage 3에서 함께 확인한다.

## 다음 단계 영향

- Stage 3은 소스 변경 없이 우선 로컬 프로덕션 서버에서 긴 목록·세 탭·QR 카드 시나리오를 검증한다.
- 브라우저에서 fixed 위치 또는 grid 회귀가 발견되면 Stage 3 범위의 결함 수정 후 전체 검증을 다시 실행한다.

## 승인 요청

- 작업지시자는 PR 생성까지 단계 연속 진행을 승인했다. Stage 2 산출물과 검증 결과를 승인한 것으로 기록하고 Stage 3로 진행한다.
