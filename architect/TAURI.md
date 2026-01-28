# Tauri 설정

## tauri.conf.json 분석

### 기본 정보

```json
{
  "productName": "petpet",
  "version": "0.1.0",
  "identifier": "com.petpet.app"
}
```

### 빌드 설정

```json
{
  "build": {
    "frontendDist": "../dist",        // Vite 빌드 결과물 위치
    "devUrl": "http://localhost:1420", // 개발 서버 URL
    "beforeDevCommand": "npm run dev", // 개발 시 먼저 실행
    "beforeBuildCommand": "npm run build" // 빌드 시 먼저 실행
  }
}
```

### 창 설정 (핵심!)

```json
{
  "app": {
    "macOSPrivateApi": true,  // macOS 투명 창 지원에 필요
    "windows": [
      {
        "title": "PetPet",
        "width": 200,           // 창 너비
        "height": 200,          // 창 높이
        "resizable": false,     // 크기 조절 불가
        "fullscreen": false,    // 전체화면 아님
        "decorations": false,   // 창틀(타이틀바) 없음
        "transparent": true,    // 투명 배경!
        "alwaysOnTop": true,    // 항상 최상위
        "skipTaskbar": true,    // 작업표시줄에 안 보임
        "center": true          // 화면 중앙에 배치
      }
    ]
  }
}
```

### 각 옵션 설명

| 옵션 | 값 | 설명 |
|------|-----|------|
| `decorations` | `false` | 타이틀바, 닫기 버튼 등 숨김 |
| `transparent` | `true` | 배경이 투명해서 바탕화면이 비침 |
| `alwaysOnTop` | `true` | 다른 창 위에 항상 표시 |
| `skipTaskbar` | `true` | Dock/작업표시줄에 표시 안 함 |
| `macOSPrivateApi` | `true` | macOS에서 투명 창 사용에 필요 |

## Rust 코드

### main.rs

```rust
// Windows에서 콘솔 창 숨김
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    app_lib::run();
}
```

### lib.rs

```rust
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

현재는 기본 Tauri 앱이며, 커스텀 명령어가 없습니다.

## 투명 창 작동 원리

```
┌──────────────────────────────────────────┐
│            운영체제 바탕화면              │
│                                          │
│    ┌────────────────────┐                │
│    │  Tauri 창 (투명)   │                │
│    │  ┌──────────────┐  │                │
│    │  │   WebView    │  │                │
│    │  │ (투명 배경)  │  │                │
│    │  │  ┌────────┐  │  │                │
│    │  │  │ Canvas │  │  │                │
│    │  │  │  🟢    │  │  │ ← 펫만 보임   │
│    │  │  └────────┘  │  │                │
│    │  └──────────────┘  │                │
│    └────────────────────┘                │
│                                          │
└──────────────────────────────────────────┘
```

투명도 체인:
1. `tauri.conf.json`: `transparent: true`
2. `index.html`: `background: transparent`
3. `App.tsx`: Phaser config에 `transparent: true`

## 확장: Tauri 명령어 추가

### Rust 측 (lib.rs)

```rust
#[tauri::command]
fn get_screen_size() -> (u32, u32) {
    // 화면 크기 반환
    (1920, 1080)
}

pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![get_screen_size])
        .run(tauri::generate_context!())
        .expect("error");
}
```

### JS 측

```typescript
import { invoke } from '@tauri-apps/api/core'

const [width, height] = await invoke('get_screen_size')
```

## 유용한 Tauri 기능

### 창 이동 (JS에서)

```typescript
import { getCurrentWindow } from '@tauri-apps/api/window'

const window = getCurrentWindow()
await window.setPosition(new LogicalPosition(100, 100))
```

### 시스템 트레이

```json
// tauri.conf.json
{
  "app": {
    "trayIcon": {
      "iconPath": "icons/icon.png",
      "iconAsTemplate": true
    }
  }
}
```

### 자동 시작

```json
// tauri.conf.json
{
  "plugins": {
    "autostart": {
      "macosLaunchAgent": true
    }
  }
}
```
