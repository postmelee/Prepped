# Task M010 #4 구현계획서

수행계획서: [`task_m010_4.md`](task_m010_4.md)
GitHub Issue: [#4](https://github.com/postmelee/Prepped/issues/4)
마일스톤: M010

## 단계 개요

| Stage | 제목 | 주요 산출 | 검증 |
|---|---|---|---|
| 1 | 매장별 설정 화면과 탐색 구현 | `app/page.tsx`, `app/globals.css` | 빌드, QR·저장 계약 정적 확인 |
| 2 | 문서·자동 테스트·사용자 시나리오 검증 | `README.md`, `docs/technical-specification.md`, `tests/rendered-html.test.mjs` | test/build, 모바일·키오스크 브라우저 시나리오 |
| 3 | 프로덕션 배포와 통합 검증 | Sites version 3, 배포·검증 기록 | 배포 성공, 프로덕션 두 경로 확인 |

## 문서 위치 확인

| 파일 | 수행계획서상 선택 위치 | Stage 산출물 경로 | 일치 여부 | 비고 |
|---|---|---|---|---|
| `docs/technical-specification.md` | `docs/` | `docs/technical-specification.md` | OK | 공식 상태·화면 계약 갱신 |
| `README.md` | 저장소 루트 | `README.md` | OK | 제품 진입점 기능 목록 갱신 |
| `mydocs/*task_m010_4*` | `mydocs/` | `mydocs/plans`, `mydocs/working`, `mydocs/report` | OK | 작업 승인·보고 산출물 |

## Stage 1 — 매장별 설정 화면과 탐색 구현

### 산출물

신규:

- `mydocs/working/task_m010_4_stage1.md`

수정:

- `app/page.tsx`
- `app/globals.css`

### 변경 내용

- 모바일 탭 타입에 `settings`를 추가하고 하단 탐색을 3열로 확장한다.
- 현재 탭에 `aria-current="page"`를 적용하고 CSS 아이콘의 시각 상태를 동기화한다.
- 저장 ID를 전체 mock 메뉴에서 조회해 설정 화면용 메뉴 목록과 합계를 파생한다.
- `내 설정 메뉴` 화면에 맥도날드와 서브웨이 매장 카드를 배치한다.
- 맥도날드 카드에는 저장 메뉴, 개수, 총액, QR 포함 여부와 `메뉴 바꾸기`를 제공한다.
- 서브웨이는 실제 메뉴가 없으므로 `설정 없음`·`준비 중` 상태와 비활성 행동을 표시한다.
- `메뉴 바꾸기`가 기존 매장 선택부터 시작하도록 create 상태를 초기화한다.
- 기존 저장 키와 QR serializer를 수정하지 않는다.

### 검증

```bash
npm run build
rg -n 'onemeal-menu-v1|mcdonald=|내 설정 메뉴|aria-current' app/page.tsx
git diff --check
```

### 커밋

```text
Task #4 Stage 1: 매장별 내 설정 화면과 하단 탐색 구현
```

## Stage 2 — 문서·자동 테스트·사용자 시나리오 검증

### 산출물

- `README.md`
- `docs/technical-specification.md`
- `tests/rendered-html.test.mjs`
- `mydocs/working/task_m010_4_stage2.md`

### 변경 내용

- README 모바일 화면 설명을 세 화면 구조로 갱신한다.
- 기술 명세의 하단 탐색, 매장별 설정 조회, 파생 데이터와 편집 흐름을 명문화한다.
- 모바일 SSR에 세 번째 탐색 레이블과 설정 화면 소스 계약을 추가한다.
- PWA·QR·키오스크 기존 회귀 검사를 유지한다.
- 로컬 브라우저에서 설정 화면, 메뉴 수정·저장·QR 갱신과 키오스크 샘플 흐름을 확인한다.
- 작은 모바일 viewport에서 카드와 하단 탐색의 가독성·터치 영역을 확인한다.

### 검증

```bash
npm test
npm run build
git diff --check
```

브라우저 시나리오:

1. `내 설정`에서 맥도날드 기본 3개 메뉴와 합계, QR 포함 상태 확인
2. 서브웨이 `설정 없음`·`준비 중` 확인
3. `메뉴 바꾸기` → 맥도날드 → 버거 → 메뉴 추가 → 선택 목록 → 저장
4. `내 설정`에서 갱신 목록 확인 후 `내 QR`에서 payload 갱신 확인
5. `/kiosk` 샘플 QR의 원문·메뉴 ID·결제 데모 회귀 확인

### 커밋

```text
Task #4 Stage 2: 설정 화면 계약과 사용자 흐름 검증
```

## Stage 3 — 프로덕션 배포와 통합 검증

### 산출물

- 기존 Sites 프로젝트의 version 3 배포
- `mydocs/working/task_m010_4_stage3.md`

### 변경 내용

- Stage 2에서 검증한 정확한 소스를 기존 `Prepped` Sites 프로젝트에 게시한다.
- owner-only private 접근 정책과 기존 URL을 유지한다.
- 프로덕션 `/`에서 세 하단 탭, 설정 카드, 편집 진입과 QR 표시를 확인한다.
- 프로덕션 `/kiosk`의 샘플 인식 흐름을 회귀 확인한다.

### 검증

```bash
npm run build
git diff --check publish/task1...HEAD
```

- Sites deployment status: `succeeded`
- 프로덕션 `/`, `/kiosk` 브라우저 확인

### 커밋

```text
Task #4 Stage 3: 내 설정 메뉴 프로덕션 배포와 통합 검증
```

## 검증

- 각 Stage 검증 명령은 단계 보고서 작성 전에 실행한다.
- 실패한 검증은 단계 완료로 처리하지 않는다.
- 계획 변경이 필요하면 구현계획서를 먼저 갱신하고 일괄 승인 범위 안에서 변경 이유를 기록한다.
- 문서 위치가 수행계획서 판단과 달라지면 구현 전에 수행계획서를 갱신한다.

## 커밋

- 단계 커밋은 단계 산출물과 `mydocs/working/task_m010_4_stage{N}.md`를 함께 묶는다.
- 커밋 메시지는 `Task #4 Stage {N}: {핵심 내용 요약}` 형식을 따른다.

## 단계 의존성

- Stage 2는 Stage 1의 산출물 확정 후 진행한다.
- Stage 3은 Stage 2의 검증과 보고서 승인 후 진행한다.
- 최종 PR은 선행 PR #2가 열려 있는 동안 `publish/task1`을 base로 사용한다.

## 위험과 대응

- **스택 PR 기준 변경**: PR #2 병합 전에는 `publish/task1`을 base로 열고, 병합 후 `devel`로 전환한다.
- **저장 데이터 회귀**: 화면은 기존 ID 배열에서 파생하고 저장 schema·key를 변경하지 않는다.
- **매장 확장 오해**: 서브웨이 카드는 향후 확장 표면이지만 선택 가능하다고 보이지 않게 준비 중 상태를 고정한다.
- **내비게이션 혼잡**: 3열 균등 배치, 짧은 레이블, 64px 이상의 높이로 시니어 사용자의 터치 정확도를 유지한다.

## 승인 요청 사항

- 사용자의 이슈 등록부터 PR 생성까지 일괄 승인에 따라 Stage 분할, 산출물, 검증 명령, 커밋 메시지와 스택 PR 전략을 승인된 것으로 처리하고 Stage 1을 시작한다.
