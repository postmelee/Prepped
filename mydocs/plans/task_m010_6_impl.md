# Task M010 #6 구현계획서

수행계획서: [`task_m010_6.md`](task_m010_6.md)
GitHub Issue: [#6](https://github.com/postmelee/Prepped/issues/6)
마일스톤: M010

## 단계 개요

| Stage | 제목 | 주요 산출 | 검증 |
|---|---|---|---|
| 1 | 사용자 중심 제품 소개와 현재 MVP 경계 재작성 | `README.md`, Stage 1 보고서 | 기획서 대비 핵심 메시지·사용자 가치·비전 구분, whitespace |
| 2 | 개발·아키텍처·운영 안내 구성 | `README.md`, Stage 2 보고서 | 코드·패키지·기술 명세 정합성, 내부 링크, Mermaid 구조 |
| 3 | 문서 정합성과 GitHub 렌더링 검증 | `README.md` 최종 보정, Stage 3 보고서 | build, test, Markdown 구조, 스택 diff |
| 4 | devel 대상 PR 이력 복구 | 계획·보고서 보정, Stage 4 보고서 | devel ancestry, build, test, direct diff |

## 문서 위치 확인

| 파일 | 수행계획서상 선택 위치 | Stage 산출물 경로 | 일치 여부 | 비고 |
|---|---|---|---|---|
| `README.md` | 저장소 루트 | `README.md` | OK | 공식 제품·개발 입문 문서 전면 개편 |
| `docs/technical-specification.md` | `docs/` 유지 | 수정 없음 | OK | 상세 계약 진실 원천으로 링크만 사용 |
| `mydocs/*task_m010_6*` | `mydocs/` | `mydocs/plans`, `mydocs/working`, `mydocs/report` | OK | 승인·검증·보고 산출물 |

## Stage 1 — 사용자 중심 제품 소개와 현재 MVP 경계 재작성

### 산출물

수정:

- `README.md`

신규:

- `mydocs/working/task_m010_6_stage1.md`

### 변경 내용

- README 첫 화면을 제품명, 한 줄 소개, 핵심 원칙 순서로 재구성한다.
- 키오스크에서 메뉴 탐색·옵션 선택·대기 압박을 겪는 문제와 주문 단계를 줄이는 해결 방식을 설명한다.
- 가족의 메뉴 준비, QR 생성, 키오스크 스캔, 주문 확인으로 이어지는 사용자 여정을 구성한다.
- 시니어·가족·브랜드별 가치를 간결한 표로 정리한다.
- `/`와 `/kiosk`에서 실제로 체험 가능한 MVP 기능을 사용자 행동 기준으로 설명한다.
- 실물 카드, 원격 메뉴 변경, 다중 브랜드·POS 연동은 제품 비전이며 현재 구현이 아님을 별도 표로 구분한다.
- 기존 개발·QR·검증 정보는 Stage 2에서 재구성할 수 있도록 사실 관계를 보존한다.

### 검증

```bash
rg -n '현재 MVP|제품 비전|시니어|가족|브랜드|QR|/kiosk' README.md
git diff --check
```

수동 대조:

- 기획서의 Problem, Solution, Why QR, 사용자 가치, Vision이 README에 반영됐는지 확인
- 서버 동기화·재발급 없는 실물 카드·실제 결제가 현재 제공 기능처럼 쓰이지 않았는지 확인

### 커밋

```text
Task #6 Stage 1: 사용자 중심 제품 소개와 MVP 경계 재작성
```

## Stage 2 — 개발·아키텍처·운영 안내 구성

### 산출물

수정:

- `README.md`

신규:

- `mydocs/working/task_m010_6_stage2.md`

### 변경 내용

- `/` 모바일 PWA와 `/kiosk` 키오스크의 책임을 개발자 관점 표로 정리한다.
- 메뉴 선택 → 로컬 저장 → QR serializer → 카메라 스캔 → parser → 미래 API 경계를 Mermaid 흐름도로 표현한다.
- QR payload 예시, 세미콜론 다중 매장 문법과 `localStorage`의 기기 로컬 경계를 설명한다.
- 모바일, QR, 키오스크, 미래 백엔드의 책임과 신뢰 경계를 구분한다.
- React 19, TypeScript, vinext/Vite, `qrcode`, `jsqr`, PWA, OpenAI Sites 구성을 실제 패키지와 설정에 맞춰 정리한다.
- Node.js 요구 버전, 설치·개발 서버·build/test/lint 명령과 주요 프로젝트 구조를 제공한다.
- 개인정보·보안·현재 제한 사항과 공식 기술 명세 링크를 배치한다.

### 검증

```bash
rg -n 'localStorage|store=|/kiosk|React 19|TypeScript|vinext|Vite|jsqr|qrcode|npm run build|npm test|npm run lint' README.md package.json docs/technical-specification.md
test -f docs/technical-specification.md
test -f .openai/hosting.json
git diff --check
```

수동 대조:

- `app/page.tsx`, `app/kiosk/page.tsx`, `package.json`, `.openai/hosting.json`, `docs/technical-specification.md`와 README의 기술 주장을 대조
- README Mermaid의 노드와 화살표가 실제 책임 순서를 표현하는지 확인

### 커밋

```text
Task #6 Stage 2: 개발 및 아키텍처 안내 구성
```

## Stage 3 — 문서 정합성과 GitHub 렌더링 검증

### 산출물

수정 가능:

- `README.md` — 검증에서 발견한 제목 계층, 링크, 문구 또는 Markdown 구조만 보정

신규:

- `mydocs/working/task_m010_6_stage3.md`

### 변경 내용

- README 제목 계층, 표, fenced code block과 Mermaid block의 균형을 점검한다.
- 내부 상대 링크의 대상 파일 존재 여부를 확인한다.
- 기획서의 비전과 현재 기술 명세·코드의 구현 상태를 다시 대조한다.
- 프로덕션 build와 전체 테스트를 실행해 README에 적은 개발 명령이 유효한지 확인한다.
- `origin/publish/task4` 기준 diff가 Task #6 문서만 포함하는지 확인한다.

### 검증

```bash
npm run build
npm test
node --input-type=module -e "import fs from 'node:fs'; const s=fs.readFileSync('README.md','utf8'); const fences=(s.match(/^\`\`\`/gm)||[]).length; if(fences%2) process.exit(1); const links=[...s.matchAll(/\[[^\]]+\]\((?!https?:\/\/|#)([^)]+)\)/g)].map((m)=>m[1]); const missing=links.filter((p)=>!fs.existsSync(p)); if(missing.length){console.error(missing); process.exit(1)}; console.log({fences,links:links.length})"
git diff --check origin/publish/task4...HEAD
git status --short
```

수동 검토:

- 제목이 사용자 중심 소개에서 개발 상세로 자연스럽게 내려가는지 확인
- 표와 Mermaid label이 GitHub Markdown에서 해석 가능한 표준 문법인지 확인
- 현재 제공 기능과 제품 비전의 용어가 문서 전체에서 일관되는지 확인

### 커밋

```text
Task #6 Stage 3: README 정합성과 렌더링 검증
```

## Stage 4 — devel 대상 PR 이력 복구

### 산출물

수정:

- `mydocs/plans/task_m010_6.md`
- `mydocs/plans/task_m010_6_impl.md`
- `mydocs/report/task_m010_6_report.md`
- `mydocs/orders/20260816.md`

신규:

- `mydocs/working/task_m010_6_stage4.md`

### 변경 내용

- PR #2가 `publish/task1 -> devel`로 실제 병합됐는지 확인한다.
- 원래 Task #6 분기점 이후의 6개 커밋만 최신 `origin/devel` 위로 재배치한다.
- 잘못 병합된 PR #8과 새 복구 PR의 관계를 계획·단계·최종 보고서에 기록한다.
- 최신 `devel` 기준으로 build, test, Markdown 구조와 diff 범위를 다시 검증한다.
- `publish/task6`을 `--force-with-lease`로 복구 이력에 맞춰 갱신하고 새 `devel` 대상 Open PR을 만든다.

### 검증

```bash
git merge-base --is-ancestor origin/devel HEAD
npm run build
npm test
node --input-type=module -e "README fenced block·Mermaid·상대 링크·제목 계층 검사"
git diff --check origin/devel...HEAD
git diff --name-status origin/devel...HEAD
```

### 커밋

```text
Task #6 Stage 4: devel 대상 PR 이력 복구
```

## 통합 수용 기준

- README 첫 부분만 읽어도 대상 사용자, 문제, 해결 방식과 핵심 가치가 이해된다.
- 사용자 여정과 시니어·가족·브랜드별 가치가 명시된다.
- 현재 MVP와 제품 비전이 별도 섹션과 표로 구분된다.
- 서버 동기화, 재발급 없는 실물 카드와 실제 결제가 현재 기능으로 오해되지 않는다.
- `/`, `/kiosk`, QR 문법, `localStorage`, parser와 미래 API 경계가 코드·공식 명세와 일치한다.
- 기술 스택, Node.js 요구 버전, 실행·검증 명령이 `package.json`과 일치한다.
- 내부 링크 대상, fenced block, 제목 계층과 Mermaid 구조가 유효하다.
- `npm run build`, `npm test`, `git diff --check`가 성공한다.
- PR diff가 최신 `origin/devel` 기준 Task #6 산출물만 포함한다.

## 브랜치와 PR 전략

- 작업 브랜치: `local/task6`
- 복구 후 분기 기준: 최신 `origin/devel`
- 원격 게시 브랜치: `publish/task6`
- 새 PR base: `devel`
- 기존 PR #8은 `publish/task4`에 잘못 병합된 역사 기록으로 유지하며, 새 PR이 실제 통합 경로다.
- 메인 worktree의 `local/task4` 미커밋 변경과 로컬 전용 커밋은 Task #6에 포함하지 않는다.

## 승인 요청 사항

- 사용자의 일괄 승인과 후속 복구 지시에 따라 4단계 구성, `origin/devel` 재배치, `publish/task6 -> devel` 새 PR과 복구 후 정리를 승인된 것으로 처리한다.
