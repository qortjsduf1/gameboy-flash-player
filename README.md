# 🎮 FlashBoy - 게임보이 스타일 모바일 플래시 에뮬레이터 플랫폼

> **FlashBoy**는 추억의 플래시 게임(.swf)을 모바일 스마트폰과 PC 웹 브라우저에서 레트로 게임보이 감성으로 즐길 수 있는 **WebAssembly 기반 웹 에뮬레이터 플랫폼**입니다.
> 
> [비드키즈(vidkidz.tistory.com)](https://vidkidz.tistory.com/) 등 플래시 아카이브 블로그의 글 주소나 `.swf` 링크만 붙여넣으면 스마트폰에서 8방향 조이스틱 패드로 즉시 플레이할 수 있습니다.

---

## 🌟 주요 특징 (Key Features)

- 📱 **스마트폰 최적화 레트로 게임보이 UI**: 모바일 터치 화면에 맞춘 대형 LCD 스크린과 슬라이드 조이스틱.
- 🔗 **티스토리 주소 자동 파싱 & SWF 바이너리 파이프라인**: 게시글 URL 입력 시 내부 카카오 CDN/첨부 `.swf` 파일 자동 추출 및 구동.
- 🕹️ **8방향 대각선 동시 입력 조이스틱**: 대각선(↖, ↗, ↙, ↘) 기울임 시 2개 방향키 동시 발송 지원.
- 👊 **게임별 조작키 드롭다운 선택지 맵핑**: 
  - `조이스틱 (방향키 ↔ WASD)` 대칭 전환
  - `A/B 버튼 (Z, X, A, S, Space, Enter, Shift 등)` 드롭다운 선택지 제공
  - **아빠와 나 (방향키 + A/S)** 원터치 추천 설정 프리셋 버튼 탑재.
- 🚀 **스마트폰 CORS 100% 해제 전용 프록시 백엔드**: 모바일 Safari/Chrome 브라우저 보안 차단을 무력화하는 내장 미들웨어 (`/api/proxy`).
- 🔗 **SELECT 🔗 버튼 새 탭 티스토리 연동**: 하단 SELECT 버튼 터치 시 비드키즈 블로그가 새 탭으로 열려 주소 복사 용이.

---

## 🛠️ 프로젝트 구조 (Project Structure)

```text
gameboy-flash-player/
├── index.html        # 게임보이 레트로 하우징, 8방향 조이스틱, 드롭다운 모달
├── styles.css        # 대형 LCD 화면, 3D 슬라이딩 스틱, 모바일 반응형 CSS
├── app.js            # Ruffle WASM 연결, 포커스 자동 고정, 8방향 키 릴레이
├── server.js         # Node.js 전용 CORS 백엔드 프록시 서버 (Port: 8088)
├── api/
│   └── proxy.js      # Vercel Serverless Function 전용 CORS 프록시
├── package.json      # Node 패키지 정의
└── README.md         # 프로젝트 가이드 문서
```

---

## 🚀 로컬 실행 방법 (Local Setup)

```bash
# 1. 저장소 클론 및 이동
git clone https://github.com/YOUR_USERNAME/gameboy-flash-player.git
cd gameboy-flash-player

# 2. 서버 실행
npm start
```

- **PC 접속**: `http://localhost:8088`
- **같은 Wi-Fi 스마트폰 접속**: `http://자신의_내부_IP:8088`

---

## 📤 깃허브(GitHub) 레포지토리 올리는 법

### 1단계: 깃허브에서 새 저장소 생성
1. [GitHub New Repository](https://github.com/new)에 접속합니다.
2. Repository name에 `gameboy-flash-player` 입력 후 **Create repository**를 누릅니다.

### 2단계: 터미널 명령어로 깃허브 커밋 & 푸시
```bash
# 현재 디렉토리 이동
cd /Users/baekseon-yeol/.gemini/antigravity/scratch/gameboy-flash-player

# 깃 저장소 연결 및 커밋 (이미 초기화 완료됨)
git remote add origin https://github.com/본인아이디/gameboy-flash-player.git
git branch -M main
git push -u origin main
```

---

## 🌐 무료 온라인 호스팅 배포 안내 (Vercel)

Vercel을 이용하면 별도의 서버 비용 없이 무료 HTTPS 링크가 생성되어 전 세계 누구든 스마트폰으로 접속할 수 있습니다!

1. [Vercel](https://vercel.com/) 접속 후 GitHub 계정 로그인.
2. `gameboy-flash-player` 레포지토리를 **Import**.
3. **Deploy** 버튼 클릭! (약 15초 소요)
4. 생성된 `https://gameboy-flash-player.vercel.app` 링크로 스마트폰에서 즉시 접속 가능.

---

## 📜 라이선스

MIT License
