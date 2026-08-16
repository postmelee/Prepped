# Task #3 수행계획서 — AWS 주문 초안 백엔드와 배포 아키텍처 구축

GitHub Issue: [#3](https://github.com/postmelee/Prepped/issues/3)
마일스톤: M010

## 목적

ChatGPT Sites에 호스팅된 Prepped PWA·키오스크가 AWS의 주문 초안 API를 안전하게 사용할 수 있도록 백엔드 기반을 구축한다. 보호자가 사전 선택한 메뉴 조합은 서버의 주문 초안으로 저장하고, QR에는 개인정보·결제정보가 아닌 난수 토큰 URL만 담는다.

동시에 프론트엔드·배포 담당자가 하나의 기준 문서를 공유할 수 있도록 AWS 아키텍처, API 계약, 배포·롤백 계획을 `docs/`에 공식화한다. 백엔드 작업은 `develop/backend`에서 분리하고, 최종 통합과 배포는 `main`을 기준으로 한다.

## 배경

현재 앱은 브라우저 로컬 상태와 `store={menuId,menuId}` QR 원문 파싱으로 모바일과 `/kiosk` 시나리오를 제공한다. 이 계약은 기존 사용 흐름을 보호하기 위해 유지하되, 서버 저장 주문·기기 간 전달·결제 완료 기록을 위한 API 경계를 추가해야 한다.

Issue #1 및 PR #2는 리브랜딩·기술 명세·Sites 배포 작업이며 백엔드 구현을 제외한다. PR #2가 `devel`을 대상으로 열려 있으므로, 이 task는 동시 변경을 덮어쓰지 않고 `develop/backend`에서 독립적으로 진행한다.

## 범위

### 포함

- `backend/`에 AWS Lambda, API Gateway, DynamoDB를 사용하는 TypeScript 서버리스 주문 API를 추가한다.
- 주문 초안 생성, 토큰 기반 조회, 결제 완료 주문 기록 생성 API를 구현한다.
- 토큰 생성·검증, 요청 검증, CORS, 오류 응답, 환경 변수, 최소 권한 IAM 정책을 구현한다.
- API 계약과 AWS 구조·배포·롤백 절차를 `docs/`에 작성한다.
- 로컬 단위·통합 테스트와 AWS 개발 환경 배포 검증을 수행한다.

### 제외

- 실제 PG 결제, POS·상용 키오스크 연동, 계정·수신자 관리
- 개인정보·결제정보·카드 정보 저장
- 기존 QR 메뉴 원문 문법의 제거 또는 프론트엔드 화면 대규모 개편
- 프로덕션 도메인 구매·DNS 이전 및 비용 최적화 자동화

## 설계 방향

- AWS는 API Gateway HTTP API → Lambda(TypeScript) → DynamoDB 구조로 구성한다. 주문 초안은 `DRAFT#{token}` 키로 저장하고, 결제 완료 건은 별도 `ORDER#{id}` 레코드로 기록해 QR 재사용성을 보장한다.
- QR에는 API의 조회 URL과 128비트 이상 난수 토큰만 포함한다. 메뉴·옵션·가격·개인정보·결제정보는 QR 본문에 넣지 않는다.
- API는 `/v1/drafts`, `/v1/drafts/{token}`, `/v1/drafts/{token}/complete`를 기본 계약으로 하며, 프론트엔드에는 버전 고정 JSON 응답과 재시도 가능한 오류 코드를 제공한다.
- ChatGPT Sites의 실제 허용 Origin은 환경 변수로 관리한다. 개발 환경은 명시적 로컬 Origin만 추가하며 와일드카드 CORS는 사용하지 않는다.
- 인프라는 AWS SAM 템플릿으로 정의해 개발·프로덕션을 동일한 방식으로 배포한다. 비밀 값은 Git에 저장하지 않고 GitHub Actions OIDC와 AWS IAM Role을 사용한다.
- 브랜치 운영은 `develop/backend`에서 백엔드 작업을 누적하고, 최종 릴리스 PR은 `develop/backend`에서 `main`으로 생성한다. `devel`과의 통합은 PR #2 병합 이후 릴리스 직전에 충돌을 해소한다.

## 문서 위치 판단

제품·외부 API·배포 담당자가 직접 참조하는 문서이므로 작업 이력용 `mydocs/`가 아닌 저장소 공식 문서 루트 `docs/`를 선택한다. `mydocs/`에는 승인·단계·최종 보고서만 보관한다.

| 파일 | 분류 | 대상 독자 | 선택 위치 | 대안 위치 | 선택 이유 |
|---|---|---|---|---|---|
| `docs/backend-architecture.md` | 공식 아키텍처 문서 | 프론트엔드·백엔드·심사자 | `docs/` | `mydocs/tech/` | 서비스 경계, 데이터 모델, 보안 결정을 제품 기술 기준으로 공유해야 한다. |
| `docs/api-specification.md` | 공식 API 계약 | 프론트엔드·백엔드 | `docs/` | `backend/README.md` | 프론트엔드가 독립적으로 연동할 수 있는 단일 계약이 필요하다. |
| `docs/aws-deployment.md` | 공식 운영·배포 문서 | 백엔드·배포 담당자 | `docs/` | `mydocs/manual/` | AWS 초기 설정, CI/CD, 롤백은 제품 운영 문서다. |

## 예상 변경 파일

신규:

- `backend/package.json`
- `backend/template.yaml`
- `backend/src/handlers/*.ts`
- `backend/src/domain/*.ts`
- `backend/tests/*.test.ts`
- `docs/backend-architecture.md`
- `docs/api-specification.md`
- `docs/aws-deployment.md`
- `mydocs/plans/task_m010_3_impl.md`
- `mydocs/working/task_m010_3_stage{N}.md`
- `mydocs/report/task_m010_3_report.md`

수정:

- `.gitignore`
- `README.md`
- `mydocs/orders/20260816.md`

이번 task 산출물:

- `mydocs/orders/20260816.md`
- `mydocs/plans/task_m010_3.md`
- `mydocs/plans/task_m010_3_impl.md`
- `mydocs/working/task_m010_3_stage{N}.md`
- `mydocs/report/task_m010_3_report.md`

## 잠정 단계

- **Stage 1 — API 계약과 AWS 아키텍처 공식화**
  - `docs/`에 아키텍처, API 명세, 배포 계획을 작성한다.
  - QR 토큰·재사용·CORS·데이터 모델·보안·롤백 계약을 검토한다.
- **Stage 2 — 서버리스 백엔드 구현과 로컬 검증**
  - SAM 인프라, Lambda 핸들러, DynamoDB 저장소, 테스트를 구현한다.
  - 주문 초안 생성·조회·완료 및 실패 응답을 자동 검증한다.
- **Stage 3 — AWS 개발 환경 배포와 프론트엔드 연동 준비**
  - AWS 개발 환경에 배포하고 CORS·API Gateway·DynamoDB 동작을 확인한다.
  - 환경 변수, GitHub Actions OIDC 배포 흐름, 운영·롤백 절차를 검증한다.

## 검증 계획

### 단계별 검증

- Stage 1
  - API 요청·응답 예시와 DynamoDB 레코드가 상호 일치하는지 검토한다.
  - 문서 내 QR 개인정보 비포함, CORS 명시 허용 Origin, 재사용 정책을 확인한다.
- Stage 2
  - `npm test --prefix backend`
  - `npm run build --prefix backend`
  - `sam validate --template backend/template.yaml`
- Stage 3
  - AWS 개발 엔드포인트에서 생성·조회·완료 흐름을 호출한다.
  - ChatGPT Sites Origin의 preflight와 API 호출을 확인한다.

### 통합 검증

- 동일 토큰의 주문 초안이 반복 조회되고, 완료 요청마다 독립 주문 기록이 생성된다.
- 유효하지 않은 토큰·삭제된 초안·입력 오류가 문서화된 JSON 오류 형식으로 반환된다.
- `git status --short`가 PR 준비 전 빈 출력이다.
- `git diff --check`가 경고 없이 통과한다.

## 리스크

- **동시 프론트엔드 변경**: PR #2가 아직 `devel`에 병합되지 않아 문서 또는 README 충돌이 날 수 있다. 해당 PR을 덮어쓰지 않고 최종 `main` 통합 전 최신 변경을 반영한다.
- **AWS 권한·비용**: 배포 계정과 OIDC Role이 준비되지 않으면 실제 배포가 지연될 수 있다. 로컬 SAM 검증을 먼저 완료하고 필요한 IAM 권한을 최소 범위로 문서화한다.
- **ChatGPT Sites Origin 확정**: Sites의 실제 Origin 또는 환경별 URL이 바뀌면 CORS가 실패할 수 있다. 와일드카드 대신 환경 변수 기반 허용 목록을 사용한다.
- **QR 계약 호환성**: 기존 QR 원문 파서를 즉시 제거하면 현재 키오스크 흐름이 깨질 수 있다. 서버 토큰 URL은 병행 지원하고 메뉴 원문 규칙은 유지한다.

## 승인 요청 사항

- `develop/backend`를 백엔드 작업 브랜치로 유지하고, 최종 통합·배포 PR의 대상 브랜치를 `main`으로 하는 방식을 승인해 주십시오.
- `docs/backend-architecture.md`, `docs/api-specification.md`, `docs/aws-deployment.md`를 공식 문서 위치로 승인해 주십시오.
- AWS SAM + API Gateway HTTP API + Lambda + DynamoDB와 GitHub Actions OIDC 배포 방식을 승인해 주십시오.
- 실제 PG·POS·로그인·개인정보 저장을 이번 MVP 범위에서 제외하는 것을 승인해 주십시오.

승인되면 `task_m010_3_impl.md`에서 단계별 산출물, 검증 명령, 커밋 메시지를 구체화합니다.
