# 🎮 FlashBoy (플래시보이) - 모바일 레트로 플래시 에뮬레이터 플랫폼

> **"모바일 웹 브라우저에서도 8방향 아날로그 패드로 2000년대 추억의 티스토리 플래시 게임을 100% 플레이한다!"**  
> WebAssembly(Ruffle) 기반의 웹 에뮬레이터와 Node.js Serverless CORS Proxy를 결합한 모바일 최적화 웹 에뮬레이션 플랫폼입니다.

---

## 📌 1. 프로젝트 개요 (Overview)

어도비 플래시(Adobe Flash)의 지원 중단(EOL)과 카카오 CDN의 엄격한 CORS 보안 정책으로 인해, 모바일 기기(아이폰/안드로이드)에서는 티스토리나 비드키즈 같은 추억의 플래시 게임을 더 이상 원활히 즐길 수 없게 되었습니다.

**FlashBoy**는 이 문제를 해결하기 위해 **서버리스 CORS 우회 파이프라인**과 **8방향 터치 아날로그 조이스틱 패드**, 그리고 **드롭다운 키 맵핑 시스템**을 구축하여 모바일 웹 환경에서도 100% 매끄러운 플래시 플레이 경험을 제공합니다.

---

## 🛠️ 2. 기술 스택 (Tech Stack)

| 구분 | 기술 / 라이브러리 | 사용 목적 |
| :--- | :--- | :--- |
| **Frontend** | HTML5, CSS3 (Vanilla), JavaScript (ES6+) | 레트로 게임보이 UI, 8방향 터치 패드 구현 |
| **Emulator** | [Ruffle](https://ruffle.rs/) (WebAssembly / Rust) | 브라우저 내 SWF 바이너리 실행 엔진 |
| **Backend** | Node.js Serverless Functions | 카카오 CDN CORS 우회 및 SWF 파싱 바이너리 스트리밍 |
| **Platform** | Vercel Serverless Hosting | 100% 무료 글로벌 Edge 배포 및 HTTPS 엔드포인트 제공 |
| **VCS** | Git, GitHub | 버전을 관리하고 커스텀 아키텍처 버전 제어 |

---

## 💡 3. 핵심 아키텍처 및 엔지니어링 문제 해결 (Engineering Story)

본 프로젝트는 단순한 UI 입히기를 넘어 **브라우저 보안 한계 극복, WASM 포커스 제어, 서버리스 라우팅 최적화** 과정에서 다양한 엔지니어링 문제를 해결했습니다.

```
[사용자 스마트폰 / PC]
       │
       ▼ (티스토리 글 URL 입력)
[FlashBoy 프론트엔드 (Vercel Static)]
       │
       ▼ (CORS 차단 방지 요청)
[Vercel Node.js Serverless Proxy (/api/proxy)]
       │
       ▼ (Referer: tistory.com 헤더 주입 수신)
[카카오 CDN / 티스토리 서버 (blog.kakaocdn.net)]
       │
       ▼ (SWF ArrayBuffer 바이너리 전송)
[Blob Object URL (URL.createObjectURL)] ──► [Ruffle WASM Canvas 렌더링]
```

### 🔴 문제 1: 카카오 CDN(blog.kakaocdn.net)의 CORS 보안 차단 및 SWF 다운로드 실패
* **원인**: 브라우저 동일 출처 정책(SOP)과 카카오 CDN 서버가 외부 도메인에서의 `tfile.swf` 직접 `fetch()` 요청을 `403 Forbidden` 또는 `CORS Error`로 100% 차단함.
* **기술적 결정 (Why)**:
  * 무료 공용 CORS 프록시(allorigins, corsproxy 등) 역시 카카오 서버에서 모두 IP 차단됨.
  * Node.js 백엔드 서버리스 함수(`/api/proxy.js`)를 구축하여 서버 대 서버 통신으로 `Referer: tistory.com` 및 iPhone User-Agent 헤더를 정밀하게 주입하여 바이너리를 수신하도록 설계함.
* **바이너리 주입 최적화**:
  * Ruffle 엔진에 직접 URL을 넘기면 브라우저가 직접 SWF를 요청하다가 다시 CORS 오류가 발생하므로, 백엔드에서 받아온 바이너리를 `ArrayBuffer` ➔ `Blob Object URL` (`URL.createObjectURL(blob)`)로 변환하여 Ruffle에 통과시키는 100% 무결점 바이너리 로딩 파이프라인을 구축함.

---

### 🟡 문제 2: 모바일 터치 패드의 Keydown/Keyup 파이프라인 및 포커스 이탈
* **원인**: 모바일 브라우저 환경에서 터치 조이스틱이나 버추얼 버튼을 누르면 캔버스 포커스가 해제되면서 가상 키보드 이벤트(`KeyboardEvent`)가 Ruffle 캔버스 내부로 전달되지 않는 문제 발생.
* **기술적 결정 (Why)**:
  * `keepCanvasFocused()` 함수를 설계하여 조이스틱 터치 및 A/B 버튼 액션 시 `preventScroll: true` 옵션과 함께 캔버스 포커스를 자동 유지시킴.
  * 360도 아날로그 각도 수식(`Math.atan2(deltaY, deltaX)`)을 이용한 **8방향(상/하/좌/우/대각선 4방향) 벡터 판정 알고리즘**을 구현하여, 사용자가 손가락을 떼지 않고 슬라이딩해도 정확한 방향키 키 입력이 연속 반영되도록 설계.

---

### 🔵 문제 3: Vercel Serverless Function의 500 / 404 라우팅 충돌
* **원인**: Vercel에 정적 `index.html`과 `api/proxy.js` 함수가 공존할 때, 루트 `/` 진입 요청을 Vercel이 서버리스 함수로 잘못 분기시켜 `FUNCTION_INVOCATION_FAILED (500 Internal Server Error)`가 발생하는 빌드 파이프라인 충돌.
* **기술적 결정 (Why)**:
  * `vercel.json` 빌드 명세를 작성하여 정적 에셋(`index.html`, `styles.css`, `app.js`)은 `@vercel/static`으로, API 엔드포인트(`/api/proxy`)는 `@vercel/node`로 명시적 분리 렌더링하도록 아키텍처를 고도화함.

---

## 🎮 4. 주요 기능 (Features)

1. **8방향 아날로그 터치 조이스틱**:
   * 대각선 이동(↖, ↗, ↙, ↘) 완벽 지원 및 터치 햅틱 반응(Vibration API) 제공.
2. **커스텀 조작키 드롭다운 맵핑 시스템**:
   * A/B 버튼과 조이스틱(방향키 ↔ WASD)을 사용자가 원하는 자판으로 유연하게 교체 가능.
   * *'아빠와 나'*(방향키 + A/S키) 등 인기 플래시 게임 1초 원터치 프리셋 버튼 제공.
3. **📖 팝업 사용방법 안내서**:
   * 티스토리 게임 글 주소를 가져오는 법부터 10초 대기 구동 방식까지 한눈에 확인 가능한 레트로 가이드 팝업 수록.
4. **로컬 SWF 지원**:
   * 내 스마트폰이나 PC에 보관 중인 단일 `.swf` 파일도 직접 선택하여 100% 실행 가능.

---

## 📱 5. 서비스 링크 (Live Demo)

* **배포 주소**: [https://gameboy-flash-player.vercel.app](https://gameboy-flash-player.vercel.app)
* **GitHub 저장소**: [https://github.com/qortjsduf1/gameboy-flash-player](https://github.com/qortjsduf1/gameboy-flash-player)

---

## 📜 6. 라이선스 (License)

이 프로젝트는 MIT 라이선스에 따라 자유롭게 이용 및 수정이 가능합니다.
