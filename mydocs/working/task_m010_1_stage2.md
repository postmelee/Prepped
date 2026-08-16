# Task M010 #1 Stage 2 완료 보고서

GitHub Issue: [#1](https://github.com/postmelee/Prepped/issues/1)  
구현계획서: [`task_m010_1_impl.md`](../plans/task_m010_1_impl.md)  
Stage: 2

## 단계 목적

`Prepped` 브랜드를 소셜 미리보기와 PWA 아이콘까지 확장하고, 모바일 메뉴 저장·QR 갱신과 키오스크 인식·결제 데모의 핵심 시나리오를 빌드·자동 테스트·브라우저로 검증한다.

## 산출물

| 파일 | 변경 요약 |
|---|---|
| `public/og.png` | 휴대폰 QR과 키오스크 연결을 표현한 1731×909 `Prepped` 소셜 카드로 교체 |
| `public/icon-192.png` | P·QR·트레이 모티프의 192×192 앱 아이콘으로 교체 |
| `public/icon-512.png` | 동일 원본의 512×512 maskable/일반 앱 아이콘으로 교체 |
| `app/kiosk/layout.tsx` | 루트 title template과 중복되던 `Prepped` 접미사를 제거해 최종 title을 한 번만 표시 |
| `tests/rendered-html.test.mjs` | 폐기된 스타터 스켈레톤 테스트를 모바일·키오스크 SSR, manifest와 QR 계약 검증으로 교체 |
| `mydocs/plans/task_m010_1_impl.md` | 실제 대체 흐름을 이미지 업로드가 아닌 샘플 QR로 바로잡고 자동 테스트를 Stage 2 산출물에 반영 |

## 본문 변경 정도 / 본문 무손실 여부

Stage 2의 코드 변경은 키오스크 title 중복 수정과 테스트 교체에 한정된다. QR 생성·파싱, 메뉴 상태와 사용자 인터랙션은 변경하지 않았다. 래스터 자산은 신규 생성물로 전면 교체했으며 `app/layout.tsx`와 manifest가 기대하는 파일명과 크기를 유지했다.

이미지 생성에는 내장 imagegen 방식을 사용했다. OG 프롬프트는 휴대폰의 준비된 메뉴·QR·키오스크 연결과 정확한 `Prepped` 단일 텍스트를 지정했고, 아이콘 프롬프트는 `P`·QR·트레이 모티프와 크림·딥그린·코럴 팔레트를 지정했다.

## 검증 결과

실행 명령:

```bash
npm run build
npm test
file public/og.png public/icon-192.png public/icon-512.png
git diff --check
```

결과:

- OK — vinext build가 `/`, `/kiosk` 두 경로를 포함해 성공했다.
- OK — 모바일 SSR, 키오스크 SSR, PWA·QR 계약 테스트 3개가 모두 통과했다.
- OK — 이미지 규격이 각각 1731×909 RGB, 192×192 RGBA, 512×512 RGBA로 확인됐다.
- OK — `git diff --check`가 경고 없이 통과했다.

브라우저 시나리오:

- OK — 모바일 title이 `Prepped · 내 메뉴 QR`, 접근성 region이 `Prepped 메뉴 QR 앱`으로 확인됐다.
- OK — 매장→버거→1955 버거 선택→선택 목록→저장 후 QR payload가 `mcdonald={101,201,301,103}`으로 갱신됐다.
- OK — 키오스크 title이 `키오스크 QR 스캐너 · Prepped`로 한 번만 표시됐다.
- OK — 카메라 시작 시 권한 대기 상태가 표시되고, 샘플 QR에서 원문 `mcdonald={101,201,301}`과 세 ID, 결제 완료 화면이 확인됐다.
- OK — 모바일과 키오스크 화면이 기존 큰 타이포, 고대비, 명확한 주 행동 구조를 유지했다.

시각 검수:

- OK — OG 카드의 `Prepped` 텍스트가 정확하고 다른 임의 문구·브랜드·워터마크가 없다.
- OK — 아이콘 중심부의 P·QR 모티프가 192px에서도 식별되며 maskable 안전 여백을 확보했다.

## 잔여 위험

- 자동화 브라우저에서는 실제 카메라 권한 승인을 완료하지 못해 실물 휴대폰 QR을 렌즈로 읽는 하드웨어 종단 검증은 남는다. 코드의 권한 요청과 인식 루프, 카메라 없는 샘플 대체 흐름은 확인했다.
- 이미지 생성 원본의 벡터 소스는 없으므로 향후 브랜드 수정은 래스터 자산을 다시 생성해야 한다.

## 다음 단계 영향

- Stage 3에서 기존 Sites 프로젝트에 현재 빌드를 배포하고 프로덕션 `/`, `/kiosk`와 메타데이터를 재확인한다.
- 프로덕션 카메라 동작에는 HTTPS가 필요하며 Sites URL은 이 조건을 충족한다.

## 승인 요청

- 작업지시자가 승인 게이트를 일괄 승인했으므로 Stage 2 산출물과 검증 결과를 승인된 것으로 처리하고 Stage 3로 진행한다.
