import Phaser from 'phaser'
// ⭐ Tauri API - Rust 백엔드와 통신
import { invoke } from '@tauri-apps/api/core'

// ============================================================
// PetScene - 고양이가 살아있는 게임 씬
// ============================================================
// 이제 전체 화면을 사용하므로, 고양이는 화면 어디든 갈 수 있음!
// 클릭 통과: 고양이 영역만 클릭 가능, 나머지는 통과
// ============================================================

export class PetScene extends Phaser.Scene {
  private pet!: Phaser.GameObjects.Sprite
  private isDragging = false
  private dragStartX = 0
  private dragStartY = 0

  constructor() {
    super({ key: 'PetScene' })
  }

  // ⭐ 고양이 위치를 Rust 백엔드로 전송
  // Rust에서 마우스가 고양이 위에 있는지 판단하여 클릭 통과 여부 결정
  private updatePetBounds() {
    const scale = this.pet.scale  // 2
    const width = 64 * scale      // 실제 표시 크기
    const height = 64 * scale

    // ⭐ Tauri 커맨드 호출 - 고양이 위치 업데이트
    invoke('update_pet_bounds', {
      x: this.pet.x,
      y: this.pet.y,
      width: width,
      height: height
    }).catch(console.error)
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

    // ⭐ 초기 위치를 Rust로 전송
    this.updatePetBounds()

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
        // ⭐ 드래그 중 위치 업데이트
        this.updatePetBounds()
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
