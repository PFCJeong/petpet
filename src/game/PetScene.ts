import Phaser from 'phaser'
import { invoke } from '@tauri-apps/api/core'

// ============================================================
// 상수 정의
// ============================================================

const FRAME_SIZE = 256            // 스프라이트 시트의 한 프레임 크기 (256x256px)
const PET_SCALE = 0.5             // 화면 표시 배율 (256 * 0.5 = 128px)
const WALK_SPEED = 60             // 이동 속도 (px/초)
const IDLE_MIN_MS = 3000          // IDLE 최소 시간 (3초)
const IDLE_MAX_MS = 6000          // IDLE 최대 시간 (6초)
const WALK_MIN_MS = 2000          // WALK 최소 시간 (2초)
const WALK_MAX_MS = 4000          // WALK 최대 시간 (4초)
const IDLE_FRAME_COUNT = 20       // Idle 스프라이트: 6x4 그리드 중 실제 20프레임 (마지막 행 2개만 사용)
const WALK_FRAME_COUNT = 12       // Walk 스프라이트: 6x2 그리드 = 12프레임 전부 사용
const HITBOX_WIDTH = 80           // 클릭 판정 영역 너비 (프레임 내 여우 크기 기준)
const HITBOX_HEIGHT = 120         // 클릭 판정 영역 높이

// ============================================================
// 상태 머신 - 여우의 3가지 행동 상태
// ============================================================
// IDLE → (타이머 만료) → WALK → (타이머 만료 or 경계 도달) → IDLE
// 어떤 상태든 → (클릭) → DRAGGING → (마우스 놓기) → IDLE
// ============================================================

enum PetState {
  IDLE = 'IDLE',           // 제자리에서 가만히 있는 상태
  WALK = 'WALK',           // 랜덤 방향으로 걸어다니는 상태
  DRAGGING = 'DRAGGING',   // 유저가 드래그 중인 상태
}

// ============================================================
// 8방향 벡터 - 스프라이트 파일명(dir1~dir8)과 매핑
// ============================================================
// 대각선 벡터는 정규화됨 (√2/2 ≈ 0.707)
// 예: dir1(↙)은 왼쪽 아래로 이동 = x:-0.707, y:+0.707

const DIRECTION_VECTORS: Record<number, { x: number; y: number }> = {
  1: { x: -0.707, y: 0.707 },   // dir1 = ↙ Down-Left
  2: { x: -1, y: 0 },           // dir2 = ← Left
  3: { x: -0.707, y: -0.707 },  // dir3 = ↖ Up-Left
  4: { x: 0, y: -1 },           // dir4 = ↑ Up
  5: { x: 0.707, y: -0.707 },   // dir5 = ↗ Up-Right
  6: { x: 1, y: 0 },            // dir6 = → Right
  7: { x: 0.707, y: 0.707 },    // dir7 = ↘ Down-Right
  8: { x: 0, y: 1 },            // dir8 = ↓ Down
}

// ============================================================
// PetScene - 여우 펫 메인 씬
// ============================================================
// 전체 화면 투명 윈도우 위에 여우가 자율적으로 배회한다.
// Phaser의 update() 루프에서 매 프레임 상태를 체크하고 이동 처리.
// Rust 백엔드에 위치를 전송하여 클릭 통과(ignore cursor events)를 제어.
// ============================================================

export class PetScene extends Phaser.Scene {
  private pet!: Phaser.GameObjects.Sprite
  private state: PetState = PetState.IDLE
  private currentDir: number = 8   // 현재 바라보는 방향 (1~8), 초기값: 아래(↓)
  private stateTimer: number = 0   // 현재 상태 남은 시간 (ms)
  private isDragging = false
  private dragOffsetX = 0          // 드래그 시 클릭 지점과 펫 중심의 오프셋
  private dragOffsetY = 0

  constructor() {
    super({ key: 'PetScene' })
  }

  // ----------------------------------------------------------
  // Rust 백엔드로 펫 위치/크기 전송
  // ----------------------------------------------------------
  // Rust 쪽에서 마우스가 이 영역 안에 있으면 클릭 가능,
  // 밖이면 클릭이 바탕화면으로 통과됨 (set_ignore_cursor_events)
  private updatePetBounds() {
    const width = HITBOX_WIDTH * PET_SCALE
    const height = HITBOX_HEIGHT * PET_SCALE

    invoke('update_pet_bounds', {
      x: this.pet.x,
      y: this.pet.y,
      width,
      height,
    }).catch(console.error)
  }

  // ----------------------------------------------------------
  // 상태 전환 메서드
  // ----------------------------------------------------------

  // IDLE 상태 시작: 현재 방향으로 가만히 서 있기
  private startIdle() {
    this.state = PetState.IDLE
    this.stateTimer = this.randomBetween(IDLE_MIN_MS, IDLE_MAX_MS)
    this.pet.play(`fox_idle_${this.currentDir}`)
  }

  // WALK 상태 시작: 랜덤 방향을 골라서 걷기
  private startWalk() {
    this.state = PetState.WALK
    this.currentDir = this.pickRandomDirection()
    this.stateTimer = this.randomBetween(WALK_MIN_MS, WALK_MAX_MS)
    this.pet.play(`fox_walk_${this.currentDir}`)
  }

  // ----------------------------------------------------------
  // 유틸리티
  // ----------------------------------------------------------

  private pickRandomDirection(): number {
    return Math.floor(Math.random() * 8) + 1  // 1~8 중 랜덤
  }

  private randomBetween(min: number, max: number): number {
    return min + Math.random() * (max - min)
  }

  // ----------------------------------------------------------
  // 애니메이션 생성 (총 16개: idle 8방향 + walk 8방향)
  // ----------------------------------------------------------
  // Phaser의 generateFrameNumbers는 스프라이트 시트를
  // 왼쪽→오른쪽, 위→아래 순서로 프레임 번호를 매김.
  // 예: 6x4 그리드 → frame 0~23, 우리는 0~19만 사용 (빈 칸 제외)
  private createAnimations() {
    for (let dir = 1; dir <= 8; dir++) {
      // Idle: 20프레임, 10fps → 약 2초에 한 번 루프
      this.anims.create({
        key: `fox_idle_${dir}`,
        frames: this.anims.generateFrameNumbers(`fox_idle_${dir}`, {
          start: 0,
          end: IDLE_FRAME_COUNT - 1,
        }),
        frameRate: 10,
        repeat: -1,  // 무한 반복
      })

      // Walk: 12프레임, 12fps → 1초에 한 번 루프
      this.anims.create({
        key: `fox_walk_${dir}`,
        frames: this.anims.generateFrameNumbers(`fox_walk_${dir}`, {
          start: 0,
          end: WALK_FRAME_COUNT - 1,
        }),
        frameRate: 12,
        repeat: -1,
      })
    }
  }

  // ----------------------------------------------------------
  // preload: 스프라이트 시트 로드 (8방향 × 2동작 = 16장)
  // ----------------------------------------------------------
  // 각 PNG는 256x256 프레임이 격자로 배치된 스프라이트 시트.
  // Phaser가 frameWidth/frameHeight로 자동 분할해서 프레임 번호 부여.
  preload() {
    for (let dir = 1; dir <= 8; dir++) {
      this.load.spritesheet(
        `fox_idle_${dir}`,
        `/assets/idle/Fox_Idle_dir${dir}.png`,
        { frameWidth: FRAME_SIZE, frameHeight: FRAME_SIZE }
      )
    }

    for (let dir = 1; dir <= 8; dir++) {
      this.load.spritesheet(
        `fox_walk_${dir}`,
        `/assets/walk/Fox_Walk_dir${dir}.png`,
        { frameWidth: FRAME_SIZE, frameHeight: FRAME_SIZE }
      )
    }
  }

  // ----------------------------------------------------------
  // create: 씬 초기화 - 스프라이트 생성, 이벤트 바인딩
  // ----------------------------------------------------------
  create() {
    this.createAnimations()

    // 화면 정중앙에 여우 배치
    const centerX = this.scale.width / 2
    const centerY = this.scale.height / 2

    this.pet = this.add.sprite(centerX, centerY, `fox_idle_${this.currentDir}`)
    this.pet.setScale(PET_SCALE)

    // 클릭 판정 영역 설정
    // 256x256 프레임 중 여우가 실제로 차지하는 영역만 클릭 가능하도록
    // 프레임 중앙에 HITBOX 크기의 사각형을 배치
    this.pet.setInteractive({
      hitArea: new Phaser.Geom.Rectangle(
        (FRAME_SIZE - HITBOX_WIDTH) / 2,   // x 오프셋 = (256-80)/2 = 88
        (FRAME_SIZE - HITBOX_HEIGHT) / 2,  // y 오프셋 = (256-120)/2 = 68
        HITBOX_WIDTH,
        HITBOX_HEIGHT
      ),
      hitAreaCallback: Phaser.Geom.Rectangle.Contains,
      useHandCursor: true,
    })

    // --- 드래그 앤 드롭 ---
    // pointerdown: 드래그 시작, 클릭 지점과 펫 중심의 오프셋 저장
    this.pet.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.state = PetState.DRAGGING
      this.isDragging = true
      this.dragOffsetX = pointer.x - this.pet.x
      this.dragOffsetY = pointer.y - this.pet.y
      // 드래그 중에는 idle 애니메이션 표시 (걷는 모션 멈춤)
      this.pet.play(`fox_idle_${this.currentDir}`)
    })

    // pointermove: 드래그 중이면 마우스 따라 이동
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.isDragging) {
        this.pet.setPosition(
          pointer.x - this.dragOffsetX,
          pointer.y - this.dragOffsetY
        )
        this.updatePetBounds()
      }
    })

    // pointerup: 드래그 종료 → 다시 자율 배회 시작
    this.input.on('pointerup', () => {
      if (this.isDragging) {
        this.isDragging = false
        this.startIdle()
      }
    })

    // --- 호버 효과: 마우스 올리면 분홍 틴트 ---
    this.pet.on('pointerover', () => {
      this.pet.setTint(0xffcccc)
    })

    this.pet.on('pointerout', () => {
      this.pet.clearTint()
    })

    // --- 화면 크기 변경 시 펫이 밖으로 나가지 않도록 보정 ---
    this.scale.on('resize', (gameSize: Phaser.Structs.Size) => {
      const margin = (FRAME_SIZE * PET_SCALE) / 2
      const maxX = gameSize.width - margin
      const maxY = gameSize.height - margin

      if (this.pet.x > maxX) this.pet.x = maxX
      if (this.pet.y > maxY) this.pet.y = maxY
      if (this.pet.x < margin) this.pet.x = margin
      if (this.pet.y < margin) this.pet.y = margin

      this.updatePetBounds()
    })

    // 초기 상태: IDLE로 시작
    this.startIdle()
    this.updatePetBounds()
  }

  // ----------------------------------------------------------
  // update: 매 프레임 호출 (상태 머신 tick)
  // ----------------------------------------------------------
  // delta = 이전 프레임과의 시간 차이 (ms)
  // 이걸로 프레임 레이트에 관계없이 일정한 이동 속도를 보장
  update(_time: number, delta: number) {
    // 드래그 중에는 자율 행동 일시정지
    if (this.state === PetState.DRAGGING) return

    // 상태 타이머 감소
    this.stateTimer -= delta

    if (this.state === PetState.IDLE) {
      // IDLE: 타이머가 다 되면 걷기 시작
      if (this.stateTimer <= 0) {
        this.startWalk()
      }
    } else if (this.state === PetState.WALK) {
      // WALK: 타이머가 다 되면 멈추기
      if (this.stateTimer <= 0) {
        this.startIdle()
        return
      }

      // 현재 방향의 벡터로 이동량 계산 (delta를 초 단위로 변환)
      const vec = DIRECTION_VECTORS[this.currentDir]
      const dx = vec.x * WALK_SPEED * (delta / 1000)
      const dy = vec.y * WALK_SPEED * (delta / 1000)

      let newX = this.pet.x + dx
      let newY = this.pet.y + dy

      // 화면 경계 체크 (margin = 스프라이트 반 크기, 밖으로 안 나가게)
      const margin = (FRAME_SIZE * PET_SCALE) / 2
      const minX = margin
      const maxX = this.scale.width - margin
      const minY = margin
      const maxY = this.scale.height - margin

      let hitBoundary = false

      if (newX < minX) { newX = minX; hitBoundary = true }
      if (newX > maxX) { newX = maxX; hitBoundary = true }
      if (newY < minY) { newY = minY; hitBoundary = true }
      if (newY > maxY) { newY = maxY; hitBoundary = true }

      this.pet.setPosition(newX, newY)
      this.updatePetBounds()

      // 화면 끝에 부딪히면 멈추고 IDLE로 전환
      // 다음 WALK 때 새 방향을 랜덤으로 고르므로 자연스럽게 방향 전환됨
      if (hitBoundary) {
        this.startIdle()
      }
    }
  }
}
