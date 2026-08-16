# Task #3 구현계획서 — AWS 주문 초안 백엔드와 배포 아키텍처 구축

수행계획서: [`task_m010_3.md`](task_m010_3.md)
GitHub Issue: [#3](https://github.com/postmelee/Prepped/issues/3)
마일스톤: M010

## 단계 개요

| Stage | 제목 | 주요 산출 | 검증 |
|---|---|---|---|
| 1 | API 계약·AWS 아키텍처·IAM 배포 계획 공식화 | `docs/*.md` | 문서 계약·보안·브랜치 정책 상호 검토 |
| 2 | 서버리스 주문 초안 API 구현 | `backend/` | 단위 테스트·빌드·SAM 템플릿 검증 |
| 3 | AWS 개발 배포와 최종 통합 준비 | AWS 개발 스택·GitHub Actions | 개발 API E2E·CORS·배포/롤백 검증 |

## 문서 위치 확인

| 파일 | 수행계획서상 선택 위치 | Stage 산출물 경로 | 일치 여부 | 비고 |
|---|---|---|---|---|
| 백엔드 아키텍처 | `docs/backend-architecture.md` | `docs/backend-architecture.md` | OK | 제품 기술 기준 문서 |
| API 계약 | `docs/api-specification.md` | `docs/api-specification.md` | OK | 프론트엔드 연동 기준 |
| AWS 배포·운영 | `docs/aws-deployment.md` | `docs/aws-deployment.md` | OK | IAM·CI/CD·롤백 운영 기준 |

## Stage 1 — API 계약·AWS 아키텍처·IAM 배포 계획 공식화

### 산출물

신규:

- `docs/backend-architecture.md`
- `docs/api-specification.md`
- `docs/aws-deployment.md`

### 변경 내용

- ChatGPT Sites, API Gateway HTTP API, Lambda, DynamoDB, CloudWatch, GitHub Actions OIDC의 책임과 데이터 흐름을 문서화한다.
- 주문 초안, QR 토큰, 반복 사용, 결제 완료 기록, API 오류·CORS·보안 정책을 API 계약으로 고정한다.
- 루트 계정 MFA, IAM Identity Center 관리자·개발자 권한, GitHub OIDC의 `main` 제한, 25달러 크레딧을 고려한 Budgets·비용 가드레일과 배포·롤백 절차를 문서화한다.

### 검증

- `rg -n "TODO|TBD|액세스 키|AccessKey" docs/backend-architecture.md docs/api-specification.md docs/aws-deployment.md`
- `git diff --check`

### 커밋

`Task #3 Stage 1: AWS 아키텍처와 배포 API 계약 문서화`

## Stage 2 — 서버리스 주문 초안 API 구현

### 산출물

신규:

- `backend/package.json`
- `backend/template.yaml`
- `backend/src/handlers/health.ts`
- `backend/src/handlers/create-draft.ts`
- `backend/src/handlers/get-draft.ts`
- `backend/src/handlers/complete-draft.ts`
- `backend/src/domain/catalog.ts`
- `backend/src/domain/drafts.ts`
- `backend/src/http/*.ts`
- `backend/tests/*.test.ts`

### 변경 내용

- TypeScript Lambda와 DynamoDB 단일 테이블을 구현한다.
- 256비트 토큰, 서버 가격·옵션 검증, 멱등 완료 처리, 일관된 오류 형식과 명시적 CORS를 구현한다.
- SAM 템플릿에 API Gateway HTTP API, Lambda, DynamoDB, 최소 권한 실행 역할, 로그 보존과 환경 변수를 정의한다.

### 검증

- `npm test --prefix backend`
- `npm run build --prefix backend`
- `sam validate --template backend/template.yaml`
- `git diff --check`

### 커밋

`Task #3 Stage 2: 서버리스 주문 초안 API 구현`

## Stage 3 — AWS 개발 배포와 최종 통합 준비

### 산출물

신규:

- `.github/workflows/backend-deploy.yml`
- `backend/scripts/smoke-test.mjs`

수정:

- `README.md`
- `docs/aws-deployment.md`

### 변경 내용

- `main` 브랜치 및 GitHub Environment 보호 규칙을 사용하는 OIDC 배포 워크플로를 추가한다.
- AWS 개발 스택에 배포해 주문 생성·조회·완료·오류·CORS 흐름을 확인한다.
- 배포 결과와 환경 변수, 롤백·비용 확인 절차를 갱신한다.

### 검증

- `sam validate --template backend/template.yaml`
- `npm test --prefix backend`
- `node backend/scripts/smoke-test.mjs "$PREPPED_API_BASE_URL"`
- `git diff --check`

### 커밋

`Task #3 Stage 3: AWS 개발 배포와 CI 연동 준비`

## 검증

- 각 Stage 검증 명령은 단계 보고서 작성 전에 실행한다.
- 실패한 검증은 단계 완료로 처리하지 않는다.
- Stage 2는 Stage 1 문서의 API 계약과 IAM 경계를 구현의 진실 원천으로 사용한다.
- Stage 3의 실제 배포는 루트 MFA, IAM Identity Center, 배포 역할이 준비된 뒤에만 수행한다.

## 커밋

- 구현계획서는 Stage 1 문서와 별도로 먼저 커밋한다.
- 단계 커밋은 단계 산출물과 `mydocs/working/task_m010_3_stage{N}.md`를 함께 묶는다.

## 단계 의존성

- Stage 2는 Stage 1 산출물 승인 후 진행한다.
- Stage 3은 Stage 2의 검증과 보고서 승인 후 진행한다.

## 위험과 대응

- **AWS 루트 계정 오용**: 루트 MFA를 먼저 설정하고, 이후 루트 로그인·액세스 키·공유 자격 증명을 금지한다.
- **권한 과다 부여**: 사람은 IAM Identity Center 임시 자격 증명, CI는 특정 저장소·`main`으로 제한된 OIDC 역할만 사용한다.
- **비용 초과**: 25달러 크레딧을 소진하기 전에 AWS Budgets 알림을 설정하고, 온디맨드·단일 리전·로그 보존 제한으로 MVP를 운영한다.
- **프론트엔드 동시 변경**: PR #2의 변경은 덮어쓰지 않고 최종 `main` 통합 전에 최신 `devel`을 반영한다.

## 승인 요청 사항

- Stage 1의 API 계약, AWS 서버리스 구조, IAM Identity Center·GitHub OIDC 원칙을 승인해 주십시오.
- Stage 1 완료 후 Stage 2 백엔드 구현으로 진행할 수 있도록 별도 승인해 주십시오.
