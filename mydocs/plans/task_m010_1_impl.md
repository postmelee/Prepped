# Task M010 #1 구현계획서

수행계획서: [`task_m010_1.md`](task_m010_1.md)
GitHub Issue: [#1](https://github.com/postmelee/Prepped/issues/1)
마일스톤: M010

## 단계 개요

| Stage | 제목 | 주요 산출 | 검증 |
|---|---|---|---|
| 1 | 제품 정체성과 공식 기술 명세 정리 | `app/`, `public/manifest.webmanifest`, `package*.json`, `README.md`, `docs/technical-specification.md` | 기존 명칭·스타터 표식 제거, QR 계약·경로·로컬 상태 일치, `git diff --check` |
| 2 | 브랜드 자산과 사용자 시나리오 검증 | `public/og.png`, `public/icon-192.png`, `public/icon-512.png` | 이미지 시각 검수, `npm run build`, 로컬 `/`·`/kiosk` 시나리오 |
| 3 | 프로덕션 배포와 통합 검증 | Sites 배포, 배포 검증 기록 | 배포 성공, 프로덕션 `/`·`/kiosk`, 최종 검색·빌드·diff 검증 |

## 문서 위치 확인

수행계획서에서 공식 제품 문서 루트를 `docs/`로 선택했다. 실제 공식 기술 명세와 README 경로가 이 판단과 일치하며, Hyper-Waterfall 작업 기록은 `mydocs/`에 분리한다.

| 파일 | 수행계획서상 선택 위치 | Stage 산출물 경로 | 일치 여부 | 비고 |
|---|---|---|---|---|
| `docs/technical-specification.md` | `docs/` | `docs/technical-specification.md` | OK | 제품·기술 계약의 공식 진실 원천 |
| `README.md` | 저장소 루트 | `README.md` | OK | 프로젝트 입문과 공식 명세 링크 |

## Stage 1 — 제품 정체성과 공식 기술 명세 정리

### 산출물

신규:

- `docs/technical-specification.md`

수정:

- `app/page.tsx`
- `app/kiosk/page.tsx`
- `app/kiosk/layout.tsx`
- `app/layout.tsx`
- `public/manifest.webmanifest`
- `package.json`
- `package-lock.json`
- `README.md`

### 변경 내용

- 사용자 화면, 접근성 레이블, 웹 metadata와 PWA manifest를 `Prepped`로 통일한다.
- 패키지 이름을 `prepped`로 변경하되 의존성·빌드 구조는 유지한다.
- README를 실제 제품 목적, 실행 방법, 두 경로, QR 문법, 로컬 저장, 기술 문서 링크 중심으로 교체한다.
- 공식 기술 명세에 3-depth 메뉴 구조, McDonald mock, 선택·저장 상태, QR 직렬화·파싱, 스캔 흐름, 미래 API 경계, 개인정보·보안, 배포를 기록한다.

### 검증

```bash
rg -n "한끼패스|vinext-starter|site-creator-vinext-starter" app public README.md package.json package-lock.json docs
rg -n 'store=\{|/kiosk|localStorage|백엔드' README.md docs/technical-specification.md
git diff --check
```

### 커밋

```text
Task #1 Stage 1: Prepped 제품명과 기술 명세 정리
```

## Stage 2 — 브랜드 자산과 사용자 시나리오 검증

### 산출물

- `public/og.png`
- `public/icon-192.png`
- `public/icon-512.png`
- `tests/rendered-html.test.mjs`
- 모바일·키오스크 로컬 브라우저 검증 결과

### 변경 내용

- 기존 제품명이 포함된 소셜 미리보기를 `Prepped` 브랜드 이미지로 교체한다.
- 앱 아이콘을 모바일 홈 화면에서 식별 가능한 `Prepped` 자산으로 갱신한다.
- 모바일에서 메뉴 선택·저장·QR 갱신을 확인하고 키오스크에서 카메라 시작과 샘플 QR 대체 흐름을 확인한다.
- 폐기된 스타터 스켈레톤 검증을 Prepped 두 경로, PWA manifest와 QR 계약 검증으로 교체한다.

### 검증

```bash
npm run build
npm test
file public/og.png public/icon-192.png public/icon-512.png
git diff --check
```

수동/브라우저 확인:

- `/`에서 큰 터치 영역, 매장→카테고리→메뉴, 선택 목록, 저장 후 QR 생성 확인
- `/kiosk`에서 카메라 권한 요청, 샘플 QR, 인식 문자열과 결제 버튼 상태 확인
- manifest의 아이콘 경로와 이미지 크기 확인

### 커밋

```text
Task #1 Stage 2: Prepped 브랜드 자산과 사용자 흐름 검증
```

## Stage 3 — 프로덕션 배포와 통합 검증

### 산출물

- 기존 Sites 프로젝트의 새 프로덕션 배포
- `mydocs/working/task_m010_1_stage3.md`의 배포 URL·검증 기록

### 변경 내용

- `.openai/hosting.json`이 가리키는 기존 프로젝트를 빌드·배포한다.
- 프로덕션 `/`와 `/kiosk`에서 `Prepped` 표시, PWA metadata, 핵심 사용자 흐름을 확인한다.
- 전체 정적 검색, 빌드, diff와 브랜치 상태를 최종 검증한다.

### 검증

```bash
npm run build
rg -n "한끼패스|vinext-starter|site-creator-vinext-starter" app public README.md package.json package-lock.json docs
git diff --check
```

원격 확인:

- Sites 배포 상태가 성공이다.
- 프로덕션 `/`와 `/kiosk`가 정상 응답하고 사용자-facing 제품명이 `Prepped`다.

### 커밋

```text
Task #1 Stage 3: 프로덕션 배포와 통합 검증
```

## 검증

- 각 Stage 검증 명령은 단계 보고서 작성 전에 실행한다.
- 실패한 검증은 같은 Stage 안에서 수정하고 재검증한다.
- QR payload 문법, localStorage 키와 경로 구조는 변경하지 않는다.
- 공식 문서는 `docs/`, 작업 과정 문서는 `mydocs/` 경계를 유지한다.

## 커밋

- 단계 커밋은 단계 산출물과 `mydocs/working/task_m010_1_stage{N}.md`를 함께 묶는다.
- 커밋 메시지는 구현계획서에 고정한 형식을 사용한다.

## 단계 의존성

- Stage 2는 Stage 1의 제품명·기술 계약 확정 후 진행한다.
- Stage 3은 Stage 2의 빌드와 브라우저 검증 완료 후 진행한다.

## 위험과 대응

- **로컬 데이터 회귀**: 저장 키와 payload serializer는 수정하지 않고 명칭 문자열만 변경한다.
- **래스터 자산 불일치**: 생성 후 실제 파일을 열어 텍스트와 여백을 시각 검수한다.
- **카메라 자동화 한계**: 실제 카메라 권한 흐름은 브라우저 UI 상태까지 확인하고, 재현 가능한 이미지 업로드 흐름을 함께 검증한다.
- **배포 플랫폼 차이**: 로컬 빌드 성공 후 기존 프로젝트 설정으로 배포하며 프로덕션 경로를 별도 확인한다.

## 승인 요청 사항

- 작업지시자가 모든 Hyper-Waterfall 승인 게이트를 명시적으로 일괄 승인했다.
- 위 3개 Stage 분할, 산출물, 검증 명령과 커밋 메시지를 승인된 것으로 적용한다.
