# Task #9 구현계획서 — 매장별·전체 메뉴 QR 공유 링크 추가

수행계획서: [`task_m010_9.md`](task_m010_9.md)
GitHub Issue: [#9](https://github.com/postmelee/Prepped/issues/9)
마일스톤: M010

## 단계 개요

| Stage | 제목 | 주요 산출 | 검증 |
|---|---|---|---|
| 1 | 공유 URL 계약과 모바일 QR UI | `app/lib/qr-share.ts`, `app/page.tsx`, `app/globals.css`, `tests/qr-share.test.mjs` | 공유 URL 단위 테스트, 빌드, diff 검사 |
| 2 | 공식 문서와 회귀 테스트 | `README.md`, `docs/technical-specification.md`, `tests/rendered-html.test.mjs` | 전체 테스트, 빌드, 계약 검색 |
| 3 | 브라우저 시나리오와 통합 검증 | 브라우저 검증 기록, 전체 회귀 결과 | 매장별·전체 공유, 저장 보존, 키오스크, 최종 diff |

## 문서 위치 확인

| 파일 | 수행계획서상 선택 위치 | Stage 산출물 경로 | 일치 여부 | 비고 |
|---|---|---|---|---|
| `README.md` | 저장소 루트 | `README.md` | OK | 대표 사용 흐름과 로컬 실행 안내 갱신 |
| `docs/technical-specification.md` | `docs/` | `docs/technical-specification.md` | OK | 공유 URL·검증·비영속 상태 공식 계약 |
| 작업 계획·보고서 | `mydocs/` | `mydocs/plans`, `mydocs/working`, `mydocs/report` | OK | Hyper-Waterfall 작업 이력 |

## Stage 1 — 공유 URL 계약과 모바일 QR UI

### 산출물

신규:

- `app/lib/qr-share.ts`
- `tests/qr-share.test.mjs`

수정:

- `app/page.tsx`
- `app/globals.css`

### 변경 내용

- QR payload 그룹 parser·validator, store 추출, `?qr=` URL 생성 함수를 독립 모듈로 추가한다.
- store key는 영문·숫자·underscore·hyphen, menu ID는 동일 안전 문자 집합으로 제한하고 공백·빈 ID·중복 store·1,500자 초과를 거부한다.
- 초기 mount에서 `qr` query를 한 번 읽어 유효하면 `sharedPayload`로 표시하고, 무효하면 로컬 QR을 유지한 채 오류 상태를 안내한다.
- 로컬 저장 effect는 기존 `savedIds`만 사용해 공유 query와 분리한다. 기존 `storeEnabled`는 저장 호환용으로 읽되 QR 표시·설정 상태에서는 더 이상 제외 동작을 제공하지 않는다.
- QR 카드에 `전체 링크 복사`, 매장 행에 `공유` 버튼을 추가하고 기존 토글을 제거한다.
- 복사는 Clipboard API를 우선하고 실패·미지원 시 숨은 textarea와 `document.execCommand("copy")`를 사용한다.
- 공유받은 QR에는 읽기 전용 상태와 `내 QR로 돌아가기` 행동을 제공해 query를 제거하고 로컬 QR로 복귀시킨다.

### 검증

```bash
node --test tests/qr-share.test.mjs
npm run build
git diff --check
```

### 커밋

```text
Task #9 Stage 1: 매장별·전체 QR 공유 링크 구현
```

## Stage 2 — 공식 문서와 회귀 테스트

### 산출물

- `README.md`
- `docs/technical-specification.md`
- `tests/rendered-html.test.mjs`

### 변경 내용

- 모바일 기능 목록과 사용자 흐름에 매장별·전체 링크 복사와 공유받은 QR 보기를 추가한다.
- 공유 URL query, payload 검증, 길이 제한, 로컬 저장 비영속 정책, Clipboard fallback을 공식 기술 계약으로 기록한다.
- 렌더링 소스 계약에 공유 버튼·query parser·비영속 경계·기존 편집 보호와 키오스크 parser 보존 검사를 추가한다.
- `storeEnabled` 토글 표식을 요구하던 기존 테스트를 새 공유 행동에 맞게 갱신한다.

### 검증

```bash
npm test
npm run build
rg -n '전체 링크 복사|매장별 공유|\?qr=|localStorage|Clipboard' README.md docs/technical-specification.md app/page.tsx
git diff --check
```

### 커밋

```text
Task #9 Stage 2: 공유 계약 문서와 회귀 테스트 보강
```

## Stage 3 — 브라우저 시나리오와 통합 검증

### 산출물

- `mydocs/working/task_m010_9_stage3.md`
- 브라우저 시나리오 결과와 필요 시 발견된 결함 수정

### 변경 내용

- 480px 모바일 화면에서 전체·매장 공유 버튼의 레이블, 터치 영역, 상태 안내를 확인한다.
- Clipboard 결과를 확인해 store query가 정확히 인코딩되고, 공유 링크를 열었을 때 QR 접근성 원문이 링크 payload로 바뀌는지 검증한다.
- 공유 링크 전후 기존 저장 메뉴가 유지되고 `내 QR로 돌아가기`가 query와 읽기 전용 상태만 제거하는지 확인한다.
- 유효하지 않은 query 안내와 `/kiosk` 샘플 QR·결제 흐름을 회귀 검증한다.
- 공개 Sites 배포는 수행하지 않고 로컬·빌드 결과만 PR 증거로 정리한다.

### 검증

```bash
npm test
npm run build
git diff --check origin/publish/task1...HEAD
git status --short
```

### 커밋

```text
Task #9 Stage 3: 공유 시나리오와 통합 검증 완료
```

## 검증

- 각 Stage 검증 명령은 단계 보고서 작성 전에 실행한다.
- 실패한 검증은 단계 완료로 처리하지 않는다.
- 브라우저는 로컬 `/`과 `/kiosk`만 사용하며 공개 URL은 변경하지 않는다.
- 적층 base 차이는 `origin/publish/task1...HEAD`로 검사한다.

## 커밋

- 단계 커밋은 단계 산출물과 `mydocs/working/task_m010_9_stage{N}.md`를 함께 묶는다.
- 커밋 메시지는 `Task #9 Stage {N}: {핵심 내용 요약}` 형식을 따른다.

## 단계 의존성

- Stage 2는 Stage 1의 공유 URL과 UI 계약 확정 후 진행한다.
- Stage 3은 Stage 2의 문서·자동 검증 완료 후 진행한다.
- Issue #7은 이 모듈의 public 함수와 `?qr=` 계약을 재사용하거나 동등한 adapter를 유지한다.

## 위험과 대응

- **React hydration 차이**: query와 storage는 mount effect에서만 읽고 SSR은 기본 로컬 payload를 유지한다.
- **Clipboard 실패**: API 거부도 fallback으로 이어지게 하고 최종 실패만 사용자에게 알린다.
- **공유 query 오염**: parser 허용 문자·그룹·길이 검증과 query 제거 행동을 제공한다.
- **#7 충돌**: 공유 유틸을 UI에서 분리하고 기존 QR 문법 이외의 저장 모델을 추가하지 않는다.
- **적층 PR**: 최종 PR base를 `publish/task1`으로 명시하고 PR #2 이후 재기준화 조건을 적는다.

## 승인 요청 사항

- 작업지시자는 이 구현 단계, 산출물, 검증 명령, 커밋 형식과 공개 배포 제외를 포함해 PR 생성까지 일괄 승인했다.
- 승인에 따라 Stage별 보고를 작성·커밋한 뒤 다음 단계로 연속 진행한다.
