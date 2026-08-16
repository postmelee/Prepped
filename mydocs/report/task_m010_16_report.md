# Task #16 최종 보고서 — PWA 하단 고정 UI와 QR 공유 피드백 정리

GitHub Issue: [#16](https://github.com/postmelee/Prepped/issues/16)
마일스톤: M010

## 작업 요약

- 대상 이슈: #16
- 마일스톤: M010
- 단계 수: 4
- 작업 목적: 긴 카탈로그에서도 바텀시트와 PWA 하단 메뉴바를 현재 viewport에 고정하고, `내 QR` 카드에는 공유 버튼만 오른쪽에 남기며 복사 결과를 즉시 안내한다.

## 변경 파일 목록과 영향 범위

| 경로 | 변경 요약 | 영향 범위 |
|---|---|---|
| `app/globals.css` | 하단 메뉴바·sheet backdrop fixed 중앙 정렬, 480px 셸 경계, 바텀시트 내부 스크롤, QR 공유 버튼 우측 grid 배치, 공유 성공 모션과 reduced-motion 대체 | 모바일 PWA 공통 탐색, 선택 메뉴 overlay, QR 카드와 피드백 |
| `app/page.tsx` | `내 QR` 매장 카드 토글 제거, 공유 버튼별 transient 상태와 ARIA live 성공·실패 안내 | QR 정보 카드와 전체·매장별 공유 흐름 |
| `tests/rendered-html.test.mjs` | fixed 레이어·QR 액션·공유 성공 문구·접근성·타이머·모션 계약 추가 | 렌더링 및 소스 계약 회귀 검사 |
| `mydocs/plans/task_m010_16.md` | 목적·범위·설계·검증 기준 | 수행 승인 근거 |
| `mydocs/plans/task_m010_16_impl.md` | 네 Stage 산출물·검증·커밋 경계 | 구현 추적 |
| `mydocs/feedback/task_m010_16_feedback.md` | PR #18 공유 피드백과 수용 기준 | Stage 4 요구사항 추적 |
| `mydocs/working/task_m010_16_stage1.md` | viewport fixed 레이어 결과 | Stage 1 검증 기록 |
| `mydocs/working/task_m010_16_stage2.md` | QR 카드 액션 결과 | Stage 2 검증 기록 |
| `mydocs/working/task_m010_16_stage3.md` | 브라우저 측정·전체 회귀 결과 | Stage 3 검증 기록 |
| `mydocs/working/task_m010_16_stage4.md` | 공유 성공 모달·버튼 모션·접근성 결과 | Stage 4 검증 기록 |
| `mydocs/orders/20260816.md` | Task #16 완료 상태와 시각 기록 | 오늘할일 보드 |

## 문서 위치 검증

제품·사용자·API·아키텍처 계약은 변경하지 않았고 공식 `README.md`와 `docs/`를 수정하지 않았다. 이번 산출물은 모두 계획대로 `mydocs/` 작업 이력 위치에만 추가했다.

| 파일 | 계획된 위치 | 실제 위치 | 결과 | 근거 |
|---|---|---|---|---|
| 수행·구현 계획서 | `mydocs/plans/` | `mydocs/plans/` | OK | `task_m010_16.md`, `task_m010_16_impl.md` |
| 단계 보고서 | `mydocs/working/` | `mydocs/working/` | OK | Stage 1~4 보고서 |
| 최종 보고서 | `mydocs/report/` | `mydocs/report/` | OK | 본 문서 |

## 변경 전·후 정량 비교

| 지표 | 변경 전 | 변경 후 |
|---|---|---|
| 하단 메뉴바 위치 기준 | `.phone-app` 문서 하단의 `absolute` | viewport 하단의 `fixed` |
| 선택 메뉴 backdrop 위치 기준 | 긴 문서 전체의 `absolute` | viewport 전체의 `fixed` |
| 고정 UI desktop 폭 | 부모 문서 너비에 종속 | 중앙 정렬된 최대 480px |
| `내 QR` 카드 switch | 메뉴가 저장된 로컬 QR에서 매장별 1개 | 0개 |
| 메뉴 없는 공유 QR 카드 | 토글·비활성 공유 버튼 동시 노출 | 오른쪽 비활성 공유 버튼만 노출 |
| 공유 성공 피드백 | 문서 흐름에 종속된 기존 toast | viewport 중앙 fixed 안내, 정확한 성공 문구, 2.3초 자동 종료 |
| 공유 버튼 피드백 | 별도 애니메이션 없음 | 클릭한 버튼만 약 420ms 피드백, reduced-motion 대체 |
| 자동 테스트 | 기존 전체 suite | 28/28 통과, fixed·grid·공유 상태 계약 추가 |
| 제품 코드·테스트 diff | 기준 | 246줄 추가, 42줄 삭제 |
| 공개 Sites 배포 | version 7 | version 8, `/`·`/kiosk`·카탈로그 API 200 |

## 검증 결과

| 수용 기준 | 결과 |
|---|---|
| 긴 목록 어느 위치에서도 바텀시트가 현재 화면 하단에 표시 | OK — `scrollY=6,000`, 문서 높이 7,376px에서 시트 bottom 900px |
| backdrop이 viewport 전체를 덮고 시트 내부만 스크롤 | OK — backdrop top 0/bottom 900, sheet `overflow-y: auto` |
| PWA 하단 메뉴바가 스크롤과 무관하게 고정 | OK — QR·메뉴·설정 화면에서 fixed 및 viewport bottom 유지 |
| 마지막 콘텐츠가 메뉴바에 가리지 않음 | OK — 기존 `.screen` 하단 safe-area padding 유지, 긴 목록에서 selected bar와 nav 분리 확인 |
| desktop 중앙 PWA 셸 경계 유지 | OK — 1280×720에서 left 400/right 880/width 480/bottom 696 |
| QR 카드 토글 제거와 공유 버튼 우측 정렬 | OK — 세 카드 switch 0개, 공유 버튼 right gap 15px |
| 메뉴 없는 카드 공유 비활성 유지 | OK — 단일 매장 공유 QR에서 나머지 두 매장 disabled |
| QR payload·설정 화면·키오스크 회귀 없음 | OK — 모바일 QR 계약 포함 전체 테스트 28/28 통과 |
| 공유 성공 문구와 자동 종료 | OK — 정확한 `공유 링크가 복사되었습니다.`, role=status, aria-atomic=true, 약 2.3초 뒤 제거 |
| 클릭 버튼 일시 피드백 | OK — 클릭한 버튼에만 class 적용, 약 420ms 안에 해제, 연속 클릭 시 타이머 재시작 |
| viewport 중앙 표시와 모션 접근성 | OK — 480×900에서 중심 x=240/y=450, reduced-motion에서 spatial animation 제거 |
| 정적 분석과 빌드 | OK — ESLint 및 vinext `/`, `/kiosk` 빌드 통과 |
| 공개 배포 응답 | OK — Sites version 8 배포 성공, 공개 `/`, `/kiosk`, `/api/catalog/stores` 모두 HTTP 200 |

### 단계별 검증 결과

- Stage 1: [`task_m010_16_stage1.md`](../working/task_m010_16_stage1.md) — 두 fixed 레이어와 내부 스크롤 계약, 렌더링 테스트 3/3, 빌드 통과
- Stage 2: [`task_m010_16_stage2.md`](../working/task_m010_16_stage2.md) — QR 카드 토글 제거·공유 우측 배치, 모바일 테스트 9/9, lint·build 통과
- Stage 3: [`task_m010_16_stage3.md`](../working/task_m010_16_stage3.md) — 모바일·데스크톱 실제 브라우저 측정, 전체 테스트 28/28, lint·build·diff 검사 통과
- Stage 4: [`task_m010_16_stage4.md`](../working/task_m010_16_stage4.md) — 공유 성공 안내·버튼 피드백·연속 클릭·접근성 검증, 렌더링 3/3·모바일 9/9·lint·build 통과

## 잔여 위험과 후속 작업

### 잔여 위험

- `vinext start` 로컬 실행은 기존 route runtime의 undefined `env` 때문에 Catalog API가 500을 반환했다. 빌드·서버 렌더링 테스트는 통과했고 `vinext dev`에서는 내장 Catalog API가 200으로 동작해 브라우저 검증을 완료했다. Task #16 변경과 직접 관련 없는 로컬 런타임 경계다.
- iOS 실제 기기의 동적 주소창과 홈 인디케이터 체감은 검증하지 못했으며 기존 `svh` fallback과 safe-area inset을 보존했다.
- 브라우저 자동화 세션에서는 OS 클립보드 문자열을 다시 읽는 권한이 없어 복사 결과를 역검증하지 못했다. 기존 단위 테스트가 Clipboard API 우선 경로와 fallback을 모두 검증하며 공유 URL 계약은 변경하지 않았다.

### 후속 작업 후보

- 필요하면 `vinext start`에서 Worker env 없이 내장 Catalog API를 실행하는 로컬 프로덕션 런타임 호환성을 별도 이슈로 분리한다.
- iOS 실제 PWA에서 주소창 확장·축소, safe-area와 공유 성공 안내 체감을 최종 확인한다.

## 작업지시자 승인 요청

- 작업지시자는 같은 스레드에서 최종 보고와 `devel` 대상 Open PR 생성까지 명시적으로 승인했다.
- 모든 수용 기준·통합 검증·Sites version 8 배포가 통과했으므로 `publish/task16`과 기존 PR #18을 최신화한다.
