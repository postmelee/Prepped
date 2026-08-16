# Prepped

시니어 사용자가 키오스크 앞에서 메뉴를 처음부터 찾지 않도록, 자주 먹는 메뉴 조합을 휴대폰에서 QR로 미리 준비하는 PWA입니다. 노트북용 키오스크 화면은 카메라로 QR을 읽고 현재 단계에서는 QR 원문과 메뉴 ID를 보여줍니다.

## 화면

- `/` — 모바일 메뉴 QR PWA
  - 내 QR 보기와 모든 매장 링크 복사
  - 매장별 메뉴 QR 링크 복사와 공유받은 QR 보기
  - 매장 → 카테고리 → 메뉴의 3단계 선택
  - 선택 목록 확인, 저장, QR 즉시 갱신
  - `내 설정`에서 매장별 저장 메뉴·합계 확인과 수정
- `/kiosk` — 노트북 키오스크 데모
  - 카메라 QR 스캔
  - QR 원문과 매장·메뉴 ID 표시
  - 샘플 QR로 카메라 없이 흐름 확인

## QR 계약

한 매장은 `store={menuId,menuId}` 형식으로 직렬화하고 여러 매장은 세미콜론으로 구분합니다.

```text
mcdonald={101,201,301}
mcdonald={101,201};subway={401,402}
```

`전체 링크 복사`는 현재 QR의 모든 매장 그룹을, 매장 카드의 `공유`는 해당 매장 그룹만 `?qr=` query에 URL encoding해 복사합니다. 공유 링크를 연 기기에서는 링크의 QR을 읽기 전용으로 보여주며 기존 저장 메뉴를 바꾸지 않습니다.

백엔드 API가 확정되기 전까지 키오스크는 QR 문자열을 파싱해 매장 키와 메뉴 ID를 표시합니다. 메뉴 조합은 브라우저 `localStorage`에만 저장되며 서버 또는 다른 기기로 동기화되지 않습니다. 공유 링크는 메뉴 ID가 포함된 공개 가능한 전달 수단이며 비밀 토큰이 아닙니다.

상세 계약과 후속 API 경계는 [기술 명세](docs/technical-specification.md)를 참고하세요.

## 로컬 실행

요구 사항: Node.js `>=22.13.0`

```bash
npm install
npm run dev
```

개발 서버가 안내하는 주소에서 `/`와 `/kiosk`를 엽니다. 노트북 카메라는 브라우저 권한과 보안 컨텍스트가 필요합니다.

## 검증

```bash
npm run build
npm test
npm run lint
```

## 기술 구성

- React 19, TypeScript
- vinext/Vite 기반 Next.js 호환 라우팅
- `qrcode` — QR 생성
- `jsqr` — 카메라 프레임 QR 인식
- Web App Manifest, Service Worker, `localStorage`
- OpenAI Sites 배포 설정: `.openai/hosting.json`

## 현재 범위

맥도날드 mock 메뉴만 제공하며 백엔드, 사용자 계정, 서버 저장, 실제 결제는 포함하지 않습니다. `/kiosk`의 결제 버튼은 사용자 흐름을 보여주는 데모입니다.

프로젝트 운영은 [Hyper-Waterfall](https://github.com/postmelee/hyper-waterfall) v0.3.0 규칙을 따릅니다.
