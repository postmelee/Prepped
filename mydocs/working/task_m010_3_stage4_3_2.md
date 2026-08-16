# Stage 4.3.2 보고서: production·development 카탈로그 배포 검증

GitHub Issue: [#3](https://github.com/postmelee/Prepped/issues/3)
구현계획서: [`task_m010_3_impl.md`](../plans/task_m010_3_impl.md)
Stage: 4.3.2

## 단계 목적

Stage 4.3.1의 SAM 패키징 수정과 실행 역할 보완을 실제 AWS 서울 리전의 production·development 스택에 적용하고, 카탈로그 1,022건 시드와 API·CORS·주문 초안 스모크 테스트까지 완료합니다. 기존 주문 테이블·스택·데이터는 삭제하지 않습니다.

## 산출물

| 파일 또는 AWS 자원 | 변경 요약 |
|---|---|
| `backend/infra/github-oidc-bootstrap.yaml` | 실제 CloudFormation 이벤트에서 확인된 DynamoDB PITR 조회·갱신 권한을 추가했습니다. |
| `backend/tests/catalog-deployment-permissions.test.ts` | `DescribeContinuousBackups`, `UpdateContinuousBackups` 누락 회귀를 RED→GREEN으로 검증했습니다. |
| `docs/aws-deployment.md` | 실제 두 환경 URL·테이블·시드·스모크 결과와 PITR 권한, Sites fallback 판별법을 기록했습니다. |
| `prepped-prod-order-api` | 카탈로그 테이블, 읽기 전용 Lambda 역할, 카탈로그 Lambda 4개와 API 라우트를 무교체 업데이트했습니다. |
| `prepped-prod-catalog` | 버전 `2026-08-16.1`의 DynamoDB projection 1,022건을 적용했습니다. |
| `prepped-dev-order-api` | production과 동일한 카탈로그 리소스를 기존 주문 리소스 보존 상태로 업데이트했습니다. |
| `prepped-dev-catalog` | 버전 `2026-08-16.1`의 DynamoDB projection 1,022건을 적용했습니다. |

## 본문 변경 정도 / 본문 무손실 여부

CloudFormation 변경 세트는 카탈로그 리소스 추가와 기존 Lambda/API의 `Replacement: False` 수정만 포함했습니다. 기존 주문 DynamoDB 테이블, 주문 데이터, API URL과 스택을 삭제하거나 교체하지 않았습니다. 첫 두 production 시도는 누락 권한에서 실패했지만 CloudFormation 자동 롤백으로 기존 주문 API가 보존됐습니다.

## 검증 결과

실행 명령:

```bash
aws sts get-caller-identity
sam deploy --no-execute-changeset ...
aws cloudformation execute-change-set ...
aws cloudformation wait stack-update-complete ...
node backend/scripts/seed-catalog.mjs --dry-run
CATALOG_TABLE_NAME=... node backend/scripts/seed-catalog.mjs --apply
GET /v1/health
GET /v1/stores
GET /v1/stores/{mcdonald|subway|starbucks}/menus?limit=1
POST /v1/catalog/resolve
OPTIONS /v1/catalog/resolve
node backend/scripts/smoke-test.mjs
aws dynamodb scan --select COUNT ...
aws logs describe-log-streams ...
```

결과:

- 계정 `845081398362`, 리전 `ap-northeast-2`, 대상 스택 `prepped-prod-order-api`·`prepped-dev-order-api`를 명시적으로 확인했습니다.
- production 변경 세트는 삭제·교체 0건이었고 최종 상태는 `UPDATE_COMPLETE`입니다.
- development 변경 세트도 삭제·교체 0건이었고 최종 상태는 `UPDATE_COMPLETE`입니다.
- 두 카탈로그 테이블 모두 `ACTIVE`, `PAY_PER_REQUEST`, SSE 활성화 상태이며 실제 scan count가 각각 1,022건입니다.
- 두 API 모두 health, stores, 맥도날드·서브웨이·스타벅스 대표 메뉴, `mcdonald-178` + `missing-menu` partial resolve가 HTTP 200으로 통과했습니다.
- 두 API의 Sites Origin preflight는 HTTP 204와 정확한 `Access-Control-Allow-Origin`을 반환했습니다.
- 주문 초안 스모크 테스트는 두 환경 모두 생성·복원·완료·멱등 재시도·QR 재사용·CORS를 통과했습니다.
- production과 development의 `list-stores` Lambda 모두 CloudWatch 최신 로그 스트림으로 실제 호출을 확인했습니다.
- 첫 production 롤백은 `UpdateContinuousBackups`, 두 번째는 `DescribeContinuousBackups` 누락이 원인이었으며, 각각 회귀 테스트와 최소 권한을 추가한 세 번째 시도에서 성공했습니다.

요청된 개발 환경 전달값:

```text
PREPPED_API_BASE_URL=https://nv1a220o2i.execute-api.ap-northeast-2.amazonaws.com
CatalogTableName=prepped-dev-catalog
catalogVersion=2026-08-16.1
stack=prepped-dev-order-api
region=ap-northeast-2
seed=1,022 projections 적용 완료
smoke=health/stores/3개 브랜드/partial-resolve/CORS 통과
cloudwatch=카탈로그 Lambda 호출 확인
```

## 잔여 위험

- GitHub CLI의 기존 `andrew427dev` 토큰이 만료되어 원격 `publish/task3` 브랜치는 푸시됐지만 PR 생성은 브라우저의 최종 제출 확인이 남았습니다.
- AWS 배포는 원격 커밋 `b729212`의 빌드 산출물로 직접 완료됐습니다. `devel`과 `main` 병합 뒤 GitHub OIDC 배포 워크플로가 같은 코드에서 성공하는지 재확인해야 합니다.
- 현재 공개 Sites `/api/catalog/stores`는 `cache-control: public, max-age=300` 로컬 fallback 응답입니다. `PREPPED_API_BASE_URL` 저장 후 Sites 재배포 또는 바인딩 반영 확인이 필요합니다.
- Stage 4.3.1 전에 보관한 주문 QR 프론트–백엔드 종단 통합 stash를 최신 `devel`에 다시 적용하고 충돌을 검토해야 합니다.

## 다음 단계 영향

- Stage 4.3.2 권한·문서 후속 커밋을 `publish/task3`에 푸시하고 `devel` 대상 PR을 생성·병합합니다.
- `devel → main` 릴리스 뒤 GitHub Actions production 배포 성공 또는 no-op을 확인합니다.
- 이후 기존 주문 QR 종단 통합 변경을 복원해 카탈로그 기반 서버 가격 계산과 Sites draft proxy를 완성합니다.

## 승인 요청

- 작업지시자가 같은 스레드에서 배포 우선과 후속 작업 전체 진행을 승인했으므로, PR 게시·병합과 주문 QR 종단 통합으로 계속 진행합니다.
