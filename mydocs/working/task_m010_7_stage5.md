# Task #7 Stage 5 보고서 — 선택 매장 QR 파싱과 키오스크 메뉴 매칭

GitHub Issue: [#7](https://github.com/postmelee/Prepped/issues/7)
구현계획서: [`task_m010_7_impl.md`](../plans/task_m010_7_impl.md)
Stage: 5

## 단계 목적

키오스크 `/kiosk`에서 먼저 현재 매장을 고르고, 카메라·샘플·수동 입력으로 얻은 QR 원문 중 해당 매장 그룹만 카탈로그 API와 대응한다. 여러 매장 데이터가 같은 QR에 있어도 선택 매장 메뉴만 제품명·가격·옵션으로 표시한다.

## 산출물

| 파일 | 변경 요약 |
|---|---|
| `app/lib/catalog/resolve.ts` | 공용 QR parser로 선택 매장 ID 추출, 중복 제거, 레거시 ID 변환, 20개 제한, 카탈로그 일괄 해석 |
| `app/components/kiosk-store-selector.tsx` | 맥도날드·써브웨이·스타벅스 키오스크 선택 1단계 |
| `app/components/kiosk-menu-result.tsx` | 실제 제품 이미지·이름·변형·가격 유형·커스텀 그룹, unknown ID, 로딩·오류·재시도 표시 |
| `app/kiosk/page.tsx` | 선택 매장 지속 표시, 카메라·다중 매장 샘플·수동 QR 입력, 해석 결과·결제 데모 연결 |
| `app/lib/catalog/storage.ts` | 모바일·키오스크가 공유하는 레거시 숫자 ID 변환 함수 공개 |
| `app/globals.css` | 매장 선택, 수동 입력, 실제 메뉴 결과, 부분 성공·오류, 반응형 키오스크 스타일 |
| `tests/kiosk-qr-flow.test.mjs` | 선택 매장 격리·중복 제거·레거시·형식 오류·빈 그룹·부분 성공·옵션 해석 검증 |
| `tests/rendered-html.test.mjs` | 키오스크 초기 매장 선택과 공용 parser/API/카메라/수동 입력 계약 갱신 |

## 키오스크 처리 흐름

1. 사용자가 맥도날드·써브웨이·스타벅스 중 현재 키오스크 매장을 선택한다.
2. 카메라, 다중 매장 샘플, 또는 수동 QR 문자열 입력으로 원문을 얻는다.
3. `selectStoreMenuIds(raw, storeId)`가 선택 매장 그룹만 추출하고 중복·안전하지 않은 ID를 정리한다.
4. 지원하는 과거 맥도날드 숫자 ID는 현재 안정 ID로 변환한다.
5. `POST /api/catalog/resolve`가 최대 20개 ID를 현재 매장 카탈로그와 대응한다.
6. 정상 메뉴는 제품 정보로 표시하고, 다른 매장 ID·없는 ID는 `unknownMenuIds`로 분리한다.

## 검증 결과

실행 명령:

```bash
npm run test:kiosk
npm run test:mobile
npm run test:contracts
npm test
npm run lint
git diff --check
```

결과:

- OK — 키오스크·카탈로그·QR 계약 12개 테스트 통과
- OK — 모바일 저장·QR 회귀 9개 테스트 통과
- OK — 공용 카탈로그·QR 계약 11개 테스트 통과
- OK — 서버 렌더링 3개 테스트와 vinext `/`, `/kiosk` 빌드 통과
- OK — ESLint 오류·경고 없음
- OK — `git diff --check` 경고 없음

브라우저 확인:

- OK — 초기 화면에서 세 매장 키오스크 선택
- OK — 써브웨이 선택 후 세 매장 샘플 QR에서 `subway-1530-15cm` 한 항목만 복원
- OK — 에그마요 제품 이미지, 15cm, 공식 확인 가격, 빵·치즈·야채·소스·추가 토핑 표시
- OK — 수동 QR의 `missing-menu`를 정상 메뉴와 함께 부분 성공으로 표시
- OK — 선택한 써브웨이 그룹이 없는 QR에서 오류·재시도와 결제 비활성
- OK — 매장 변경 후 같은 QR에서 스타벅스 카페 아메리카노 한 항목만 복원
- OK — HOT, 예상 가격, 사이즈·샷·우유·시럽·휘핑 표시와 결제 완료 연결
- OK — 브라우저 콘솔 오류 없음

## 본문 변경 정도 / 본문 무손실 여부

- `/kiosk` 경로와 `navigator.mediaDevices.getUserMedia` 카메라 흐름을 유지했다.
- QR 정규식 사본을 제거하고 공용 parser를 사용해 모바일·키오스크 계약을 일치시켰다.
- 전체 QR 원문은 화면·오류 분석을 위해 보존하고, API에는 선택 매장 ID만 전달한다.
- 결제는 기존 데모 완료 화면이며 실제 결제·POS 전송을 추가하지 않았다.

## 잔여 위험

- 실제 카메라 권한과 물리 QR 인식은 브라우저 권한·카메라 장치가 있는 환경에서 최종 확인이 필요하다. 이번 브라우저 검증은 권한 전송 없이 샘플·수동 입력 경로로 수행했다.
- 현재 카탈로그에 없는 레거시 `301`, `303`은 선택 매장 ID로 보존되지만 unknown으로 표시된다.
- 옵션은 카탈로그의 변경 가능성만 보여주며, 원문 QR 계약상 구체적인 옵션 선택값을 복원하지 않는다.

## 다음 단계 영향

- Stage 6은 모바일 생성 QR을 키오스크 수동 입력에 넣는 종단 흐름과 전체 문서·배포 설정을 확정한다.
- AWS 카탈로그가 시드되지 않은 환경에서는 로컬 fallback을 사용하며, 운영 배포 순서는 테이블 배포 후 시드, 그 다음 웹 API 환경 변수 연결이다.

## 승인 처리

- Stage 5 산출물과 검증 결과는 작업지시자가 이 스레드에서 PR 생성까지 모든 승인 게이트를 명시적으로 승인했으므로 승인된 것으로 간주하고 Stage 6으로 진행한다.
