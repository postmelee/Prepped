# Task #3 Stage 1 완료 보고서 — AWS 백엔드 공식 문서화

수행계획서: [task_m010_3.md](../plans/task_m010_3.md)
구현계획서: [task_m010_3_impl.md](../plans/task_m010_3_impl.md)
GitHub Issue: [#3](https://github.com/postmelee/Prepped/issues/3)
마일스톤: M010

## 단계 목적

현재 저장소에 아직 존재하지 않는 AWS 백엔드의 아키텍처, API 계약, 배포/IAM 경계를 공식 문서로 고정한다. 동시에 현재 프런트엔드가 유지하고 있는 QR·`/`·`/kiosk` 계약을 백엔드 전환 시에도 깨지 않도록 명시한다.

## 산출물

- [docs/backend-architecture.md](../../docs/backend-architecture.md)
- [docs/api-specification.md](../../docs/api-specification.md)
- [docs/aws-deployment.md](../../docs/aws-deployment.md)
- [mydocs/plans/task_m010_3_impl.md](../plans/task_m010_3_impl.md)

## 본문 변경 정도 / 본문 무손실 여부

이번 단계는 문서화 단계이므로 코드 본문 손실은 없다. 기존 앱의 현재 동작과 새 백엔드의 목표 계약을 분리해서 설명하는 방향으로만 보강했다.

## 검증 결과

실행한 검증:

```bash
test -f docs/backend-architecture.md && test -f docs/api-specification.md && test -f docs/aws-deployment.md && test -f mydocs/plans/task_m010_3_impl.md && echo OK
git diff --check
```

결과:

- 파일 존재 검증: `OK`
- `git diff --check`: 경고/오류 없음

## 잔여 위험

- 현재 저장소에는 아직 `backend/` 구현이 없어서, 이 단계는 계약과 배포 기준의 문서화에 한정된다.
- 현재 프런트 QR 샘플은 로컬 payload를 계속 사용하고 있어, backend/token 계약으로 넘어갈 때 전환 경로를 맞춰야 한다.
- AWS 루트 계정은 준비되어 있지만 IAM 분리가 아직 실제로 구성되지 않았으므로, 초기 배포 전 보안 설정이 필요하다.

## 다음 단계 영향

Stage 1에서 공식 문서가 고정되었으므로, 다음 단계에서는 `backend/` 스캐폴드와 SAM 템플릿, 라우터/핸들러/저장소 테스트를 구현할 수 있다. 배포 단계에서는 IAM 사용자/역할, OIDC, 예산 알림부터 우선 적용한다.

## 승인 요청

Stage 2로 진입할 수 있도록 `backend/` 스캐폴드 구현과 테스트 작성 승인을 요청한다.
