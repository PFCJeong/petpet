import Phaser from 'phaser'

// ============================================================
// PetScene - 고양이가 살아있는 게임 씬
// ============================================================
// 이제 전체 화면을 사용하므로, 고양이는 화면 어디든 갈 수 있음!
// ============================================================

export class PetScene extends Phaser.Scene {
  private pet!: Phaser.GameObjects.Sprite
  private isDragging = false
  private dragStartX = 0
  private dragStartY = 0

  constructor() {
    super({ key: 'PetScene' })
  }

  preload() {
    this.load.spritesheet('cat', '/assets/sleepingcat1.png', {
      frameWidth: 64,
      frameHeight: 64
    })
  }

  create() {
    // ⭐ 변경: 화면 중앙에 고양이 배치
    // this.scale.width/height는 현재 게임 화면의 크기
    const centerX = this.scale.width / 2
    const centerY = this.scale.height / 2

    this.pet = this.add.sprite(centerX, centerY, 'cat')
    this.pet.setScale(2)

    // 애니메이션 정의
    this.anims.create({
      key: 'sleep',
      frames: this.anims.generateFrameNumbers('cat', { start: 0, end: 5 }),
      frameRate: 6,
      repeat: -1
    })

    this.pet.play('sleep')

    // 인터랙티브 설정
    this.pet.setInteractive({ useHandCursor: true })

    // 드래그 이벤트
    this.pet.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.isDragging = true
      this.dragStartX = pointer.x - this.pet.x
      this.dragStartY = pointer.y - this.pet.y
    })

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.isDragging) {
        this.pet.setPosition(
          pointer.x - this.dragStartX,
          pointer.y - this.dragStartY
        )
      }
    })

    this.input.on('pointerup', () => {
      this.isDragging = false
    })

    // 호버 효과
    this.pet.on('pointerover', () => {
      this.pet.setTint(0xffcccc)
    })

    this.pet.on('pointerout', () => {
      this.pet.clearTint()
    })

    // ⭐ 화면 크기 변경 시 대응 (선택사항)
    this.scale.on('resize', (gameSize: Phaser.Structs.Size) => {
      // 화면 크기가 바뀌면 여기서 처리할 수 있음
      // 예: 고양이가 화면 밖으로 나갔으면 다시 안으로 이동
      const maxX = gameSize.width - 64
      const maxY = gameSize.height - 64

      if (this.pet.x > maxX) this.pet.x = maxX
      if (this.pet.y > maxY) this.pet.y = maxY
    })
  }
}
