# Stage 4.3.1 보고서: 카탈로그 SAM 패키징·실행 역할 복구

GitHub Issue: [#3](https://github.com/postmelee/Prepped/issues/3)
구현계획서: [`task_m010_3_impl.md`](../plans/task_m010_3_impl.md)
Stage: 4.3.1

## 단계 목적

Task #7 카탈로그가 `main`에 통합된 뒤 AWS SAM이 `backend/` 밖의 `shared/catalog` import를 복사하지 못해 8개 Lambda 빌드가 중단된 회귀를 제거합니다. 동시에 PR #14 운영 배포에서 실제로 확인된 CloudFormation 실행 역할의 SAM 변환, DynamoDB TTL, API Gateway 태그 권한 누락을 저장소의 부트스트랩 템플릿에 반영합니다.

## 산출물

| 파일 | 변경 요약 |
|---|---|
| `backend/src/catalog/contract.ts` | Lambda 실행 상수는 `backend/` 안에 두고, 타입 별칭은 기존 공유 계약을 계속 TypeScript 기준으로 사용하도록 분리했습니다. |
| `backend/src/catalog/{service,domain,repository,dynamo-catalog}.ts` | Lambda 런타임 import가 SAM `CodeUri` 경계를 벗어나지 않도록 로컬 계약 모듈을 사용합니다. |
| `backend/tests/sam-codeuri-boundary.test.ts` | `backend/src`만 복사한 격리 디렉터리에서 8개 핸들러를 실제 esbuild 번들링하여 회귀를 차단합니다. |
| `backend/infra/github-oidc-bootstrap.yaml` | TTL 조회·갱신, API Gateway 태그, `/tags/*`, SAM Transform 변경 세트 권한을 최소 범위로 추가했습니다. 기존 카탈로그 테이블·역할 ARN 제한은 유지합니다. |
| `backend/tests/catalog-deployment-permissions.test.ts` | 실제 배포에서 필요했던 권한이 부트스트랩 템플릿에서 다시 빠지지 않도록 검증합니다. |
| `backend/tests/drafts.test.ts` | 기존 Task #16 테스트 더블의 미사용 인자를 명시적으로 소비해 저장소 전체 lint 회귀를 제거했습니다. |
| `mydocs/plans/task_m010_3_impl.md`, `mydocs/orders/20260816.md` | Stage 4.3.1/4.3.2 복구 순서와 현재 진행 상태를 기록했습니다. |

## 본문 변경 정도 / 본문 무손실 여부

API 경로, 응답 계약, 카탈로그 데이터와 주문 동작은 변경하지 않았습니다. 공유 타입 계약은 계속 단일 TypeScript 검사 기준으로 유지하며, Lambda 번들에서 실제로 필요한 매장 키와 QR-safe 정규식만 SAM의 `backend/` 경계 안에 둡니다. 기존 주문·카탈로그 테이블이나 배포 스택을 삭제하는 변경은 없습니다.

## 검증 결과

실행 명령:

```bash
node --test backend/tests/sam-codeuri-boundary.test.ts backend/tests/catalog-deployment-permissions.test.ts
node --test backend/tests/*.test.ts
node backend/scripts/collect-catalog.mjs --fixtures --check
node backend/scripts/seed-catalog.mjs --dry-run
sam validate --template backend/template.yaml --lint
sam build --template-file backend/template.yaml
vinext build
node --test tests/*.test.mjs
eslint . --ignore-pattern dist --ignore-pattern .next
git diff --check
```

결과:

- RED: 수정 전 격리 번들은 `../../../shared/catalog/*.ts` 3건을 찾지 못했고, 실행 역할 테스트는 TTL 권한부터 실패했습니다.
- GREEN: 패키징·권한 회귀 테스트 3개와 전체 백엔드 테스트 34개가 통과했습니다.
- 카탈로그 스냅샷은 맥도날드 91개, 서브웨이 93개, 스타벅스 311개로 총 495개이며 버전은 `2026-08-16.1`입니다.
- DynamoDB seed dry-run은 예상대로 1,022개 projection을 생성했습니다.
- AWS SAM CLI 1.165.0 lint와 Node.js 22 ARM64 Lambda 8개 실제 esbuild 번들이 통과했습니다.
- 격리된 최신 `devel`에서 `/`, `/kiosk` 프런트 빌드와 테스트 28개, 전체 lint가 통과했습니다.
- `git diff --check`가 통과했습니다.

## 잔여 위험

- 현재 AWS 실행 역할의 인라인 정책에는 이전 긴급 수정은 들어갔지만 카탈로그 테이블·카탈로그 Lambda 역할 ARN 범위를 다시 확인하고 저장소 템플릿과 일치시켜야 합니다.
- 수정 커밋이 `devel`과 `main`에 병합되기 전에는 실패한 GitHub Actions run `31936491937`을 단순 재실행해도 기존 패키징 오류가 반복됩니다.
- production과 development의 카탈로그 테이블 생성·1,022건 시드·API/CORS 스모크 테스트는 Stage 4.3.2에서 수행합니다.
- 로컬 시스템 기본 Node.js 16은 저장소 요구 버전보다 낮아 검증에는 Codex Node.js 24.19.0을 명시적으로 사용했습니다.

## 다음 단계 영향

- Stage 4.3.2에서 AWS 계정·리전·스택을 재확인하고 실행 역할을 저장소 템플릿과 일치시킵니다.
- GitHub PR을 통해 `devel`과 `main`을 갱신한 뒤 production 배포, 카탈로그 시드, 원격 스모크 테스트를 수행합니다.
- 이후 동일 코드를 development 스택에 변경 세트로 반영하고 예상 밖 교체·삭제가 없을 때만 실행합니다.

## 승인 요청

- 작업지시자가 같은 스레드에서 남은 작업과 후속 작업 전체 진행을 승인했으므로, Stage 4.3.1 커밋과 PR 게시 후 Stage 4.3.2 AWS 배포 검증으로 진행합니다.
