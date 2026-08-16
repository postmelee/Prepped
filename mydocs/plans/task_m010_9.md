# Task #9 수행계획서 — 매장별·전체 메뉴 QR 공유 링크 추가

GitHub Issue: [#9](https://github.com/postmelee/Prepped/issues/9)
마일스톤: M010

## 목적

모바일 PWA의 QR을 카메라에 직접 보여주는 방식에 더해 링크로 안전하게 전달할 수 있게 한다. 매장별 공유는 해당 매장의 메뉴 ID만, 전체 공유는 현재 QR의 모든 매장 그룹을 포함하며, 공유받은 링크는 수신 기기의 저장 메뉴를 변경하지 않는 읽기 전용 QR 보기로 동작한다.

## 배경

PR #5에서 매장별 설정 조회·수정과 QR 포함 토글을 제공했지만 QR을 가족이나 다른 기기에 전달할 수단은 없다. 작업지시자는 매장 행의 토글을 공유 버튼으로 바꾸고, 메인 QR에서도 모든 매장의 정보를 담은 링크를 복사하도록 요청했다. Issue #7은 실메뉴 카탈로그와 다중 매장 저장 모델을 병행 구현 중이므로 이번 작업은 기존 `store={ids};store={ids}` 문법을 소비하는 공유 URL 경계만 소유한다.

## 범위

### 포함

- 매장별 포함 토글을 해당 매장 QR 링크 복사 버튼으로 교체
- 메인 QR 카드에 전체 메뉴 링크 복사 행동 추가
- `?qr=<인코딩된 payload>` 공유 URL 생성과 query 검증
- 공유받은 payload를 로컬 저장값과 분리해 QR로 표시
- Clipboard API와 레거시 복사 fallback, 성공·실패 상태 안내
- 단일·다중 매장 payload, 잘못된 query, 길이 제한 회귀 테스트
- README와 공식 기술 명세의 공유 흐름 갱신
- 모바일 브라우저 사용자 시나리오와 기존 키오스크 흐름 검증

### 제외

- 백엔드 단축 URL, 계정·기기 간 동기화
- 실메뉴 카탈로그와 다중 매장 저장 구조 구현
- QR payload 문법 변경
- 키오스크 결제 연동
- 공개 Sites 배포

## 설계 방향

- 공유 URL의 canonical parameter는 `qr` 하나이며 `URLSearchParams`가 payload를 percent-encoding하도록 한다.
- 허용 payload는 `store={id,id}` 그룹을 세미콜론으로 연결한 기존 문법으로 제한하고 최대 길이를 둔다. 유효하지 않은 query는 로컬 QR로 안전하게 돌아가며 안내한다.
- `localPayload`와 `sharedPayload`를 분리하고 `displayPayload = sharedPayload ?? localPayload`로 렌더링한다. 공유 query는 `localStorage` 쓰기 effect의 입력이 되지 않는다.
- 매장별 링크 생성은 전체 payload에서 정확한 store key 그룹만 추출하는 일반 함수로 구현해 #7의 다중 매장 문자열을 그대로 수용한다.
- 메인 QR 카드 전체를 버튼으로 만들지 않고 명확한 `전체 링크 복사` 버튼을 제공한다. 매장 행은 이름·메뉴 요약을 비대화하지 않고 우측에 충분한 터치 영역의 `공유` 버튼을 둔다.
- 선행 PR #2가 열려 있으므로 PR #5가 포함된 `origin/publish/task1`을 적층 base로 사용한다. 최종 PR도 `publish/task1`을 대상으로 하며 PR #2 병합 후 `devel` 재기준화가 필요함을 기록한다.

## 문서 위치 판단

| 파일 | 분류 | 대상 독자 | 선택 위치 | 대안 위치 | 선택 이유 |
|---|---|---|---|---|---|
| `README.md` | 공식 제품·개발 안내 | 사용자·기여자 | 저장소 루트 | `docs/` | 대표 사용 흐름의 공유 기능을 짧게 알리는 위치 |
| `docs/technical-specification.md` | 공식 기술 명세 | 기여자·통합 담당자 | `docs/` | `mydocs/tech/` | 공유 URL 문법·검증·상태 경계는 장기 유지할 제품 계약 |
| `mydocs/plans/task_m010_9*.md` 및 보고서 | 작업 산출물 | 작업지시자·내부 작업자 | `mydocs/` | `docs/` | Hyper-Waterfall 진행·검증 이력이며 제품 공식 문서가 아님 |

## 예상 변경 파일

신규:

- `app/lib/qr-share.ts`
- `tests/qr-share.test.mjs`

수정:

- `app/page.tsx`
- `app/globals.css`
- `README.md`
- `docs/technical-specification.md`
- `tests/rendered-html.test.mjs`

이번 task 산출물:

- `mydocs/orders/20260816.md`
- `mydocs/plans/task_m010_9.md`
- `mydocs/plans/task_m010_9_impl.md`
- `mydocs/working/task_m010_9_stage1.md`
- `mydocs/working/task_m010_9_stage2.md`
- `mydocs/working/task_m010_9_stage3.md`
- `mydocs/report/task_m010_9_report.md`

## 잠정 단계

- **Stage 1 — 공유 URL 계약과 모바일 QR UI**
  - 공유 URL 유틸리티, query 읽기·검증, 매장별·전체 복사 UI와 접근성 상태 구현
  - 단일·다중 매장 URL 왕복, 잘못된 query와 길이 제한 단위 검증
- **Stage 2 — 공식 문서와 회귀 테스트**
  - README·기술 명세·렌더링 계약 테스트 갱신
  - 기존 메뉴 편집·저장 분리·키오스크 parser 회귀 검증
- **Stage 3 — 브라우저 시나리오와 통합 검증**
  - 모바일에서 매장별·전체 복사, 공유 링크 열기, 로컬 설정 보존 확인
  - 전체 테스트·빌드·diff 무결성 확인과 PR 증거 정리

## 검증 계획

### 단계별 검증

- Stage 1
  - `node --test tests/qr-share.test.mjs`
  - `npm run build`
  - `git diff --check`
- Stage 2
  - `npm test`
  - `npm run build`
  - `git diff --check`
- Stage 3
  - 브라우저에서 매장별 링크 복사와 query payload 확인
  - 브라우저에서 전체 링크 복사·열기 후 공유 QR 표시와 기존 저장 메뉴 보존 확인
  - 키오스크 샘플 QR의 원문·메뉴 ID·결제 흐름 확인
  - `npm test`
  - `npm run build`
  - `git diff --check origin/publish/task1...HEAD`

### 통합 검증

- 매장별 링크는 해당 store 그룹만 포함하고 전체 링크는 표시 중인 모든 그룹을 포함한다.
- 유효한 공유 query는 QR을 바꾸지만 로컬 저장값을 변경하지 않는다.
- 유효하지 않거나 길이 제한을 넘은 query는 적용되지 않고 사용자에게 안내된다.
- 복사 실패 시 fallback과 접근 가능한 상태 메시지가 제공된다.
- 기존 메뉴 편집 초안 보호와 `/kiosk` parser 흐름이 유지된다.
- `git status --short`가 PR 준비 전 빈 출력이다.
- `git diff --check`가 경고 없이 통과한다.

## 리스크

- **#7과 동일 화면 충돌**: 이번 PR을 작은 공유 경계로 제한하고 `app/lib/qr-share.ts`를 독립시켜 #7이 UI를 재구성해도 재사용할 수 있게 한다.
- **Clipboard 권한 차이**: 보안 컨텍스트의 Clipboard API를 우선하고 textarea 기반 fallback을 제공한다.
- **URL 주입과 과대 payload**: 허용 store/id 문자와 그룹 문법을 검증하고 payload 길이를 제한한다.
- **공유 상태의 로컬 오염**: query payload는 별도 state로만 보관하고 저장 effect에는 연결하지 않는다.
- **적층 PR**: base `publish/task1`을 명시하고 선행 PR #2 병합 뒤 `devel` 재기준화가 필요함을 PR에 기록한다.

## 승인 요청 사항

- 작업지시자는 이 수행계획, `?qr=` URL 계약, 공유 상태의 비영속 정책, #7과의 범위 분리, 공개 배포 제외 및 task-start부터 PR 생성까지의 승인 게이트를 명시적으로 일괄 승인했다.
- 승인에 따라 별도 대기 없이 구현계획서 작성과 Stage 1로 진행한다.
