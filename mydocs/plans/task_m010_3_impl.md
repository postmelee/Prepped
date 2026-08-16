# 구현계획서: Task #3 AWS 주문 초안 백엔드와 배포 아키텍처 구축

수행계획서: [task_m010_3.md](task_m010_3.md)
GitHub Issue: [#3](https://github.com/postmelee/Prepped/issues/3)
마일스톤: M010

## 단계 개요

| Stage | 제목 | 주요 산출 | 검증 |
|---|---|---|---|
| 1 | 공식 아키텍처·API·배포 문서화 | `docs/backend-architecture.md`, `docs/api-specification.md`, `docs/aws-deployment.md` | 문서 간 계약 일치, QR/배포/IAM 경계 확인 |
| 2 | AWS 백엔드 스캐폴드 구성 | `backend/` | `backend` 빌드·테스트·SAM 검증 |
| 3 | CI/CD 배포 경로 구성 | GitHub Actions, 스모크 테스트, 배포 설정 문서 | 워크플로·SAM·스모크 스크립트 정적 검증 |
| 4 | AWS 계정 실배포 | AWS `dev`/`production` 환경 및 배포 증적 | OIDC 역할 가정, SAM 배포, 원격 스모크 테스트 |

## 문서 위치 확인

수행계획서에서 공식 문서 루트로 선택한 `docs/`와 Stage 1 산출물 경로가 일치한다. `mydocs/`에는 계획·보고만 남긴다.

| 파일 | 수행계획서상 선택 위치 | Stage 산출물 경로 | 일치 여부 | 비고 |
|---|---|---|---|---|
| `docs/backend-architecture.md` | `docs/` | `docs/backend-architecture.md` | OK | 공식 아키텍처 문서 |
| `docs/api-specification.md` | `docs/` | `docs/api-specification.md` | OK | 공식 API 계약 |
| `docs/aws-deployment.md` | `docs/` | `docs/aws-deployment.md` | OK | 공식 배포/운영 문서 |

## Stage 1 — 공식 아키텍처·API·배포 문서화

### 산출물

신규:

- `docs/backend-architecture.md`
- `docs/api-specification.md`
- `docs/aws-deployment.md`

### 변경 내용

- 현재 프런트엔드 QR 계약, `/`와 `/kiosk` 역할, 로컬 상태 보관 방식을 문서화한다.
- AWS 서버리스 백엔드의 목표 구조, 데이터 경계, 토큰 전략, 오류 응답을 공식화한다.
- AWS 루트 계정 준비 상태와 IAM 계정/역할 설계, OIDC 배포 경로, 비용·권한 안전장치를 정리한다.

### 검증

```bash
test -f docs/backend-architecture.md docs/api-specification.md docs/aws-deployment.md
git diff --check
```

### 커밋

```text
Task #3 Stage 1: AWS 백엔드 공식 문서화
```

## Stage 2 — AWS 백엔드 스캐폴드 구성

### 산출물

- `backend/package.json`
- `backend/template.yaml`
- `backend/src/handlers/*.ts`
- `backend/src/domain/*.ts`
- `backend/tests/*.test.ts`

### 변경 내용

- 주문 초안 생성/조회/완료 API의 코드 골격을 만든다.
- 토큰 생성, 요청 검증, CORS, 오류 응답, DynamoDB 접근 계층을 분리한다.
- 로컬 테스트와 SAM 검증을 통과하는 최소 실행 경로를 만든다.

### 검증

```bash
npm test --prefix backend
npm run build --prefix backend
sam validate --template backend/template.yaml
git diff --check
```

### 커밋

```text
Task #3 Stage 2: AWS 백엔드 스캐폴드 구현
```

## Stage 3 — CI/CD 배포 경로 구성

### 산출물

- `.github/workflows/backend-ci.yml`
- `.github/workflows/backend-deploy.yml`
- `backend/scripts/smoke-test.mjs`
- `backend/samconfig.toml.example`
- `docs/aws-deployment.md`

### 변경 내용

- `develop/backend`과 `main` PR에서 자동 검증하는 CI를 구성한다.
- `main` 병합 후 `production` Environment를 통과해야만 OIDC로 배포하는 워크플로를 구성한다.
- SAM 배포 뒤 health·초안 생성·조회·완료·멱등성·QR 재사용·CORS를 검증하는 스모크 스크립트를 추가한다.
- GitHub Environment 변수, 전용 아티팩트 버킷, OIDC 역할과 CloudFormation 실행 역할의 분리를 운영 문서에 고정한다.

### 검증

```bash
pnpm --dir backend check
sam validate --template backend/template.yaml --lint
node --check backend/scripts/smoke-test.mjs
GitHub Actions YAML 문법 검사
git diff --check
```

### 커밋

```text
Task #3 Stage 3: GitHub OIDC 배포 경로 구성
```

## Stage 4 — AWS 계정 실배포

### 외부 사전 조건

- 계정 소유자가 루트 MFA, IAM Identity Center, 예산 경보, OIDC Provider, `production` Environment 변수와 역할을 설정한다.
- 장기 액세스 키·루트 비밀번호·크레딧 토큰은 저장소나 채팅으로 전달하지 않는다.

### 수행 내용

- IAM Identity Center 임시 자격 증명으로 개발 스택을 먼저 배포하고, ChatGPT Sites Origin에서 API·CORS를 확인한다.
- `main` 병합 뒤 GitHub `production` Environment 승인으로 OIDC 운영 배포를 실행한다.
- GitHub Actions 실행 로그, CloudFormation 스택 출력, 자동 스모크 테스트, 비용 알림을 확인한다.

### 검증

```bash
aws sts get-caller-identity
sam deploy --guided
GET /v1/health
GitHub Actions Deploy Backend to AWS 성공
```

### 커밋

```text
Task #3 Stage 4: AWS 실배포 검증
```

## 검증

- 각 Stage 검증 명령은 단계 보고서 작성 전에 실행한다.
- 현재 요청은 공식 문서화 단계이므로 Stage 1 완료 후 다음 단계로 넘어간다.
- 문서 위치가 수행계획서 판단과 일치하지 않으면 구현 전에 계획을 갱신한다.

## 커밋

- Stage 산출물과 `mydocs/working/task_m010_3_stage1.md`를 함께 묶는다.
- 이후 단계도 각 Stage 산출물과 단계 보고서를 한 묶음으로 커밋한다.

## 단계 의존성

- Stage 2는 Stage 1의 공식 문서 확정 후 진행한다.
- Stage 3은 Stage 2의 코드 골격과 검증이 끝난 뒤 진행한다.
- Stage 4는 Stage 3의 워크플로가 `main`에 병합되고 계정 소유자가 외부 사전 조건을 완료한 뒤 진행한다.

## 위험과 대응

- **AWS 루트 계정 오남용**: 루트는 초기 결제/복구용으로만 두고, 작업은 IAM 사용자와 역할로 분리한다.
- **기존 QR 계약 불일치**: 현재 프런트는 로컬 QR 계약을 유지하고 있으므로 백엔드 문서에서 전환 경로를 명시한다.
- **비용 초과**: 25달러 크레딧을 감안해 예산/알림을 먼저 설정하고 작은 개발 단계부터 검증한다.

## 승인 요청 사항

- Stage 1에서 `docs/` 공식 문서를 작성하는 것을 승인해 주십시오.
- AWS 루트 계정과 별개로 IAM 사용자/역할, OIDC 배포, 예산 알림을 우선 적용하는 것을 승인해 주십시오.
- QR 계약과 `/`, `/kiosk` 경로를 당분간 현재 흐름과 병행 유지하는 것을 승인해 주십시오.
