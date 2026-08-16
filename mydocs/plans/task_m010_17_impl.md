# Task M010 #17 구현계획서

수행계획서: [`task_m010_17.md`](task_m010_17.md)
GitHub Issue: [#17](https://github.com/postmelee/Prepped/issues/17)
마일스톤: M010

## 단계 개요

| Stage | 제목 | 주요 산출 | 검증 |
|---|---|---|---|
| 1 | 빠른 체험 링크와 환경 안내 | `README.md`, `mydocs/working/task_m010_17_stage1.md` | 공개 URL 200, 상단 링크·환경 발견성, whitespace |
| 2 | 심사 시나리오와 대체 경로 | `README.md`, `mydocs/working/task_m010_17_stage2.md` | 현재 UI·QR 계약 대조, 핵심 문구, 과장 방지 |
| 3 | 통합 검증과 제출 준비 | `mydocs/working/task_m010_17_stage3.md` | 링크·Markdown 구조, 전체 테스트, devel diff |

## 문서 위치 확인

| 파일 | 수행계획서상 선택 위치 | Stage 산출물 경로 | 일치 여부 | 비고 |
|---|---|---|---|---|
| `README.md` | 저장소 루트 `README.md` | `README.md` | OK | 해커톤 제출물 첫 화면의 공식 사용자·기여자 진입 문서 |
| Task #17 계획·단계·최종 보고 | `mydocs/` 역할별 폴더 | `mydocs/plans/`, `mydocs/working/`, `mydocs/report/` | OK | 승인·검증 추적용 작업 산출물 |

## Stage 1 — 빠른 체험 링크와 환경 안내

### 산출물

신규:

- `mydocs/working/task_m010_17_stage1.md`

수정:

- `README.md`

### 변경 내용

- H1과 핵심 문구 다음에 `심사위원 빠른 체험` 섹션을 추가한다.
- 모바일 PWA와 키오스크 공개 URL을 역할·권장 기기와 함께 표시한다.
- 권장 조합은 스마트폰의 모바일 PWA와 카메라가 있는 노트북 Chrome의 키오스크로 안내한다.
- 예상 소요 시간을 3~5분으로 명시한다.
- 공개 링크가 현재 응답하는지 확인하고 기존 제품 소개 문단은 그대로 보존한다.

### 검증

```bash
curl -sSIL --max-time 20 https://hankkipass-menu-qr.meleeisdeveloping.chatgpt.site/
curl -sSIL --max-time 20 https://hankkipass-menu-qr.meleeisdeveloping.chatgpt.site/kiosk
rg -n '심사위원 빠른 체험|모바일 PWA|키오스크 데모|3~5분|스마트폰|노트북' README.md
sed -n '1,100p' README.md
git diff --check
```

### 커밋

```text
Task #17 Stage 1: 심사위원 빠른 체험 링크와 환경 안내 추가
```

## Stage 2 — 심사 시나리오와 대체 경로

### 산출물

신규:

- `mydocs/working/task_m010_17_stage2.md`

수정:

- `README.md`

### 변경 내용

- 카메라 기반 핵심 시나리오를 `메뉴 준비 → QR 표시 → 키오스크 매장 선택 → 스캔 → 복원 결과 확인` 순서로 작성한다.
- 각 단계에 심사위원이 확인할 예상 결과를 짧게 붙인다.
- 카메라가 없으면 `/kiosk`의 샘플 QR 또는 수동 입력을 사용하도록 대체 절차를 작성한다.
- HTTPS·카메라 권한 조건과 실제 POS·결제·실시간 가격·재고가 데모 경계라는 점을 명시한다.
- 현재 화면·QR 문법·공유 상태와 불일치하거나 구현을 과장하는 문구가 없는지 코드와 기술 명세에 대조한다.

### 검증

```bash
rg -n '메뉴 준비|QR|매장 선택|스캔|예상 결과|카메라가 없다면|샘플 QR|수동 입력|POS|결제' README.md
rg -n '샘플 QR|수동|매장 선택|결제' app/kiosk/page.tsx
rg -n '메뉴 만들기|내 한끼 QR 복사|공유' app/page.tsx app/lib/qr-share.ts
rg -n 'store=\{menuId,menuId\}|세미콜론|카메라' docs/technical-specification.md
git diff --check
```

### 커밋

```text
Task #17 Stage 2: 심사 시나리오와 카메라 대체 경로 추가
```

## Stage 3 — 통합 검증과 제출 준비

### 산출물

신규:

- `mydocs/working/task_m010_17_stage3.md`

수정:

- 해당 없음. 검증에서 발견한 문서 결함이 있을 때만 승인 범위 안에서 `README.md`를 보정한다.

### 변경 내용

- README 내부 상대 링크 대상, 제목 계층, fenced block과 Mermaid 블록을 정적으로 확인한다.
- 공개 모바일·키오스크 링크를 다시 확인한다.
- 의존성을 lockfile 기준으로 설치하고 전체 자동 테스트를 실행한다.
- `origin/devel` 기준 diff가 README와 Task #17 작업 문서에만 한정되는지 확인한다.

### 검증

```bash
npm ci
npm test
node --input-type=module -e "README Markdown 구조와 내부 상대 링크 대상 확인"
curl -sSIL --max-time 20 https://hankkipass-menu-qr.meleeisdeveloping.chatgpt.site/
curl -sSIL --max-time 20 https://hankkipass-menu-qr.meleeisdeveloping.chatgpt.site/kiosk
git diff --name-status origin/devel...HEAD
git diff --check origin/devel...HEAD
git status --short
```

### 커밋

```text
Task #17 Stage 3: README 링크와 제출 시나리오 통합 검증
```

## 검증

- 각 Stage 검증 명령은 단계 보고서 작성 전에 실행한다.
- 실패한 검증은 단계 완료로 처리하지 않는다.
- Stage 3의 Node 검사는 README의 H1·H2, fenced block 짝, Mermaid 개수와 로컬 상대 링크 대상 존재 여부를 출력한다.
- HTTP 응답은 최종 status line이 200인지 확인한다.
- `npm test`의 전체 통과 개수를 단계·최종 보고서와 PR 본문에 기록한다.
- 계획 변경이 필요하면 구현계획서를 먼저 갱신하고 작업지시자 승인을 받는다.

## 커밋

- 단계 커밋은 단계 산출물과 `mydocs/working/task_m010_17_stage{N}.md`를 함께 묶는다.
- 커밋 메시지는 `Task #17 Stage {N}: {핵심 내용 요약}` 형식을 따른다.

## 단계 의존성

- Stage 2는 Stage 1의 상단 위치와 공개 링크 역할이 확정된 뒤 진행한다.
- Stage 3은 Stage 2의 심사 시나리오와 데모 경계가 현재 구현에 일치한 뒤 진행한다.
- 사용자가 PR 생성까지 별도 승인 없이 진행하도록 승인했으므로 각 단계 검증 통과와 보고서 커밋을 승인으로 간주하고 연속 진행한다.

## 위험과 대응

- **공개 링크 응답 변화**: Stage 1과 Stage 3에서 각각 확인하고 실패 시 PR 게시를 중단한다.
- **상단 정보 과다**: 링크·환경·핵심 시나리오·대체 경로만 상단에 두며 기술 상세는 기존 섹션에 맡긴다.
- **현재 앱과 문구 불일치**: Stage 2에서 실제 버튼명과 기술 명세를 대조한다.
- **문서 task의 불필요한 코드 변경**: `origin/devel...HEAD` 파일 목록으로 애플리케이션·계약 변경이 없는지 검증한다.

## 승인 요청 사항

- Stage 1~3 분할, 산출물, 검증 명령과 커밋 메시지
- 공개 링크, 권장 환경, 카메라·비카메라 시나리오와 데모 경계 문구
- 작업지시자가 PR 생성까지 별도 승인 없이 진행하도록 명시 승인했으므로 구현계획서 승인 후 모든 단계와 최종 보고·PR 게시까지 연속 진행

