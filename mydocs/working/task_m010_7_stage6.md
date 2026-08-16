# Task #7 Stage 6 완료 보고서 — 종단 검증과 운영 문서 정리

GitHub Issue: [#7](https://github.com/postmelee/Prepped/issues/7)
구현계획서: [`task_m010_7_impl.md`](../plans/task_m010_7_impl.md)
Stage: 6

## 단계 목적

Stage 1~5에서 구현한 실메뉴 수집·카탈로그 API·모바일 다중 매장 설정·선택 매장 키오스크 복원을 한 흐름으로 재검증하고, 실제 운영자가 수집·시드·배포·연결할 수 있도록 공식 문서를 현재 코드와 일치시킨다.

## 산출물

| 파일 | 변경 요약 |
|---|---|
| `README.md` | 세 브랜드 495개 메뉴, 모바일·키오스크 흐름, 동일 출처 API, 수집·검증 명령, 가격·이미지 정책 문서화 |
| `docs/technical-specification.md` | 실제 QR ID, v2 로컬 저장·레거시 매핑, 선택 매장 resolve와 옵션 직렬화 경계 확정 |
| `docs/api-specification.md` | 카탈로그 `2026-08-16.1`의 실제 ID·가격 유형·응답 예시와 495개 스냅샷 범위 반영 |
| `docs/backend-architecture.md` | Sites Worker adapter, API Gateway, DynamoDB 카탈로그와 로컬 fallback 경계 반영 |
| `docs/aws-deployment.md` | 검증·dry-run·명시적 DynamoDB 시드·카탈로그 스모크·Sites 환경 변수 절차 추가 |
| `backend/template.yaml` | 카탈로그 테이블·Lambda 이름과 전용 최소 읽기 역할을 명시해 배포 실행 역할 범위와 일치 |
| `backend/infra/github-oidc-bootstrap.yaml` | CloudFormation 실행 역할의 `prepped-*-catalog` 관리 범위 추가, 배포 역할 데이터 쓰기 권한은 미부여 |
| `backend/tests/catalog-template.test.ts` | 이름·역할·읽기 전용 정책의 SAM 회귀 검증 보강 |
| `backend/tests/catalog-deployment-permissions.test.ts` | CloudFormation 카탈로그 범위와 CI 데이터 쓰기 금지 검증 |
| `app/page.tsx` | QR에는 메뉴 ID만 저장되고 옵션 선택값은 저장하지 않는다는 안내로 계약 정정 |
| `tests/rendered-html.test.mjs` | 정정된 모바일 옵션·QR 경계 회귀 검증 |
| `mydocs/orders/20260816.md` | Stage 6 로컬 검증 완료와 최종 게시 진행 상태 기록 |

## 본문 변경 정도 / 본문 무손실 여부

공식 문서의 기존 주문 초안·보안·IAM 설명은 유지하고, 더 이상 사실이 아닌 mock 메뉴·숫자형 주 QR·미구현 상태 설명과 카탈로그 예시만 현재 구현으로 교체했다. #3 주문 초안 URL QR은 Task #7 원문 QR의 기본 계약으로 전환하지 않고 선택 기능 경계로 보존했다.

SAM의 주문 경로와 주문 테이블 쓰기 권한은 보존했다. 카탈로그 Lambda는 명시적 함수명과 별도 `catalog-api-lambda` 역할을 사용해 CatalogTable 읽기만 허용하며, 카탈로그 테이블 쓰기는 운영자의 명시적 시드 명령에만 남겼다. GitHub 배포 역할에 `BatchWriteItem`은 추가하지 않았다.

## 검증 결과

실행 명령:

```bash
npm test
npm run test:contracts
npm run test:mobile
npm run test:kiosk
npm run lint
(cd backend && npm run check)
(cd backend && npm run catalog:check)
(cd backend && npm run catalog:seed:dry)
ruby -e 'require "yaml"; ... YAML.parse_file(...)'
esbuild backend/src/handlers/*.ts --bundle --platform=node --target=node22
git diff --check
git status --short
```

결과:

- OK — vinext 프로덕션 빌드와 `/`, `/kiosk` 서버 렌더 테스트 3개 통과.
- OK — 공용 카탈로그/API/QR 계약 11개, 모바일 9개, 키오스크 12개 테스트 통과.
- OK — ESLint 오류 없음.
- OK — 백엔드 TypeScript와 테스트 31개 통과.
- OK — fixture 수집 검증: 맥도날드 91, 서브웨이 93, 스타벅스 311.
- OK — DynamoDB dry-run: 카탈로그 `2026-08-16.1`, 총 1,022개 projection.
- OK — SAM·OIDC·워크플로 YAML 구문과 8개 Lambda 엔트리 번들 검증 통과.
- OK — `git diff --check` 오류 없음.

## 잔여 위험

- 현재 실행 환경에 AWS CLI와 SAM CLI가 없어 `sam validate --lint`, AWS 개발 스택 배포·시드·API Gateway 스모크는 실행하지 못했다. YAML 구문, Lambda 번들, 템플릿 권한 테스트로 로컬 범위를 보완했다.
- 카탈로그 시드는 1,022개 키를 덮어쓰므로 자동 배포 역할에 쓰기 권한을 주지 않았다. 운영자가 대상 `CatalogTableName`과 dry-run을 확인한 뒤 명시적으로 실행해야 한다.
- 공식 이미지 URL은 `reference-only`이며 외부 사이트 변경·차단 시 플레이스홀더가 표시된다. 공식 ID 변경 시 레거시 매핑 검토가 필요하다.
- 옵션 그룹은 커스텀 가능성을 표시하지만 v0.1.0 QR에는 옵션 선택값을 저장하지 않는다.

## 다음 단계 영향

- 이 Stage 커밋을 Sites 소스 저장소에 올린 뒤 동일 SHA의 배포 아카이브로 새 버전을 저장·검증한다.
- 최종 보고서에서 Sites 결과, 전체 커밋 범위, 미실행 AWS 검증을 다시 요약하고 `publish/task7`을 `develop/backend` 대상으로 PR 게시한다.

## 승인 요청

- 작업지시자가 이 스레드에서 PR 생성까지 모든 하이퍼-워터폴 승인 게이트를 명시적으로 승인했으므로, Stage 6 커밋 후 Sites 버전·최종 보고서·PR 게시를 계속 진행한다.
