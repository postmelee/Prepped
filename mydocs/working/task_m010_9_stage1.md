# Task M010 #9 Stage 1 완료 보고서

GitHub Issue: [#9](https://github.com/postmelee/Prepped/issues/9)
구현계획서: [`task_m010_9_impl.md`](../plans/task_m010_9_impl.md)
Stage: 1

## 단계 목적

기존 QR 포함 토글을 매장별 공유 행동으로 교체하고, 메인 QR 전체 공유와 공유 URL의 읽기 전용 표시를 구현한다. QR payload 문법과 로컬 저장 메뉴는 유지하면서 URL query와 복사 실패 경계를 독립 모듈로 고정한다.

## 산출물

| 파일 | 변경 요약 |
|---|---|
| `app/lib/qr-share.ts` | QR 그룹 parser·serializer, 매장 추출, 메뉴·매장 집계, `?qr=` URL 생성·읽기, Clipboard/fallback 조정 추가 |
| `tests/qr-share.test.mjs` | 단일·다중 매장, 안전 문자·중복·길이 제한, URL 왕복, Clipboard 실패 fallback 5개 테스트 추가 |
| `app/page.tsx` | 로컬/공유 payload 분리, 전체·맥도날드 링크 복사, 공유받은 QR·잘못된 링크 안내, 내 QR 복귀 구현 |
| `app/globals.css` | 시니어 친화 공유 버튼, 공유 상태 배너, 오류 toast와 기존 카드에 맞춘 반응형 스타일 추가 |

## 본문 변경 정도 / 본문 무손실 여부

기존 메뉴 선택, 설정 조회, 빈 편집 초안, 이탈 확인 모달과 `/kiosk` 코드는 유지했다. 저장 schema는 레거시 `storeEnabled`를 계속 `true`로 기록해 호환성을 보존하지만 UI 토글과 QR 제외 분기는 제거했다. 공유 query는 별도 `sharedPayload`에만 들어가고 `savedIds` 및 저장 effect의 입력이 아니므로 수신 기기의 기존 메뉴를 덮어쓰지 않는다.

## 검증 결과

실행 명령:

```bash
node --test tests/qr-share.test.mjs
npm run lint
npm run build
git diff --check
```

결과:

- OK — 공유 URL 단위 테스트 5/5 통과: 단일·다중 매장 왕복, 매장 추출, 비정상·중복·1,500자 초과 차단, URL encoding, Clipboard fallback을 확인했다.
- OK — ESLint가 오류·경고 없이 통과했다. 기존 모달의 안전 기본 행동 `autoFocus`에는 의도를 설명하는 국소 예외를 추가했다.
- OK — vinext 5단계 빌드가 `/`, `/kiosk` 두 경로를 출력했다.
- OK — `git diff --check`가 공백 오류 없이 통과했다.

## 잔여 위험

- 현재 기준 화면에는 맥도날드 저장 데이터만 있으므로 실제 여러 매장 카드에서의 시각·상호작용 확인은 Issue #7 통합 후에도 재검증이 필요하다.
- 브라우저의 실제 Clipboard 권한과 query 기반 UI는 Stage 3 사용자 시나리오에서 확인한다.

## 다음 단계 영향

- Stage 2는 새 `?qr=` 계약, 비영속 상태와 복사 fallback을 README·기술 명세에 반영한다.
- 렌더링 회귀 테스트는 기존 토글 표식 대신 두 공유 버튼과 공유 query 안전 경계를 검사한다.

## 승인 요청

- 작업지시자가 모든 승인 게이트를 일괄 승인했으므로 Stage 1 산출물과 검증 결과를 승인된 것으로 처리하고 Stage 2로 진행한다.
