# Stage 4.1 보고서: AWS 개발 스택 부트스트랩·실배포

GitHub Issue: [#3](https://github.com/postmelee/Prepped/issues/3)
구현계획서: [`task_m010_3_impl.md`](../plans/task_m010_3_impl.md)
Stage: 4.1

## 단계 목적

새 AWS 계정에서 Prepped 서버리스 백엔드를 실제 개발 스택으로 배포하고, GitHub OIDC 운영 배포에 필요한 AWS 자원을 장기 액세스 키 없이 준비하는 것입니다.

## 산출물

| 파일 또는 자원 | 변경 요약 |
|---|---|
| `backend/template.yaml` | 함수·테이블·로그 그룹 이름을 고정하고 하나의 최소 권한 Lambda 실행 역할과 7일 로그 보존을 적용했습니다. |
| `backend/package.json`, `backend/pnpm-lock.yaml` | SAM이 임시 빌드에서 esbuild를 설치할 수 있도록 `esbuild`를 빌드 의존성으로 고정했습니다. |
| `backend/infra/github-oidc-bootstrap.yaml` | GitHub OIDC Provider, GitHub 배포 역할, CloudFormation 실행 역할을 만드는 CloudFormation 템플릿을 추가했습니다. |
| `.github/workflows/backend-deploy.yml`, `backend/samconfig.toml.example` | 이름 있는 IAM 역할을 만드는 템플릿에 맞게 `CAPABILITY_NAMED_IAM`을 사용하도록 수정했습니다. |
| `docs/aws-deployment.md` | OIDC 부트스트랩 템플릿·현재 계정의 비밀이 아닌 배포 변수 값을 기록했습니다. |
| S3 `prepped-prod-sam-artifacts-845081398362` | 퍼블릭 접근 차단, SSE-S3(AES-256) 기본 암호화, 14일 만료, Prepped 태그를 적용했습니다. |
| CloudFormation `prepped-dev-order-api` | 서울 리전에 HTTP API, Lambda 4개, DynamoDB, 7일 로그 그룹을 배포했습니다. |
| CloudFormation `prepped-github-oidc-bootstrap` | GitHub OIDC Provider와 역할 2개를 배포했습니다. |

## 본문 변경 정도 / 본문 무손실 여부

기존 `mcdonald={...}` QR 파서와 프런트 동작은 변경하지 않았습니다. 개발 스택의 CORS 및 QR 기본 주소만 아직 공개 Sites URL이 없어 `http://localhost:5173`으로 제한했습니다. 운영 환경은 GitHub `production` Environment 변수로 실제 Sites URL을 별도 주입합니다.

## 검증 결과

실행 명령:

```bash
pnpm --dir backend check
sam validate --template backend/template.yaml --lint
sam build --parallel --template backend/template.yaml
aws cloudformation validate-template --template-body file://backend/infra/github-oidc-bootstrap.yaml
aws cloudformation describe-stacks --stack-name prepped-dev-order-api
node backend/scripts/smoke-test.mjs
```

결과:

- TypeScript 컴파일과 자동 테스트 14개가 모두 통과했습니다.
- SAM 템플릿 린트와 병렬 Lambda 4개 번들 생성이 통과했습니다.
- IAM 부트스트랩 CloudFormation 템플릿은 `CAPABILITY_NAMED_IAM` 요구사항으로 검증됐습니다.
- 계정 `845081398362`, 리전 `ap-northeast-2`에서 `prepped-dev-order-api`와 `prepped-github-oidc-bootstrap`이 모두 `CREATE_COMPLETE`입니다.
- 개발 API는 `https://nv1a220o2i.execute-api.ap-northeast-2.amazonaws.com`으로 생성됐습니다.
- 배포 API에서 health, 주문 초안 생성·조회, 완료, 멱등 재시도, QR 재사용, `http://localhost:5173` CORS 스모크 테스트가 통과했습니다.
- GitHub OIDC 배포 역할은 `production` Environment subject 두 가지의 정확한 형식만 허용하며, CloudFormation 실행 역할만 `iam:PassRole` 대상으로 허용합니다.

## 잔여 위험

- GitHub 연결 권한이 `push`까지이므로 `production` Environment, 보호 규칙, Environment 변수 9개를 이 작업에서 생성할 수 없습니다.
- 실제 ChatGPT Sites URL이 아직 확정되지 않아 운영 CORS Origin, QR 기본 URL, 운영 스모크 Origin을 입력하지 않았습니다.
- GitHub 운영 배포는 사용자 요청의 `main` 브랜치에 Stage 4.1 변경이 병합된 뒤에만 실행할 수 있습니다. 현재 GitHub 기본 브랜치는 `devel`로 확인됐으므로 `main` 보호·병합 정책은 저장소 관리자가 별도로 확인해야 합니다.
- AWS Budgets와 비용 이상 감지는 알림 수신자 설정이 필요해 아직 생성하지 않았습니다.

## 다음 단계 영향

- Stage 4.2에서 저장소 관리자가 GitHub `production` Environment를 `main`으로 제한하고 문서의 9개 변수를 등록합니다.
- 실제 ChatGPT Sites URL을 변수 세 곳에 넣은 뒤 `main` 병합으로 `Deploy Backend to AWS`를 실행하고, OIDC 역할 가정과 운영 스모크 테스트를 검증합니다.
- 모든 AWS 작업은 새 계정의 `prepped-admin` 프로필을 사용했으며, 액세스 키·비밀 키·크레딧 토큰은 문서·커밋·로그에 기록하지 않았습니다.

## 승인 요청

- Stage 4.1 산출물과 실제 개발 배포 결과를 승인하면 GitHub Environment 관리자 설정 및 `main` 병합 준비를 위한 Stage 4.2로 진행합니다.
