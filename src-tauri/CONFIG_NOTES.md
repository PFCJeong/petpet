# tauri.conf.json 설정 설명

JSON은 주석을 지원하지 않아서 여기에 설명을 남김.

## 윈도우 설정 (app.windows[0])

```json
{
  "title": "PetPet",
  "width": 800,
  "height": 600,
  "resizable": false,
  "fullscreen": false,
  "maximized": true,      // ⭐ 추가: 창을 최대화 상태로 시작
  "decorations": false,   // 타이틀바, 테두리 없음
  "transparent": true,    // ⭐ 핵심: 배경 투명
  "alwaysOnTop": true,    // 항상 맨 위에 표시
  "skipTaskbar": true     // 작업표시줄에 안 보임
}
```

### 주요 변경사항

1. **maximized: true 추가**
   - 창이 시작할 때 화면 전체를 차지함
   - fullscreen과 다름! fullscreen은 메뉴바도 가림
   - maximized는 macOS 메뉴바는 남겨둠

2. **center: true 제거**
   - maximized 상태에서는 center가 의미 없음
   - 어차피 전체 화면을 차지하니까

### 투명 배경이 작동하려면

1. `transparent: true` - 윈도우 자체가 투명
2. `decorations: false` - 타이틀바 없어야 투명 효과 보임
3. `macOSPrivateApi: true` - macOS에서 투명 윈도우 사용 허용
4. Phaser에서도 `transparent: true` 설정 필요
5. HTML/CSS에서도 `background: transparent` 설정 필요
