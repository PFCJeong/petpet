# 서버 개발자를 위한 프론트엔드/데스크톱 앱 설명

> "이게 도대체 어떻게 돌아가는 거야?"에 대한 답변

## 서버 vs 이 앱의 비교

```
┌─────────────────────────────────────────────────────────────────┐
│                      서버 개발 (익숙한 것)                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   클라이언트 요청                                                │
│         ↓                                                       │
│   [Spring/Express/Django 서버]                                  │
│         ↓                                                       │
│   DB 조회, 비즈니스 로직                                         │
│         ↓                                                       │
│   JSON 또는 HTML 응답                                            │
│         ↓                                                       │
│   브라우저가 렌더링                                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      이 앱 (지금 보는 것)                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   사용자가 앱 실행                                               │
│         ↓                                                       │
│   [Tauri] 창을 띄우고 내장 브라우저(WebView) 실행                 │
│         ↓                                                       │
│   WebView가 HTML/JS 로드 (서버 없이, 파일에서 직접)               │
│         ↓                                                       │
│   [React]가 화면 구성                                            │
│         ↓                                                       │
│   [Phaser]가 캔버스에 고양이 그림                                 │
│         ↓                                                       │
│   사용자 눈에 고양이가 보임                                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 핵심 개념: "서버가 없다"

서버 개발할 때는:
```
클라이언트 → HTTP 요청 → 서버 → DB → 응답 → 클라이언트
```

이 앱은:
```
앱 실행 → 로컬 파일 로드 → 끝!
```

**서버가 필요 없습니다.** 모든 코드가 사용자 컴퓨터에서 실행됩니다.

---

## 1. Tauri가 뭐야?

### 서버 개발자 비유

```
Tauri = "내장 웹서버 + 브라우저"를 하나로 묶은 것
```

Spring Boot로 치면:
```java
// 이런 느낌이라고 생각하면 됨 (실제 코드 아님)
public class TauriApp {
    public static void main(String[] args) {
        // 1. 내장 톰캣처럼 웹서버 시작
        EmbeddedWebServer server = new EmbeddedWebServer();
        server.serveStaticFiles("./dist");  // HTML, JS, CSS

        // 2. 브라우저 창 열기 (크롬 같은 거)
        NativeWindow window = new NativeWindow();
        window.setSize(200, 200);
        window.setTransparent(true);
        window.loadUrl(server.getUrl());  // localhost:1420

        window.show();
    }
}
```

### 실제로 Tauri가 하는 일

```
┌────────────────────────────────────────────┐
│              Tauri 앱 실행                  │
│                                            │
│  1. 네이티브 창 생성                        │
│     - 200x200 픽셀                         │
│     - 투명 배경                            │
│     - 항상 최상위                           │
│                                            │
│  2. WebView (내장 브라우저) 생성            │
│     - macOS: Safari 엔진 (WebKit)          │
│     - Windows: Edge 엔진 (Chromium)        │
│                                            │
│  3. HTML 파일 로드                          │
│     - 개발: http://localhost:1420          │
│     - 배포: 앱 내부에 번들된 파일            │
│                                            │
└────────────────────────────────────────────┘
```

### Electron과의 차이

```
Electron = Node.js + Chromium 통째로 포함 (100MB+)
Tauri = Rust + OS의 WebView 사용 (10MB 미만)
```

---

## 2. React가 뭐야?

### 서버 개발자 비유

```
React = "실시간으로 변하는 HTML 템플릿"
```

서버에서 JSP/Thymeleaf 쓸 때:
```html
<!-- 서버에서 한 번 렌더링하고 끝 -->
<div>안녕하세요, ${user.name}님</div>
```

React는:
```jsx
// 브라우저에서 실행, 값이 바뀌면 자동으로 다시 그림
function Greeting() {
    const [name, setName] = useState("원식");

    return <div>안녕하세요, {name}님</div>;
    // name이 바뀌면 자동으로 화면도 바뀜!
}
```

### 이 앱에서 React가 하는 일

**솔직히 말하면, 거의 안 함.**

```tsx
// src/App.tsx - React가 하는 일 전부
function App() {
    useEffect(() => {
        // Phaser 게임 시작시켜!
        new Phaser.Game(config);
    }, []);

    return <div id="game-container" />;  // 빈 div 하나 만들기
}
```

React는 그냥 Phaser를 시작시키는 역할만 합니다.
나중에 설정 화면, 메뉴 등을 추가하면 React가 더 많은 일을 하게 됩니다.

---

## 3. Phaser가 뭐야?

### 서버 개발자 비유

```
Phaser = "무한 루프 돌면서 화면 그리는 엔진"
```

서버에서 스케줄러 돌릴 때:
```java
@Scheduled(fixedRate = 16)  // 16ms마다 = 초당 60번
public void process() {
    // 뭔가 처리
}
```

Phaser도 비슷:
```
초당 60번 (60 FPS):
    1. 입력 체크 (마우스, 키보드)
    2. 게임 로직 업데이트
    3. 화면 다시 그리기
```

### 게임 루프 개념

```
┌─────────────────────────────────────────────────────┐
│                    게임 루프                         │
│                                                     │
│   ┌──────────┐    ┌──────────┐    ┌──────────┐     │
│   │  Input   │ →  │  Update  │ →  │  Render  │     │
│   │  입력    │    │  로직    │    │  그리기  │     │
│   └──────────┘    └──────────┘    └──────────┘     │
│        ↑                                ↓          │
│        └────────────────────────────────┘          │
│                   16ms마다 반복                     │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### 이 앱에서 Phaser가 하는 일

```typescript
// 1. 이미지 로드 (서버의 static resource 같은 것)
preload() {
    this.load.spritesheet('cat', '/assets/sleepingcat1.png', {
        frameWidth: 64,
        frameHeight: 64
    });
}

// 2. 게임 오브젝트 생성 (서버의 초기화 같은 것)
create() {
    this.pet = this.add.sprite(100, 100, 'cat');
    this.pet.play('sleep');
}

// 3. 매 프레임마다 실행 (스케줄러처럼)
update() {
    // 여기서 이동, 충돌 체크 등
    // 현재 이 앱에선 안 씀
}
```

---

## 4. 스프라이트 시트가 뭐야?

### 서버 개발자 비유

```
스프라이트 시트 = "여러 이미지를 하나의 파일로 합친 것"
```

서버에서 여러 API를 하나로 합치는 것처럼:
```
❌ 비효율: GET /image1, GET /image2, GET /image3 (요청 3번)
✅ 효율:   GET /images (한 번에 다 가져옴)
```

이미지도 마찬가지:
```
❌ 비효율: cat1.png, cat2.png, cat3.png (파일 6개 로드)
✅ 효율:   cat-spritesheet.png (파일 1개에 6프레임)
```

### sleepingcat1.png 구조

```
┌─────────────────────────────────────────────────────┐
│  sleepingcat1.png (384 x 64 픽셀)                   │
├────────┬────────┬────────┬────────┬────────┬────────┤
│ frame0 │ frame1 │ frame2 │ frame3 │ frame4 │ frame5 │
│ 64x64  │ 64x64  │ 64x64  │ 64x64  │ 64x64  │ 64x64  │
│   😺   │   😺   │   😺   │   😺   │   😺   │   😺   │
│  zzz   │  zzZ   │  zZZ   │  ZZZ   │  zZZ   │  zzZ   │
└────────┴────────┴────────┴────────┴────────┴────────┘
     ↑
     프레임 0, 1, 2, 3, 4, 5를 순서대로 보여주면 → 애니메이션!
```

### 코드로 보면

```typescript
// 1. "이 이미지는 64x64 단위로 잘라서 써" 라고 알려줌
this.load.spritesheet('cat', 'sleepingcat1.png', {
    frameWidth: 64,   // 한 프레임 가로
    frameHeight: 64   // 한 프레임 세로
});

// 2. "0번부터 5번까지 프레임을 순서대로 보여줘" (애니메이션 정의)
this.anims.create({
    key: 'sleep',
    frames: this.anims.generateFrameNumbers('cat', { start: 0, end: 5 }),
    frameRate: 6,  // 초당 6프레임
    repeat: -1     // 무한 반복
});

// 3. 애니메이션 재생!
this.pet.play('sleep');
```

---

## 5. 전체 실행 흐름 (상세)

### npm run tauri dev 실행하면?

```
터미널에서: npm run tauri dev
                ↓
┌─────────────────────────────────────────────────────────────┐
│ Step 1: Vite 개발 서버 시작                                  │
│                                                             │
│   - localhost:1420에서 파일 서빙                             │
│   - 파일 변경 감지 (Hot Module Replacement)                  │
│   - TypeScript → JavaScript 변환                            │
│                                                             │
│   서버 개발로 치면: nodemon + babel 같은 역할                 │
└─────────────────────────────────────────────────────────────┘
                ↓
┌─────────────────────────────────────────────────────────────┐
│ Step 2: Tauri가 Rust 코드 컴파일                             │
│                                                             │
│   - cargo build 실행                                        │
│   - target/debug/app 바이너리 생성                          │
│                                                             │
│   서버 개발로 치면: go build, javac 같은 역할                 │
└─────────────────────────────────────────────────────────────┘
                ↓
┌─────────────────────────────────────────────────────────────┐
│ Step 3: 네이티브 앱 실행                                     │
│                                                             │
│   - 200x200 투명 창 생성                                    │
│   - WebView 생성                                            │
│   - localhost:1420 로드                                     │
│                                                             │
│   서버 개발로 치면: java -jar app.jar 실행하는 것과 비슷      │
└─────────────────────────────────────────────────────────────┘
                ↓
┌─────────────────────────────────────────────────────────────┐
│ Step 4: 브라우저(WebView)가 HTML 로드                        │
│                                                             │
│   index.html                                                │
│       ↓                                                     │
│   <script src="/src/main.tsx">                              │
│       ↓                                                     │
│   main.tsx 실행                                             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                ↓
┌─────────────────────────────────────────────────────────────┐
│ Step 5: React 앱 시작                                        │
│                                                             │
│   ReactDOM.createRoot().render(<App />)                     │
│       ↓                                                     │
│   App 컴포넌트의 useEffect 실행                              │
│       ↓                                                     │
│   new Phaser.Game(config)                                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                ↓
┌─────────────────────────────────────────────────────────────┐
│ Step 6: Phaser 게임 시작                                     │
│                                                             │
│   PetScene.preload()  →  이미지 로드                        │
│       ↓                                                     │
│   PetScene.create()   →  고양이 스프라이트 생성, 애니메이션   │
│       ↓                                                     │
│   게임 루프 시작 (60 FPS)                                    │
│       ↓                                                     │
│   화면에 움직이는 고양이 표시!                                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 6. 파일별 역할 정리

### 서버 프로젝트와 비교

```
서버 프로젝트                    이 프로젝트
─────────────────────────────────────────────────────
pom.xml / build.gradle    →    package.json (의존성)
application.yml           →    tauri.conf.json (설정)
src/main/java/Main.java   →    src-tauri/src/main.rs (진입점)
src/main/resources/       →    public/ (정적 파일)
Controller                →    없음 (서버 없으니까)
Service                   →    src/game/PetScene.ts (로직)
templates/                →    src/App.tsx (화면)
```

### 각 파일의 한 줄 설명

| 파일 | 역할 |
|------|------|
| `package.json` | npm 의존성 (Spring의 pom.xml) |
| `tauri.conf.json` | 창 크기, 투명도 등 앱 설정 |
| `src-tauri/src/main.rs` | Rust 진입점 (앱 시작) |
| `index.html` | 빈 HTML (React가 여기에 그림) |
| `src/main.tsx` | React 시작점 |
| `src/App.tsx` | Phaser 게임 초기화 |
| `src/game/PetScene.ts` | **핵심!** 고양이 로직 전부 |
| `public/assets/` | 이미지 파일들 |

---

## 7. 자주 하는 질문

### Q: 서버 없이 어떻게 이미지를 로드해?

```
개발 중: Vite 개발 서버가 public/ 폴더를 서빙
배포 후: 이미지가 앱 바이너리 안에 포함됨 (JAR 안에 resources 넣는 것처럼)
```

### Q: 상태 관리는 어떻게 해?

```
서버: DB에 저장, 세션에 저장
이 앱: JavaScript 변수에 저장 (메모리)
      → 껐다 키면 초기화됨
      → 저장하려면 파일이나 localStorage 사용
```

### Q: API 호출은 어떻게?

```typescript
// 일반 fetch로 가능
const response = await fetch('https://api.example.com/data');

// Tauri 명령어로 Rust 함수 호출도 가능
import { invoke } from '@tauri-apps/api/core';
const result = await invoke('my_rust_function', { arg1: 'value' });
```

### Q: 이벤트 처리는?

```
서버: HTTP 요청이 오면 처리
이 앱: 마우스/키보드 이벤트가 오면 처리

// Phaser 이벤트 리스너
this.pet.on('pointerdown', () => {
    console.log('고양이 클릭됨!');
});

// 서버의 @PostMapping("/click") 같은 느낌
```

---

## 요약

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│   Tauri  = 앱을 감싸는 껍데기 (창, OS 기능)          │
│                                                     │
│   React  = 화면 구조 담당 (현재는 거의 안 씀)        │
│                                                     │
│   Phaser = 고양이 그리고 움직이는 엔진               │
│                                                     │
│   서버?  = 없음! 전부 클라이언트에서 실행            │
│                                                     │
└─────────────────────────────────────────────────────┘
```
