import { useEffect, useRef } from 'react'
import Phaser from 'phaser'
import { PetScene } from './game/PetScene'

function App() {
  const gameRef = useRef<Phaser.Game | null>(null)

  useEffect(() => {
    if (gameRef.current) return

    // ============================================================
    // Phaser 게임 설정
    // ============================================================
    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,

      // ⭐ 변경: 전체 화면 크기 사용
      // window.innerWidth/Height는 브라우저(웹뷰) 창의 크기
      // Tauri에서 maximized: true로 설정했으므로 이게 화면 전체 크기가 됨
      width: window.innerWidth,
      height: window.innerHeight,

      parent: 'game-container',

      // ⭐ 중요: 배경을 투명하게 설정
      // 이게 있어야 윈도우의 투명 배경이 제대로 보임
      transparent: true,

      scene: [PetScene],

      // ⭐ scale 설정 추가: 창 크기 변경 시 게임도 자동으로 맞춤
      scale: {
        mode: Phaser.Scale.RESIZE,  // 창 크기에 맞게 자동 조절
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },

      physics: {
        default: 'arcade',
        arcade: {
          gravity: { x: 0, y: 0 },
          debug: false,
        },
      },
    }

    gameRef.current = new Phaser.Game(config)

    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true)
        gameRef.current = null
      }
    }
  }, [])

  // ⭐ 변경: 컨테이너도 전체 화면 크기로 설정
  return (
    <div
      id="game-container"
      style={{
        width: '100vw',   // viewport width 100% = 전체 화면 너비
        height: '100vh',  // viewport height 100% = 전체 화면 높이
        background: 'transparent',

        // ⭐ 중요: 스크롤바 방지 및 여백 제거
        overflow: 'hidden',
        margin: 0,
        padding: 0,
      }}
    />
  )
}

export default App
