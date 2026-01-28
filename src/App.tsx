import { useEffect, useRef } from 'react'
import Phaser from 'phaser'
import { PetScene } from './game/PetScene'

function App() {
  const gameRef = useRef<Phaser.Game | null>(null)

  useEffect(() => {
    if (gameRef.current) return

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: 200,
      height: 200,
      parent: 'game-container',
      transparent: true,
      scene: [PetScene],
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

  return (
    <div
      id="game-container"
      style={{
        width: '200px',
        height: '200px',
        background: 'transparent',
      }}
    />
  )
}

export default App
