# Task M010 #1 Stage 1 완료 보고서

GitHub Issue: [#1](https://github.com/postmelee/Prepped/issues/1)
구현계획서: [`task_m010_1_impl.md`](../plans/task_m010_1_impl.md)
Stage: 1

## 단계 목적

기존 제품명과 스타터 메타데이터를 `Prepped`로 통일하고, 코드와 대화에 분산된 QR·상태·경로·미래 API 경계를 공식 기술 문서로 고정한다.

## 산출물

| 파일 | 변경 요약 |
|---|---|
| `app/page.tsx` | 모바일 앱 접근성 레이블과 제품 표시명을 `Prepped`로 변경 |
| `app/kiosk/page.tsx` | 키오스크 인트로 제품 표시명을 `Prepped`로 변경 |
| `app/kiosk/layout.tsx` | 키오스크 title·description 갱신 |
| `app/layout.tsx` | 기본·템플릿·Apple Web App·Open Graph·Twitter metadata 갱신 |
| `public/manifest.webmanifest` | PWA name과 short name 갱신 |
| `package.json`, `package-lock.json` | 패키지 이름을 `prepped`로 변경하고 설명 추가 |
| `README.md` | 스타터 안내를 실제 제품·경로·QR 계약·검증·현재 범위 안내로 전면 교체 |
| `docs/technical-specification.md` | 제품 목적, 메뉴 모델, QR 문법, 로컬 상태, 스캔·API·PWA·보안 명세 신규 작성 |

## 본문 변경 정도 / 본문 무손실 여부

README는 스타터 문서였으므로 제품 입문 문서로 전면 재작성했다. 앱 코드는 사용자-facing 명칭과 metadata만 변경했고 메뉴 ID, QR serializer/parser, `localStorage` 키, 라우팅과 사용자 동작은 보존했다. 기술 명세는 현재 구현을 기준으로 새로 작성했으며 백엔드 확정 전 계약 경계를 명시했다.

## 검증 결과

실행 명령:

```bash
rg -n "한끼패스|vinext-starter|site-creator-vinext-starter" app public README.md package.json package-lock.json docs
rg -n 'store=\{|/kiosk|localStorage|백엔드' README.md docs/technical-specification.md
git diff --check
```

결과:

- OK — 제품·문서 대상 경로에서 기존 제품명과 스타터 표식이 검색되지 않았다.
- OK — README와 기술 명세에서 QR 형식, `/kiosk`, `localStorage`, 미래 백엔드 경계를 확인했다.
- OK — `git diff --check`가 경고 없이 통과했다.

## 잔여 위험

- 래스터 `public/og.png`에는 텍스트 검색으로 확인할 수 없는 기존 제품명이 남아 있어 Stage 2에서 교체한다.
- 앱 아이콘은 파일명과 크기는 유지되지만 `Prepped` 브랜드 일관성을 Stage 2에서 시각 검수한다.

## 다음 단계 영향

- Stage 2는 확정된 `Prepped` 명칭과 기술 명세를 기준으로 OG·아이콘 자산을 만들고 두 사용자 경로를 빌드·브라우저 검증한다.
- 기존 `localStorage` 키와 QR payload는 변경하지 않는다.

## 승인 요청

- 작업지시자가 승인 게이트를 일괄 승인했으므로 Stage 1 산출물과 검증 결과를 승인된 것으로 처리하고 Stage 2로 진행한다.
