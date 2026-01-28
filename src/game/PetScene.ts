import Phaser from 'phaser'

export class PetScene extends Phaser.Scene {
  private pet!: Phaser.GameObjects.Sprite
  private isDragging = false
  private dragStartX = 0
  private dragStartY = 0

  constructor() {
    super({ key: 'PetScene' })
  }

  preload() {
    // 스프라이트 시트 로드
    this.load.spritesheet('cat', '/assets/sleepingcat1.png', {
      frameWidth: 64,
      frameHeight: 64
    })
  }

  create() {
    // 고양이 스프라이트 생성
    this.pet = this.add.sprite(100, 100, 'cat')
    this.pet.setScale(2) // 2배 확대 (128x128)

    // 숨쉬기 애니메이션 정의
    this.anims.create({
      key: 'sleep',
      frames: this.anims.generateFrameNumbers('cat', { start: 0, end: 5 }),
      frameRate: 6,
      repeat: -1
    })

    // 애니메이션 재생
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
      this.pet.setTint(0xffcccc) // 살짝 붉은 틴트
    })

    this.pet.on('pointerout', () => {
      this.pet.clearTint()
    })
  }
}
