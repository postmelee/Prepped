# Task M010 #6 수행계획서

GitHub Issue: [#6](https://github.com/postmelee/Prepped/issues/6)
마일스톤: M010

## 목적

저장소의 첫 진입점인 README를 기능 목록 중심 문서에서 사용자 문제와 해결 경험이 먼저 보이는 제품 소개로 개편한다. 시니어, 가족, 브랜드가 얻는 가치를 설명하고, 기획서의 장기 비전과 현재 프런트엔드 MVP를 분리해 구현되지 않은 기능을 이미 제공하는 것처럼 오해하지 않게 한다.

개발자와 기여자가 같은 README에서 실행 방법, 사용자 표면, QR 데이터 흐름, 로컬 저장 경계, 미래 API 책임과 기술 구성을 파악할 수 있도록 개발·아키텍처 안내도 함께 정리한다.

## 배경

현재 README는 `/`, `/kiosk`, QR 계약, 실행 명령과 기술 구성을 정확히 요약하지만 제품이 해결하려는 키오스크 주문 문제와 사용자 여정이 앞부분에서 충분히 드러나지 않는다. 작업지시자가 제공한 기획서는 가족이 메뉴를 준비하고 어르신이 하나의 QR로 주문 단계를 줄이는 비전과 이해관계자별 가치를 제시한다.

다만 현재 MVP는 브라우저 `localStorage`와 QR payload에 메뉴 ID를 직접 저장한다. 계정, 서버 동기화, 원격 변경, 재발급 없는 실물 카드와 실제 POS·결제 연동은 구현되지 않았다. README는 이 차이를 `현재 MVP`와 `제품 비전`으로 명확히 구분해야 한다.

선행 이슈 #1과 #4의 리브랜딩, 기술 명세, 세 화면 탐색과 매장별 설정 결과를 기준으로 작성한다.

초기 계획은 선행 변경이 아직 `devel`에 병합되지 않았다는 이유로 `origin/publish/task4`에서 분기하고 `publish/task4` 대상 스택 PR을 사용했다. 그러나 내부 task PR은 항상 `devel`을 대상으로 해야 한다는 저장소 규칙을 위반했고, PR #8이 `publish/task4`에 잘못 병합됐다. 작업지시자의 복구 지시에 따라 PR #2를 먼저 `devel`에 병합하고, Task #6 커밋만 최신 `origin/devel` 위로 재배치해 새 `devel` 대상 PR을 만든다. 이 문단과 Stage 4는 승인된 계획 보정 기록이다.

## 범위

### 포함

- 한 줄 소개, 사용자 문제, 해결 방식과 핵심 원칙
- 가족 설정 → QR 생성 → 키오스크 스캔 → 주문 확인의 사용자 흐름
- 시니어·가족·브랜드별 가치
- 현재 MVP와 장기 제품 비전의 명시적 분리
- `/` 모바일 PWA와 `/kiosk` 키오스크 데모 안내
- QR 생성·스캔·파싱·미래 API 경계의 아키텍처 흐름
- QR payload 문법과 브라우저 로컬 저장 경계
- 기술 스택, 로컬 실행, 검증 명령, 주요 프로젝트 구조
- 개인정보·보안·현재 제한 사항
- 공식 기술 명세 연결

### 제외

- 애플리케이션 코드와 사용자 인터페이스 변경
- QR payload 문법 또는 `localStorage` 구조 변경
- 백엔드·계정·원격 동기화·실제 POS·결제 기능 구현
- `docs/technical-specification.md`의 계약 변경
- 신규 이미지·브랜드 자산 제작
- Sites 배포와 공개 접근 변경

## 설계 방향

- README의 정보 순서를 `사용자 가치 → 사용 흐름 → 현재 MVP → 개발·아키텍처 → 실행·검증 → 제한과 비전`으로 재구성한다.
- 기획서의 문장을 그대로 복제하지 않고 현재 제품명과 구현 상태에 맞춰 다시 쓴다.
- 실물 QR 카드, 가족 원격 변경, 다중 브랜드 실연동은 `제품 비전`으로 표시하고 현재 제공 기능과 섞지 않는다.
- 아키텍처는 GitHub에서 바로 읽을 수 있는 작은 Mermaid 흐름도로 표현하고, 각 책임 경계를 본문에서 설명한다.
- QR 계약은 `store={menuId,menuId}`와 세미콜론 다중 매장 문법을 유지한다.
- 상세 계약은 `docs/technical-specification.md`를 진실 원천으로 링크하고 README는 입문 수준으로 요약한다.
- 코드·패키지·공식 명세에서 확인되지 않는 기술적 주장은 추가하지 않는다.

## 문서 위치 판단

| 파일 | 분류 | 대상 독자 | 선택 위치 | 대안 위치 | 선택 이유 |
|---|---|---|---|---|---|
| `README.md` | 공식 제품·개발 입문 문서 | 사용자·기여자·외부 검토자 | 저장소 루트 | `docs/` | 저장소 방문자가 가장 먼저 읽는 제품 소개와 개발 진입점이므로 기존 루트 위치를 유지 |
| `docs/technical-specification.md` | 공식 기술 명세 | 기여자·외부 통합 담당자 | `docs/` 유지, 수정 없음 | `README.md` | 상세 계약의 진실 원천은 유지하고 README에서는 핵심만 요약·연결 |
| `mydocs/*task_m010_6*` | 작업 산출물 | 내부 작업자 | `mydocs/` | `docs/` | 승인·단계·검증 기록이므로 운영 문서 영역에 배치 |

## 예상 변경 파일

신규:

- `mydocs/plans/task_m010_6.md`
- `mydocs/plans/task_m010_6_impl.md`
- `mydocs/working/task_m010_6_stage1.md`
- `mydocs/working/task_m010_6_stage2.md`
- `mydocs/working/task_m010_6_stage3.md`
- `mydocs/report/task_m010_6_report.md`

수정:

- `README.md`
- `mydocs/orders/20260816.md`

이번 task 산출물:

- `mydocs/orders/20260816.md`
- `mydocs/plans/task_m010_6.md`
- `mydocs/plans/task_m010_6_impl.md`
- `mydocs/working/task_m010_6_stage{N}.md`
- `mydocs/report/task_m010_6_report.md`

## 잠정 단계

- **Stage 1 — 사용자 중심 제품 소개와 현재 MVP 경계 재작성**
  - 한 줄 소개, 문제, 해결 방식, 사용자 여정과 이해관계자 가치를 구성
  - 제품 비전과 현재 MVP의 차이를 명시하고 기획서 대비 과장 여부 검토
- **Stage 2 — 개발·아키텍처·운영 안내 구성**
  - 사용자 표면, Mermaid 데이터 흐름, QR·저장·API 경계, 기술 스택과 프로젝트 구조 추가
  - 실행·검증·개인정보·보안·제한 사항과 기술 명세 링크 정리
- **Stage 3 — 문서 정합성과 GitHub 렌더링 검증**
  - README의 내부 링크, 제목 계층, 표·코드 블록·Mermaid 문법을 점검
  - 코드·`package.json`·기술 명세와 주장 대조, 프로덕션 빌드와 whitespace 검증
- **Stage 4 — devel 대상 PR 이력 복구**
  - PR #2의 `devel` 병합을 확인하고 Task #6 커밋만 최신 `origin/devel`에 재배치
  - build·test·diff를 다시 검증하고 복구 문서와 새 `devel` 대상 PR 준비

## 검증 계획

### 단계별 검증

- Stage 1
  - 기획서와 README를 대조해 문제·해결·사용자 가치·제품 비전 포함 여부 확인
  - `rg -n '현재 MVP|제품 비전|시니어|가족|브랜드|QR' README.md`
  - `git diff --check`
- Stage 2
  - `rg -n 'localStorage|store=|/kiosk|React 19|TypeScript|vinext|Vite|jsqr|qrcode' README.md package.json docs/technical-specification.md`
  - README 내부 상대 링크 대상 존재 확인
  - `git diff --check`
- Stage 3
  - `npm run build`
  - `npm test`
  - README 제목 계층·fenced block·Mermaid 구조 수동 검토
  - `git diff --check origin/publish/task4...HEAD`
- Stage 4
  - `git merge-base --is-ancestor origin/devel HEAD`
  - `npm run build`
  - `npm test`
  - `git diff --check origin/devel...HEAD`
  - `git diff --name-status origin/devel...HEAD`

### 통합 검증

- README 첫 부분에서 대상 사용자, 문제, 해결 방식과 핵심 가치가 이해된다.
- 현재 MVP와 장기 제품 비전이 별도 섹션으로 구분된다.
- 서버 동기화, 재발급 없는 실물 카드, 실제 결제가 현재 구현으로 오해되지 않는다.
- `/`, `/kiosk`, QR 문법, `localStorage`, 미래 API 경계와 개발 명령이 코드·공식 명세와 일치한다.
- `README.md`의 내부 링크 대상이 존재한다.
- `npm run build`와 `npm test`가 성공한다.
- `git status --short`가 PR 준비 전 빈 출력이다.
- `git diff --check`가 경고 없이 통과한다.

## 리스크

- **비전과 구현 혼동**: 기능별로 현재 제공 여부를 명시하고 `현재 MVP`와 `제품 비전`을 분리한다.
- **기술 설명 중복**: README는 입문 요약만 두고 상세 계약은 공식 기술 명세로 연결한다.
- **PR 대상 브랜치 복구**: 잘못 생성·병합된 PR #8은 변경할 수 없으므로 Task #6 커밋만 최신 `origin/devel`에 재배치하고 새 `publish/task6 -> devel` PR로 복구한다.
- **기존 작업 간섭**: 메인 worktree의 미커밋 변경을 건드리지 않고 분리 worktree의 `local/task6`에서만 작업한다.
- **Markdown 렌더링 차이**: GitHub가 지원하는 표준 Markdown과 Mermaid 문법만 사용하고 fenced block 균형을 정적 확인한다.

## 승인 요청 사항

- 사용자 중심 우선 정보 구조와 현재 MVP·제품 비전 분리 원칙
- 루트 `README.md`를 공식 제품·개발 입문 문서로 유지하는 위치 판단
- 애플리케이션 코드와 공식 기술 명세를 변경하지 않는 범위
- 최신 `origin/devel` 기반 분기와 `devel` 대상 PR 복구 전략
- Stage 4를 포함한 4단계 구성과 단계별 검증 계획

작업지시자가 같은 스레드에서 이슈 생성부터 PR 생성까지 모든 승인 게이트를 일괄 승인했고, 잘못된 PR 대상 브랜치를 올바른 순서로 복구하도록 추가 지시했다. 따라서 Stage 4 계획 보정과 새 `devel` 대상 PR 생성을 승인된 것으로 처리한다.
