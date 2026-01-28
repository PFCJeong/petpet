# 펫 캐릭터 시스템

## 펫 구조

펫은 Phaser의 `Graphics` 객체로 그려집니다.

```
        ┌─────────────────┐
        │   PetScene      │
        │                 │
        │  ┌───────────┐  │
        │  │ Graphics  │  │ ← this.pet
        │  │           │  │
        │  │  ● ●     │  │ ← 눈
        │  │  ◠ ◠     │  │ ← 볼터치
        │  │   ⌣      │  │ ← 입
        │  └───────────┘  │
        │                 │
        └─────────────────┘
```

## 렌더링 코드 분석

### drawPet() 메서드

```typescript
private drawPet(color: number = 0x4caf50) {
    this.pet.clear()  // 이전 그래픽 지우기

    // 1. 몸통 (초록 원)
    this.pet.fillStyle(color, 1)
    this.pet.fillCircle(0, 0, 40)
    //                  ↑  ↑   ↑
    //                  x  y  반지름

    // 2. 눈 흰자
    this.pet.fillStyle(0xffffff, 1)
    this.pet.fillCircle(-15, -10, 12)  // 왼쪽 눈
    this.pet.fillCircle(15, -10, 12)   // 오른쪽 눈

    // 3. 눈동자
    this.pet.fillStyle(0x000000, 1)
    this.pet.fillCircle(-12, -8, 6)    // 왼쪽
    this.pet.fillCircle(18, -8, 6)     // 오른쪽

    // 4. 볼터치
    this.pet.fillStyle(0xff9999, 0.5)  // 반투명 분홍
    this.pet.fillCircle(-30, 10, 8)
    this.pet.fillCircle(30, 10, 8)

    // 5. 입 (호)
    this.pet.lineStyle(2, 0x000000, 1)
    this.pet.beginPath()
    this.pet.arc(0, 5, 12, 0.2, Math.PI - 0.2, false)
    this.pet.strokePath()
}
```

### 좌표계

```
        (-40, -40)          (40, -40)
             ┌─────────────────┐
             │                 │
             │    (-15,-10)    │  ← 왼쪽 눈
             │        ●   ●    │  ← (15,-10) 오른쪽 눈
             │                 │
             │   ◠   (0,0)  ◠  │  ← 중심점
             │                 │
             │        ⌣       │  ← (0, 5) 입
             │                 │
             └─────────────────┘
        (-40, 40)           (40, 40)
```

## 애니메이션

### 숨쉬기 효과 (Tween)

```typescript
this.tweens.add({
    targets: this.pet,
    scaleY: 0.95,      // 세로로 약간 찌그러짐
    scaleX: 1.05,      // 가로로 약간 늘어남
    duration: 500,     // 0.5초
    yoyo: true,        // 왔다 갔다
    repeat: -1,        // 무한 반복
    ease: 'Sine.easeInOut'
})
```

시각적 효과:
```
정상 → 찌그러짐 → 정상 → 찌그러짐 → ...

 🟢      🟢      🟢      🟢
 ↕       ↔       ↕       ↔
```

## 인터랙션

### 히트 영역

```typescript
const hitArea = new Phaser.Geom.Circle(0, 0, 40)
this.pet.setInteractive(hitArea, Phaser.Geom.Circle.Contains)
```

마우스 클릭/호버가 감지되는 영역을 원형으로 설정

### 호버 효과

```typescript
// 마우스 올림
this.pet.on('pointerover', () => {
    this.drawPet(0x66bb6a)  // 밝은 초록
})

// 마우스 벗어남
this.pet.on('pointerout', () => {
    this.drawPet()  // 기본 색상
})
```

### 드래그 앤 드롭

```typescript
// 상태 변수
private isDragging = false
private dragStartX = 0
private dragStartY = 0

// 드래그 시작
this.pet.on('pointerdown', (pointer) => {
    this.isDragging = true
    this.dragStartX = pointer.x - this.pet.x
    this.dragStartY = pointer.y - this.pet.y
})

// 드래그 중
this.input.on('pointermove', (pointer) => {
    if (this.isDragging) {
        this.pet.setPosition(
            pointer.x - this.dragStartX,
            pointer.y - this.dragStartY
        )
    }
})

// 드래그 종료
this.input.on('pointerup', () => {
    this.isDragging = false
})
```

## 확장 포인트

### 표정 변화
```typescript
// 예: 클릭하면 깜빡임
drawBlink() {
    // 눈을 선으로 그리기
    this.pet.lineStyle(3, 0x000000)
    this.pet.lineBetween(-20, -10, -10, -10)
    this.pet.lineBetween(10, -10, 20, -10)
}
```

### 스프라이트 기반 펫
```typescript
// Graphics 대신 이미지 사용
this.pet = this.add.sprite(100, 100, 'pet-spritesheet')
this.pet.play('idle')  // 애니메이션 재생
```

### 상태 시스템
```typescript
interface PetState {
    hunger: number      // 0-100
    happiness: number   // 0-100
    energy: number      // 0-100
}
```
