# Task M010 #1 수행계획서

GitHub Issue: [#1](https://github.com/postmelee/Prepped/issues/1)
마일스톤: M010

## 목적

모바일 QR 생성 PWA와 키오스크 데모의 제품명을 `Prepped`로 통일하고, 현재까지 결정된 제품·기술 계약을 저장소의 공식 문서로 고정한다. 두 사용자 경로를 다시 빌드·검증하고 기존 Sites 프로젝트에 배포해 휴대폰과 노트북에서 연동 가능한 상태를 유지한다.

## 배경

저장소와 프로젝트 명칭은 `Prepped`로 결정됐지만 사용자 화면, PWA manifest, 검색·공유 메타데이터, 패키지 정보와 이미지 일부는 기존 명칭 또는 스타터 값을 사용한다. 또한 QR 문자열, 로컬 저장 범위, 모바일·키오스크 경로, 향후 API 경계가 코드와 대화 맥락에 분산되어 있어 후속 백엔드 구현의 기준 문서가 필요하다.

## 범위

### 포함

- 모바일·키오스크 UI, 접근성 레이블, 페이지 메타데이터, PWA manifest의 제품명을 `Prepped`로 통일
- 패키지 메타데이터와 README를 실제 프로젝트 상태에 맞게 정리
- QR 문자열 문법, 화면 구조, mock 데이터, 로컬 상태, 스캔 흐름, 향후 API 경계를 공식 기술 명세로 문서화
- 소셜 미리보기와 앱 아이콘을 포함한 브랜드 자산 확인 및 필요한 범위 갱신
- `npm run build`, 정적 검색, 브라우저 시나리오와 Sites 배포 검증

### 제외

- 백엔드/API, 사용자 계정, 서버 저장·동기화 구현
- 서브웨이 실제 메뉴와 맥도날드 실데이터 연동
- 결제 연동 또는 결제 처리
- QR payload 문법 변경
- 시각 구조의 전면 재설계

## 설계 방향

- `/`는 모바일 QR 생성 PWA, `/kiosk`는 노트북 카메라 기반 스캐너로 유지한다.
- QR payload는 `store={menuId,menuId}` 형식과 매장 간 세미콜론 구분을 유지하며, 현재는 스캔 원문과 로컬 mock 매핑만 사용한다.
- 메뉴 조합과 QR 포함 여부는 브라우저 로컬 저장소에 보관하고 서버 동기화로 표현하지 않는다.
- 브랜드 변경은 사용자-facing 문자열과 웹/PWA 메타데이터에 집중하며 기존 접근성·고대비·큰 터치 영역을 보존한다.
- 배포는 기존 `.openai/hosting.json`의 Sites 프로젝트를 재사용한다.

## 문서 위치 판단

제품·아키텍처·향후 API 경계의 공식 기준은 Hyper-Waterfall 운영 산출물인 `mydocs/`가 아니라 저장소 최상위 `docs/` 아래에 둔다. `docs/technical-specification.md`는 기여자와 후속 구현 에이전트가 README에서 발견할 수 있는 공식 기술 문서로 선택한다. 대안인 `specs/`는 계약 파일이 아직 단일 문서이고 별도 사양 트리가 필요하지 않아 사용하지 않는다.

| 파일 | 분류 | 대상 독자 | 선택 위치 | 대안 위치 | 선택 이유 |
|---|---|---|---|---|---|
| `docs/technical-specification.md` | 공식 기술·아키텍처 문서 | 기여자, 후속 구현자 | `docs/` | `specs/` | 제품 개요부터 계약·배포까지 한 문서로 탐색하기 쉽고 README에서 직접 연결 가능 |
| `README.md` | 공식 프로젝트 입문 문서 | 사용자, 기여자 | 저장소 루트 | `docs/README.md` | 설치·경로·검증·상세 명세 진입점은 루트 README가 관례에 맞음 |

## 예상 변경 파일

신규:

- `docs/technical-specification.md`

수정:

- `app/page.tsx`
- `app/kiosk/page.tsx`
- `app/kiosk/layout.tsx`
- `app/layout.tsx`
- `public/manifest.webmanifest`
- `public/og.png`
- `public/icon-192.png`
- `public/icon-512.png`
- `package.json`
- `package-lock.json`
- `README.md`

이번 task 산출물:

- `mydocs/orders/20260816.md`
- `mydocs/plans/task_m010_1.md`
- `mydocs/plans/task_m010_1_impl.md`
- `mydocs/working/task_m010_1_stage1.md`
- `mydocs/working/task_m010_1_stage2.md`
- `mydocs/working/task_m010_1_stage3.md`
- `mydocs/report/task_m010_1_report.md`

## 잠정 단계

- **Stage 1 — 제품 정체성과 공식 기술 명세 정리**
  - 사용자 화면, 메타데이터, manifest, 패키지, README를 `Prepped`로 통일하고 공식 기술 명세를 작성한다.
  - 기존 제품명·스타터 표식과 QR 계약 보존 여부를 검증한다.
- **Stage 2 — 브랜드 자산과 모바일·키오스크 시나리오 검증**
  - 아이콘·소셜 미리보기를 갱신하고 두 경로의 주요 사용자 흐름을 브라우저에서 확인한다.
  - 빌드, PWA 메타데이터, QR 생성·스캔 흐름과 접근성 기본 상태를 검증한다.
- **Stage 3 — 프로덕션 배포와 통합 검증**
  - 기존 Sites 프로젝트를 배포하고 모바일·키오스크 엔드포인트의 프로덕션 상태를 확인한다.
  - 정적 검색, Git diff, 최종 빌드와 배포 URL을 최종 보고에 고정한다.

## 검증 계획

### 단계별 검증

- Stage 1
  - `rg -n "한끼패스|vinext-starter|site-creator-vinext-starter" app public README.md package.json docs`
  - QR 문법과 `/`, `/kiosk`, 로컬 저장 범위 문서 확인
- Stage 2
  - `npm run build`
  - 로컬 브라우저에서 모바일 메뉴 저장·QR 생성과 키오스크 카메라/대체 입력 흐름 확인
  - manifest, 아이콘, OG 이미지 확인
- Stage 3
  - Sites 배포 성공 상태와 `/`, `/kiosk` 프로덕션 응답 확인
  - `git diff --check`

### 통합 검증

- 제품명 `Prepped`가 UI·웹/PWA 메타데이터·README·브랜드 자산에 일관되게 표시된다.
- QR payload 계약과 브라우저 로컬 저장 범위가 코드·문서에서 일치한다.
- `npm run build`가 성공한다.
- 프로덕션의 `/`, `/kiosk`가 모두 정상 제공된다.
- `git status --short`가 PR 준비 전 빈 출력이다.
- `git diff --check`가 경고 없이 통과한다.

## 리스크

- **기존 저장 데이터 호환성**: 로컬 저장 키와 QR payload는 변경하지 않아 기존 조합을 보존한다.
- **카메라 권한 차이**: 로컬과 프로덕션의 HTTPS·브라우저 권한 차이를 고려하고 QR 이미지 업로드 대체 흐름을 함께 확인한다.
- **배포 URL의 기존 명칭**: 기존 프로젝트 URL slug는 플랫폼 식별자이므로 이번 범위에서 강제 변경하지 않고 제품 표시명만 통일한다.
- **이미지 내 기존 명칭 잔존**: 텍스트 검색으로 찾을 수 없는 래스터 자산은 시각 검수 후 재생성한다.

## 승인 요청 사항

- 사용자 지시로 모든 Hyper-Waterfall 승인 게이트를 본 스레드에서 명시적으로 승인받았다.
- 공식 기술 문서 루트를 `docs/`로 선택하고 `docs/technical-specification.md`를 생성한다.
- QR payload 문법과 로컬 저장 구조는 유지하고 제품명·문서·브랜드 자산·배포만 갱신한다.

승인된 범위를 `task_m010_1_impl.md`에서 단계별 산출물, 검증 명령, 커밋 메시지로 구체화한다.
