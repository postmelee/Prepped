# Stage 2 보고서: AWS 백엔드 스캐폴드 구성

GitHub Issue: [#3](https://github.com/postmelee/Prepped/issues/3)
구현계획서: [`task_m010_3_impl.md`](../plans/task_m010_3_impl.md)
Stage: 2

## 단계 목적

주문 초안 생성·조회·완료 API를 AWS Lambda와 DynamoDB로 실행할 수 있는 최소 서버리스 경로를 구현하고, 로컬 자동 테스트와 SAM 템플릿 검증을 통과시키는 것입니다.

## 산출물

| 파일 | 변경 요약 |
|---|---|
| `backend/template.yaml` | API Gateway HTTP API, Lambda 4개, DynamoDB 단일 테이블, 최소 권한 정책을 정의했습니다. |
| `backend/src/domain/drafts.ts` | 서버 가격 계산, 256비트 토큰, 만료, QR URL, 완료 멱등성 도메인 서비스를 구현했습니다. |
| `backend/src/repositories/dynamo-drafts.ts` | 초안 조회·저장과 완료 재시도 레코드 및 독립 주문 기록의 DynamoDB 트랜잭션 저장을 구현했습니다. |
| `backend/src/handlers/*.ts` | 생성·조회·완료·상태 확인 Lambda 핸들러와 CORS·오류 응답을 구현했습니다. |
| `backend/src/runtime*.ts`, `backend/src/lambda.ts` | 환경 변수 검증과 AWS SDK 런타임 조립을 분리했습니다. |
| `backend/tests/*.test.ts` | 가격·옵션·만료·토큰·멱등성·HTTP·DynamoDB 저장을 검증하는 14개 테스트를 추가했습니다. |
| `backend/package.json`, `backend/pnpm-lock.yaml`, `backend/pnpm-workspace.yaml` | Node.js 22 이상과 Lambda esbuild 빌드 의존성을 고정했습니다. |
| `docs/backend-architecture.md`, `docs/api-specification.md` | 실제 구현과 맞게 QR 본문을 `/kiosk?draft={token}` 형식으로 정렬했습니다. |
| `.gitignore` | 로컬 의존성, pnpm 저장소, SAM 빌드 산출물을 제외했습니다. |

## 본문 변경 정도 / 본문 무손실 여부

코드 구현 단계입니다. 기존 프런트의 `mcdonald={...}` QR 문법은 변경하지 않았습니다. 새 QR은 메뉴·옵션·가격·개인정보 없이 키오스크 웹앱 URL의 난수 토큰만 담고, 키오스크가 API에서 주문 스냅샷을 복원합니다.

## 검증 결과

실행 명령:

```bash
npm test --prefix backend
npm run build --prefix backend
sam validate --template backend/template.yaml --lint
git diff --check
```

결과:

- Node.js 24 실행 환경에서 자동 테스트 14개가 모두 통과했습니다.
- TypeScript `--noEmit` 컴파일이 통과했습니다.
- AWS SAM CLI 1.165.0의 린트를 포함한 템플릿 검증이 `valid SAM Template`으로 통과했습니다.
- `git diff --check`가 통과했습니다.
- 샌드박스가 사용자 홈의 `.aws-sam` 메타데이터 쓰기를 막아 경고만 출력했으며, 템플릿 검증의 종료 코드는 성공이었습니다. 프로젝트의 SAM 산출물은 `.gitignore`로 제외했습니다.

## 잔여 위험

- 실제 AWS 계정의 IAM Identity Center, GitHub Actions OIDC 역할, GitHub `dev` 환경 변수/보호 규칙은 아직 생성되지 않았습니다.
- 실제 AWS 배포와 스모크 테스트는 계정 설정이 완료된 후 실행해야 합니다. 루트 자격 증명이나 액세스 키를 저장소·채팅에 공유하지 않습니다.
- 현재 서버 카탈로그는 기존 데모와 호환되는 `mcdonald` 매장만 구현했습니다. 다른 가상 식당은 API 계약을 유지한 채 카탈로그 확장으로 추가합니다.

## 다음 단계 영향

- Stage 3에서 GitHub Actions OIDC 배포 워크플로, 환경별 SAM 설정, 배포 후 상태 확인을 추가합니다.
- AWS 콘솔에서 예산, 루트 MFA, IAM Identity Center, OIDC Provider 및 배포 역할을 먼저 설정해야 실제 `sam deploy`를 진행할 수 있습니다.

## 승인 요청

- Stage 2 산출물과 검증 결과를 승인하면 Stage 3의 CI/CD 배포 경로 구성 및 AWS 계정 설정 체크리스트로 진행합니다.
