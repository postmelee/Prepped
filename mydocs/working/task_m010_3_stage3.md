# Stage 3 보고서: CI/CD 배포 경로 구성

GitHub Issue: [#3](https://github.com/postmelee/Prepped/issues/3)
구현계획서: [`task_m010_3_impl.md`](../plans/task_m010_3_impl.md)
Stage: 3

## 단계 목적

`develop/backend`에서의 자동 검증과 `main`에서만 허용되는 AWS 운영 배포 경로를 코드로 고정하고, 배포 직후 주문 흐름을 검증할 스모크 테스트를 준비하는 것입니다.

## 산출물

| 파일 | 변경 요약 |
|---|---|
| `.github/workflows/backend-ci.yml` | `develop/backend` 및 `main` PR에서 pnpm 검사와 SAM 린트를 실행합니다. |
| `.github/workflows/backend-deploy.yml` | `main` push·수동 실행, `production` Environment, OIDC 단기 자격 증명, 전용 S3 아티팩트 버킷, CloudFormation 실행 역할, 배포 후 스모크 테스트를 연결했습니다. |
| `backend/scripts/smoke-test.mjs` | health, 초안 생성·복원, 완료, 멱등 재시도, QR 재사용, CORS를 확인하되 토큰·주문 원문을 출력하지 않습니다. |
| `backend/samconfig.toml.example` | 개발자 로컬 SAM의 안전한 기본 리전·변경 세트 확인 예시를 제공합니다. |
| `docs/aws-deployment.md` | OIDC subject, `production` Environment 변수 9개, 전용 아티팩트 버킷, 역할 분리와 실제 배포 흐름을 구체화했습니다. |
| `mydocs/plans/task_m010_3_impl.md` | 외부 계정 작업이 필요한 실제 배포를 Stage 4로 분리했습니다. |

## 본문 변경 정도 / 본문 무손실 여부

코드·운영 자동화 단계입니다. API 계약과 기존 `mcdonald={...}` QR 문법은 바꾸지 않았습니다. 운영 QR의 `/kiosk?draft={token}` 계약, `main` 배포 규칙, AWS 장기 키 비저장 원칙을 유지했습니다.

## 검증 결과

실행 명령:

```bash
node --check backend/scripts/smoke-test.mjs
pnpm --dir backend check
sam validate --template backend/template.yaml --lint
Python YAML 파서로 .github/workflows/*.yml 검사
git diff --check
```

결과:

- Node.js 문법 검사가 통과했습니다.
- TypeScript 컴파일과 자동 테스트 14개가 모두 통과했습니다.
- AWS SAM CLI 1.165.0의 린트를 포함한 템플릿 검증이 통과했습니다.
- GitHub Actions 워크플로 YAML 문법 검사가 통과했습니다.
- `git diff --check`가 통과했습니다.
- 로컬 SAM CLI는 샌드박스가 사용자 홈의 `.aws-sam` 메타데이터 쓰기를 제한해 경고를 출력했지만, 검증 명령은 성공했습니다. 생성물은 `.gitignore`로 제외합니다.

## 잔여 위험

- GitHub `production` Environment, AWS OIDC Provider, 전용 S3 버킷, 배포 역할, CloudFormation 실행 역할은 실제 AWS 계정에서 아직 생성되지 않았습니다.
- 따라서 현재 워크플로의 원격 실행, STS 역할 가정, SAM 배포와 네트워크 스모크 테스트는 아직 수행하지 않았습니다.
- OIDC `sub` 형식은 GitHub 조직·저장소 ID 정책에 따라 달라질 수 있으므로, 배포 역할 생성 시 실제 Environment subject를 그대로 적용해야 합니다.

## 다음 단계 영향

- Stage 4에서는 계정 소유자가 문서의 체크리스트에 따라 AWS와 GitHub Environment를 구성한 뒤, 개발 배포와 `main` 운영 배포를 실행합니다.
- 장기 액세스 키·루트 비밀번호·크레딧 토큰은 요구하거나 기록하지 않고, IAM Identity Center와 GitHub OIDC만 사용합니다.

## 승인 요청

- Stage 3 산출물과 검증 결과를 승인하면 AWS 콘솔·GitHub Environment의 외부 사전 조건을 완료한 뒤 Stage 4 실제 배포 검증으로 진행합니다.
