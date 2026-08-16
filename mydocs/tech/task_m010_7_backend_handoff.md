# Task #7 백엔드 개발자 전달서 — 개발 API 배포·카탈로그 시드

## 전달 목적

Task #7의 코드 통합 이후 남은 **3단계(개발 AWS API 배포, 카탈로그 시드, Sites 연결값 전달)**를 `develop/backend` 담당자가 재현 가능하게 수행하기 위한 체크리스트다. 이 문서는 자격 증명이나 배포 승인을 포함하지 않으며, 실제 실행 전 담당자가 AWS 계정·스택·Origin을 다시 확인한다.

- GitHub Issue: [#7](https://github.com/postmelee/Prepped/issues/7)
- 백엔드 통합 기준: `develop/backend` 커밋 `802327d10ff5781a7e58ce29a7c42ef9fa04f96f`
- 대상 리전: `ap-northeast-2`
- 개발 스택: `prepped-dev-order-api`
- 공식 절차: [`docs/aws-deployment.md`](../../docs/aws-deployment.md)
- API 계약: [`docs/api-specification.md`](../../docs/api-specification.md)

## 0. 실행 전 확인

- [ ] `develop/backend`가 최소 `802327d10ff5781a7e58ce29a7c42ef9fa04f96f`를 포함한다.
- [ ] IAM Identity Center와 MFA로 개발자 임시 자격 증명을 받았다. 루트 사용자와 장기 액세스 키를 사용하지 않는다.
- [ ] 현재 AWS 계정과 리전이 개발 환경인지 `aws sts get-caller-identity`와 `aws configure get region`으로 확인했다.
- [ ] Sites의 실제 Origin과 `http://localhost:3000`을 `AllowedOrigins`에 넣을지 확인했다.
- [ ] 기존 `prepped-dev-order-api` 스택이 있다면 변경 세트와 `CatalogTableName`을 확인했다.

계정 ID, 액세스 키, 세션 토큰과 개인 정보는 이 문서·Issue·PR·로그에 붙이지 않는다.

## 1. 로컬 검증

저장소 루트에서 실행한다.

```bash
npm install
npm --prefix backend install
npm test
npm run test:contracts
npm run test:mobile
npm run test:kiosk
npm run lint
npm --prefix backend run check
npm --prefix backend run catalog:check
npm --prefix backend run catalog:seed:dry
sam validate --template-file backend/template.yaml --lint
sam build --template-file backend/template.yaml
```

성공 기준:

- 프런트엔드 `/`, `/kiosk` 빌드와 전체 테스트가 성공한다.
- 백엔드 TypeScript·테스트·SAM 검증이 성공한다.
- 카탈로그 버전은 `2026-08-16.1`, 매장은 3개, 메뉴는 총 495개다.
- dry-run 결과는 DynamoDB projection 1,022개이며 실제 쓰기는 발생하지 않는다.

## 2. 개발 스택 배포

아래의 `{SITES_ORIGIN}`을 실제 HTTPS Origin으로 바꾼다. 값 끝에는 `/`를 붙이지 않는다.

```bash
sam deploy \
  --stack-name prepped-dev-order-api \
  --region ap-northeast-2 \
  --capabilities CAPABILITY_NAMED_IAM \
  --resolve-s3 \
  --parameter-overrides \
    StageName=dev \
    AllowedOrigins="{SITES_ORIGIN},http://localhost:3000" \
    QrBaseUrl="{SITES_ORIGIN}" \
    DraftTtlDays=30
```

- [ ] 배포 전에 변경 세트에서 개발 스택만 변경되는지 확인했다.
- [ ] CloudFormation 상태가 `CREATE_COMPLETE` 또는 `UPDATE_COMPLETE`다.
- [ ] 출력의 `ApiBaseUrl`과 `CatalogTableName`을 기록했다. 둘 다 비밀값은 아니지만 계정 자격 증명과 함께 공유하지 않는다.

출력 조회:

```bash
aws cloudformation describe-stacks \
  --region ap-northeast-2 \
  --stack-name prepped-dev-order-api \
  --query "Stacks[0].Outputs"
```

## 3. 카탈로그 시드

`--apply`는 같은 키의 projection 1,022개를 덮어쓴다. dry-run, AWS 계정, 리전, 스택 출력의 테이블 이름을 사람이 확인한 뒤에만 실행한다.

```bash
CATALOG_TABLE_NAME="$(aws cloudformation describe-stacks \
  --region ap-northeast-2 \
  --stack-name prepped-dev-order-api \
  --query "Stacks[0].Outputs[?OutputKey=='CatalogTableName'].OutputValue" \
  --output text)"

printf '%s\n' "$CATALOG_TABLE_NAME"
CATALOG_TABLE_NAME="$CATALOG_TABLE_NAME" node backend/scripts/seed-catalog.mjs --apply
```

- [ ] 출력된 테이블이 정확히 `prepped-dev-catalog`인지 확인했다.
- [ ] 시드가 1,022개 projection을 오류 없이 기록했다.
- [ ] 공식 이미지 URL은 참조값으로만 저장되고 이미지 바이너리가 복제되지 않았음을 확인했다.

## 4. API·CORS 스모크 테스트

`ApiBaseUrl` 출력값을 사용하되 끝에 `/v1`을 미리 붙이지 않는다.

```bash
API_BASE_URL="$(aws cloudformation describe-stacks \
  --region ap-northeast-2 \
  --stack-name prepped-dev-order-api \
  --query "Stacks[0].Outputs[?OutputKey=='ApiBaseUrl'].OutputValue" \
  --output text)"

curl --fail-with-body "$API_BASE_URL/v1/stores"
curl --fail-with-body "$API_BASE_URL/v1/stores/mcdonald/menus?limit=1"
curl --fail-with-body "$API_BASE_URL/v1/stores/subway/menus?limit=1"
curl --fail-with-body "$API_BASE_URL/v1/stores/starbucks/menus?limit=1"
curl --fail-with-body -X POST "$API_BASE_URL/v1/catalog/resolve" \
  -H 'content-type: application/json' \
  -d '{"storeId":"mcdonald","menuIds":["mcdonald-178","missing-menu"]}'
curl --fail-with-body -i -X OPTIONS "$API_BASE_URL/v1/stores" \
  -H 'Origin: {SITES_ORIGIN}' \
  -H 'Access-Control-Request-Method: GET'
```

성공 기준:

- `/v1/stores`가 맥도날드·서브웨이·스타벅스와 카탈로그 버전을 반환한다.
- 세 매장의 메뉴 목록 요청이 각각 정상 응답한다.
- resolve가 `mcdonald-178`은 `menus`, `missing-menu`는 `unknownMenuIds`로 반환하는 부분 성공 계약을 지킨다.
- preflight 응답의 `Access-Control-Allow-Origin`이 요청한 Sites Origin과 정확히 일치한다.

## 5. 프런트엔드 담당자에게 전달할 값

백엔드 담당자는 검증이 끝나면 다음 값과 증거만 전달한다.

```text
PREPPED_API_BASE_URL={ApiBaseUrl 출력값, 끝의 / 없음, /v1 없음}
catalogVersion=2026-08-16.1
stack=prepped-dev-order-api
region=ap-northeast-2
smoke=stores/menu-list/partial-resolve/CORS 통과
```

프런트엔드 담당자는 Sites Worker 환경 변수에 `PREPPED_API_BASE_URL`을 설정하고 다시 배포한 뒤 `/api/catalog/v1/stores` 응답과 `/`, `/kiosk` 화면을 확인한다. 브라우저 응답만으로 내장 fallback과 AWS 응답을 구분하기 어려우므로, 동시에 CloudWatch 로그 그룹 `/aws/lambda/prepped-dev-order-api-list-stores`의 호출 증가를 확인해 실제 AWS 연결 증거를 남긴다.

## 6. 완료 증거와 주의사항

- [ ] 배포 스택 상태, `ApiBaseUrl`, `CatalogTableName`을 Issue #7 또는 후속 백엔드 작업에 기록했다.
- [ ] 시드 건수와 4종 스모크 결과를 기록했다.
- [ ] Sites 연결 담당자에게 위 5개 값만 전달했다.
- [ ] 오류가 있으면 CloudFormation 이벤트와 CloudWatch request ID만 공유하고 토큰·주문 내용·AWS 자격 증명은 공유하지 않았다.

예상 가격은 실제 주문 가격이 아니며, 외부 이미지 URL은 제공처 정책에 따라 변경될 수 있다. 실제 POS 재고·판매가·결제 연동은 이 전달 범위에 포함되지 않는다. 개발 스택이나 데이터를 삭제해야 하는 경우 별도 명시 승인을 받는다.
