import React, { useState } from 'react'
import GameBoard from './components/GameBoard'
import './App.css'

function App() {
  const [gameState, setGameState] = useState('menu') // 'menu', 'playing', 'finished'
  const [playerName, setPlayerName] = useState('')

  const startGame = () => {
    if (playerName.trim()) {
      setGameState('playing')
    }
  }

  if (gameState === 'menu') {
    return (
      <div className="app">
        <div className="menu">
          <h1>Vetrolisci</h1>
          <p>A strategic card placement game</p>
          <div className="menu-form">
            <input
              type="text"
              placeholder="Enter your name"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
            />
            <button onClick={startGame}>Start Game</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Vetrolisci</h1>
        <p>Player: {playerName}</p>
      </header>
      <GameBoard />
    </div>
  )
}

export default App