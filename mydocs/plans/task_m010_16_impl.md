# Task #16 구현계획서 — PWA 하단 고정 UI 회귀 수정 및 QR 카드 액션 정리

수행계획서: [`task_m010_16.md`](task_m010_16.md)
GitHub Issue: [#16](https://github.com/postmelee/Prepped/issues/16)
마일스톤: M010

## 단계 개요

| Stage | 제목 | 주요 산출 | 검증 |
|---|---|---|---|
| 1 | viewport 고정 레이어 회귀 수정 | `app/globals.css`, `tests/rendered-html.test.mjs` | CSS 계약 테스트, build, diff 검사 |
| 2 | QR 카드 액션 단순화 | `app/page.tsx`, `app/globals.css`, `tests/rendered-html.test.mjs` | 모바일 테스트, lint, build, diff 검사 |
| 3 | 통합 브라우저 검증과 PR 준비 | 브라우저 검증 기록, 전체 회귀 결과 | 긴 목록·세 탭·QR 카드, 전체 test/lint/build |

## 문서 위치 확인

| 파일 | 수행계획서상 선택 위치 | Stage 산출물 경로 | 일치 여부 | 비고 |
|---|---|---|---|---|
| 공식 제품 문서 | 변경 없음 | 해당 없음 | OK | QR·API·사용자 계약을 바꾸지 않는 UI 회귀 수정 |
| 작업 계획·보고서 | `mydocs/` | `mydocs/plans`, `mydocs/working`, `mydocs/report` | OK | Hyper-Waterfall 작업 이력 |

## Stage 1 — viewport 고정 레이어 회귀 수정

### 산출물

신규:

- 없음

수정:

- `app/globals.css`
- `tests/rendered-html.test.mjs`

### 변경 내용

- `.bottom-nav`를 absolute에서 fixed로 바꾸고 중앙 정렬과 최대 480px 너비를 적용한다.
- `.sheet-backdrop`을 fixed로 바꾸고 같은 PWA 셸 너비와 중앙 정렬을 적용한다.
- 모바일에서는 viewport 전체 높이와 하단 safe-area를 사용하고, 620px 이상에서는 기존 24px 셸 외곽 여백과 둥근 모서리를 유지한다.
- `.bottom-sheet`에 동적 viewport 최대 높이 fallback과 overscroll 경계를 적용해 시트 내부 스크롤이 문서로 전파되지 않게 한다.
- 렌더링 계약 테스트가 CSS 원문에서 두 고정 레이어와 PWA 셸 너비 제한을 확인하도록 보강한다.

### 검증

```bash
node --test tests/rendered-html.test.mjs
npm run build
git diff --check
```

### 커밋

```text
Task #16 Stage 1: PWA 하단 레이어를 viewport에 고정
```

## Stage 2 — QR 카드 액션 단순화

### 산출물

- `app/page.tsx`
- `app/globals.css`
- `tests/rendered-html.test.mjs`

### 변경 내용

- `내 QR` 매장 카드에서 `role="switch"` 버튼과 QR 화면 전용 setting 조회를 제거한다.
- `.store-share-button`을 grid 오른쪽 열의 두 행 중앙에 배치하고 기존 메뉴 요약 영역이 남은 폭을 사용하게 한다.
- 공유 payload 생성, 메뉴 없는 카드 disabled, 공유받은 QR의 읽기 전용 동작을 그대로 유지한다.
- `StoreSettings` 컴포넌트의 토글은 유지하고 렌더링 계약 테스트에서 QR 화면 토글 부재와 설정 화면 토글 존재를 각각 확인한다.

### 검증

```bash
node --test tests/rendered-html.test.mjs
npm run test:mobile
npm run lint
npm run build
git diff --check
```

### 커밋

```text
Task #16 Stage 2: QR 카드 공유 액션을 오른쪽에 정리
```

## Stage 3 — 통합 브라우저 검증과 PR 준비

### 산출물

- `mydocs/working/task_m010_16_stage3.md`
- 브라우저 시나리오 결과와 필요 시 발견된 결함 수정

### 변경 내용

- 로컬 프로덕션 빌드를 실행해 긴 메뉴 목록 중간에서 선택 메뉴 바텀시트를 열고 viewport 고정·backdrop·내부 스크롤을 확인한다.
- `내 QR`, `메뉴 만들기`, `내 설정`에서 페이지를 스크롤하며 하단 메뉴바 고정과 마지막 콘텐츠 비가림을 확인한다.
- `내 QR`의 메뉴 보유·미보유 카드에서 토글 부재, 공유 버튼 우측 정렬, 활성·비활성 상태를 확인한다.
- `/kiosk`의 렌더링과 기존 QR 파싱 계약을 전체 테스트로 회귀 확인한다.
- 공개 Sites 배포는 수행하지 않고 로컬 검증과 PR 증거만 정리한다.

### 검증

```bash
npm test
npm run lint
npm run build
git diff --check origin/devel...HEAD
git status --short
```

### 커밋

```text
Task #16 Stage 3: 하단 고정 UI 통합 검증 완료
```

## 검증

- 각 Stage 검증 명령은 단계 보고서 작성 전에 실행한다.
- 실패한 검증은 단계 완료로 처리하지 않는다.
- 브라우저 검증은 로컬 `/`과 `/kiosk`를 사용하며 공개 Sites 배포는 변경하지 않는다.
- PR 직전 최신 `origin/devel`과의 차이와 merge 가능성을 다시 확인한다.

## 커밋

- 단계 커밋은 단계 산출물과 `mydocs/working/task_m010_16_stage{N}.md`를 함께 묶는다.
- 커밋 메시지는 `Task #16 Stage {N}: {핵심 내용 요약}` 형식을 따른다.

## 단계 의존성

- Stage 2는 Stage 1의 viewport 고정 레이어와 데스크톱 셸 경계가 확정된 뒤 진행한다.
- Stage 3은 Stage 2의 QR 카드 액션과 자동 검증이 완료된 뒤 진행한다.

## 위험과 대응

- **fixed 요소의 데스크톱 위치 이탈**: 메뉴바와 backdrop에 동일한 중앙 정렬·최대 너비 규칙을 적용하고 breakpoint에서 상하 24px inset을 검증한다.
- **시트 animation과 중앙 transform 충돌**: 중앙 transform은 backdrop에만, 등장 animation transform은 bottom sheet에만 둔다.
- **스크롤 체인과 safe-area**: `overscroll-behavior`와 기존 safe-area padding을 유지해 문서 이동 및 홈 인디케이터 가림을 줄인다.
- **QR 저장 계약 회귀**: QR 화면 markup만 단순화하고 설정 모델과 `StoreSettings`를 유지하며 `test:mobile`로 직렬화를 확인한다.

## 승인 요청 사항

- 작업지시자는 같은 스레드에서 Stage 분할, 구현, 단계 검증, 최종 보고와 `devel` 대상 Open PR 생성까지 계속 진행하도록 명시적으로 승인했다.
- 승인에 따라 각 Stage의 보고서와 커밋을 남긴 뒤 별도 대기 없이 다음 단계로 진행한다.
