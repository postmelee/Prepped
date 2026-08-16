# Task M010 #4 수행계획서

GitHub Issue: [#4](https://github.com/postmelee/Prepped/issues/4)
마일스톤: M010

## 목적

모바일 PWA에 `내 설정 메뉴` 화면과 하단 탐색 항목을 추가한다. 사용자는 매장별로 저장한 메뉴, 총액, QR 포함 여부를 한 화면에서 확인하고 기존 메뉴 생성 흐름으로 바로 수정할 수 있어야 한다.

기존 로컬 저장 키와 QR payload 문법은 유지해 이미 저장한 맥도날드 조합과 키오스크 인식 흐름을 깨뜨리지 않는다.

## 배경

현재 모바일 앱은 `내 QR`과 `메뉴 만들기`만 제공한다. 저장한 메뉴를 다시 확인하려면 생성 흐름에 들어가야 하며, 매장별 설정 상태를 비교할 독립 화면이 없다. 이슈 #1과 PR #2에서 확정한 Prepped 기술 명세와 모바일 UI를 선행 기준으로 사용한다.

PR #2가 아직 `devel`에 병합되지 않았으므로 이번 타스크는 `local/task1`에서 분기한 스택 브랜치로 수행한다. 게시 PR은 우선 `publish/task1`을 기준으로 만들어 선행 변경을 diff에서 제외하고, PR #2 병합 후 `devel`로 기준 브랜치를 바꿀 수 있게 한다.

## 범위

### 포함

- `내 QR`, `메뉴 만들기`, `내 설정`의 3개 하단 탐색과 각 아이콘
- 맥도날드 저장 메뉴 이름·가격·개수·총액·QR 포함 상태를 보여주는 설정 카드
- 서브웨이의 미설정·준비 중 카드
- 맥도날드 `메뉴 바꾸기`에서 기존 3단계 생성 흐름으로 이동
- 기존 저장 데이터와 QR payload 호환성 유지
- README와 공식 기술 명세, 자동 테스트 갱신
- 모바일 브라우저 시나리오와 기존 키오스크 회귀 검증
- 기존 Sites 프로젝트의 새 version 저장과 공개 게시 준비
- 공개 Sites version 게시 자체는 확인된 접근 수준을 명시한 별도 승인 후 수행

### 제외

- 백엔드·계정·기기 간 동기화
- 실데이터 메뉴 API와 서브웨이 메뉴 선택
- 키오스크 결제 연동
- QR payload 문법과 `localStorage` 키 변경

## 설계 방향

- 기존 단일 페이지의 탭 상태를 `qr | create | settings`로 확장하고 화면 간 이동은 하단 탐색에서 담당한다.
- 설정 화면은 현재 mock 매장 목록을 카드로 표현한다. 맥도날드는 실제 저장 상태를 계산하고, 아직 선택할 수 없는 서브웨이는 준비 중 빈 상태를 표시한다.
- 메뉴 이름과 가격은 QR에 복제하지 않고 기존 mock 메뉴 ID를 조회해 화면에서 계산한다.
- `onemeal-menu-v1`, `mcdonald={...}`, `menu={}` 계약을 그대로 유지한다.
- 아이콘은 추가 이미지 파일 없이 기존 CSS 기반 아이콘 체계에 맞춰 구현한다.
- 큰 글자, 44px 이상의 터치 영역, `aria-current`와 명확한 색 대비를 유지한다.

## 문서 위치 판단

| 파일 | 분류 | 대상 독자 | 선택 위치 | 대안 위치 | 선택 이유 |
|---|---|---|---|---|---|
| `docs/technical-specification.md` | 공식 기술 명세 | 기여자·외부 통합 담당자 | `docs/` | `mydocs/` | 사용자 표면과 상태 계약의 제품 기준이므로 공식 문서에 반영 |
| `README.md` | 제품 입문 문서 | 사용자·기여자 | 저장소 루트 | `docs/` | 경로와 핵심 기능을 처음 보는 독자의 진입점 유지 |
| `mydocs/*task_m010_4*` | 작업 산출물 | 내부 작업자 | `mydocs/` | `docs/` | 승인·단계·최종 보고 기록이므로 운영 문서 영역 유지 |

## 예상 변경 파일

신규:

- `mydocs/plans/task_m010_4.md`
- `mydocs/plans/task_m010_4_impl.md`
- `mydocs/working/task_m010_4_stage1.md`
- `mydocs/working/task_m010_4_stage2.md`
- `mydocs/working/task_m010_4_stage3.md`
- `mydocs/report/task_m010_4_report.md`

수정:

- `app/page.tsx`
- `app/globals.css`
- `tests/rendered-html.test.mjs`
- `docs/technical-specification.md`
- `README.md`
- `mydocs/orders/20260816.md`

이번 task 산출물:

- `mydocs/orders/20260816.md`
- `mydocs/plans/task_m010_4.md`
- `mydocs/plans/task_m010_4_impl.md`
- `mydocs/working/task_m010_4_stage{N}.md`
- `mydocs/report/task_m010_4_report.md`

## 잠정 단계

- **Stage 1 — 매장별 설정 화면과 탐색 구현**
  - 세 번째 탭, 하단 아이콘, 매장 설정 카드와 수정 진입 구현
  - 저장 ID 조회, 가격 합계, QR 포함 상태와 기존 계약 보존 확인
- **Stage 2 — 문서·자동 테스트·사용자 시나리오 검증**
  - README·기술 명세·SSR/계약 테스트 갱신
  - 모바일 화면 전환과 저장·QR 갱신, 키오스크 회귀를 브라우저에서 확인
- **Stage 3 — 배포 버전 저장과 통합 검증**
  - 기존 Sites 프로젝트에 검증된 소스를 version 3으로 저장
  - 공개 게시 안전 게이트와 현재 프로덕션 version을 기록하고 PR 준비

## 검증 계획

### 단계별 검증

- Stage 1
  - `npm run build`
  - `git diff --check`
  - 소스에서 기존 저장 키와 QR serializer 유지 확인
- Stage 2
  - `npm test`
  - `npm run build`
  - 브라우저에서 내 설정 → 메뉴 바꾸기 → 저장 → QR 확인 시나리오
  - `/kiosk` 샘플 QR 회귀 확인
- Stage 3
  - Sites version 3의 source SHA 확인
  - 현재 공개 프로덕션 version과 게시 대기 상태 확인
  - `git diff --check origin/publish/task1...HEAD`

### 통합 검증

- 이슈 #4의 모든 수용 기준을 충족한다.
- 기존 `onemeal-menu-v1` 데이터와 QR serializer/parser 계약을 유지한다.
- 하단 탐색의 현재 항목이 접근성 속성으로 식별된다.
- `git status --short`가 PR 준비 전 빈 출력이다.
- `git diff --check`가 경고 없이 통과한다.

## 리스크

- **선행 PR 미병합**: 스택 PR로 선행 변경을 diff에서 제외하고 PR #2 병합 후 base를 `devel`로 전환한다.
- **단일 매장 상태**: 현재 선택 가능한 mock은 맥도날드뿐이므로 서브웨이는 준비 중 빈 상태로 명확히 표현하고 다중 매장 저장 구조 변경은 API 설계 후로 미룬다.
- **로컬 데이터 호환성**: 저장 구조를 바꾸지 않고 기존 ID 배열에서 화면 표시용 데이터를 파생한다.
- **하단 탐색 밀도**: 세 항목 레이블이 모바일 폭에서 읽히도록 짧은 레이블과 균등 열, 충분한 터치 높이를 사용한다.
- **공개 배포 승인**: 기존 Sites가 `public`이므로 version 3의 프로덕션 게시는 접근 수준을 명시한 별도 승인 전에는 수행하지 않는다.

## 승인 요청 사항

- 사용자가 이슈 등록부터 PR 생성까지 모든 Hyper-Waterfall 승인 게이트를 명시적으로 일괄 승인했다.
- 위 범위, `docs/` 문서 위치, 스택 PR 전략, 3단계 구성은 승인된 것으로 처리하고 구현계획서 작성과 Stage 1로 진행한다.

승인에 따라 `task_m010_4_impl.md`에서 단계별 산출물, 검증 명령, 커밋 메시지를 구체화한다.
