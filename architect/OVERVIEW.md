# 프로젝트 개요

## PetPet이란?

데스크톱 바탕화면에 떠다니는 가상 펫 애플리케이션입니다.
투명한 창 위에 귀여운 캐릭터가 표시되며, 드래그하여 이동하거나 마우스를 올려 반응을 볼 수 있습니다.

## 기술 스택

```
┌────────────────────────────────────────┐
│  Tauri 2.x                             │  ← 데스크톱 앱 프레임워크
│  ├── Rust Backend                      │  ← 네이티브 기능
│  └── WebView                           │  ← 웹 콘텐츠 렌더링
│       └── Vite 7 + React 19            │  ← 프론트엔드
│            └── Phaser 3                │  ← 2D 게임 엔진
└────────────────────────────────────────┘
```

### 왜 이 스택인가?

| 기술 | 선택 이유 |
|------|-----------|
| **Tauri** | Electron보다 가볍고, 투명 창/항상 위 등 네이티브 기능 지원 |
| **React** | 컴포넌트 기반 UI, 향후 설정 화면 등 확장 용이 |
| **Phaser** | 2D 게임 엔진으로 캐릭터 애니메이션, 인터랙션 처리에 최적 |
| **Vite** | 빠른 HMR, TypeScript 기본 지원 |

## 디렉토리 구조

```
petpet/
├── src/                      # 프론트엔드
│   ├── main.tsx             # React 엔트리포인트
│   ├── App.tsx              # Phaser 게임 마운트
│   └── game/
│       └── PetScene.ts      # 펫 로직 (핵심!)
│
├── src-tauri/               # Tauri 백엔드
│   ├── src/
│   │   ├── main.rs          # Rust 메인
│   │   └── lib.rs           # 앱 실행 로직
│   ├── tauri.conf.json      # 창 설정, 빌드 설정
│   └── Cargo.toml           # Rust 의존성
│
├── index.html               # HTML 템플릿 (투명 배경)
├── package.json             # npm 의존성
└── vite.config.ts           # Vite 설정
```

## 핵심 파일

### 1. `src/game/PetScene.ts`
펫의 모든 것이 담긴 파일
- 외형 렌더링 (Graphics API)
- 드래그 앤 드롭
- 호버 효과
- 숨쉬기 애니메이션

### 2. `src-tauri/tauri.conf.json`
데스크톱 앱의 행동 정의
- 창 크기, 위치
- 투명도, 항상 위
- 빌드 설정

### 3. `src/App.tsx`
Phaser와 React의 연결 고리
- Phaser.Game 인스턴스 생성
- 라이프사이클 관리
