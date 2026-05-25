'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useGameStore } from '../store/gameStore'
import { useGameSessionStore } from '../store/gameSessionStore'
import { SetupScreen } from '../components/SetupScreen'
import { Toast } from '../components/Toast'
import { useToast } from '../hooks/useToast'
import { BottomNav } from '../components/navigation/BottomNav'
import { ProtectedScreen } from '../components/auth/ProtectedScreen'

export function HomeShell() {
  const router = useRouter()
  const { message, visible, show: showToast } = useToast()
  const [homeResetToken, setHomeResetToken] = useState(0)

  const clearPlayers = useGameStore((state) => state.clearPlayers)
  const startGameFlow = useGameSessionStore((state) => state.startGameFlow)

  function showHome() {
    clearPlayers()
    setHomeResetToken((value) => value + 1)
  }

  return (
    <ProtectedScreen>
      <div className="app-shell screen-setup">
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <SetupScreen
            onStart={() => router.push('/game')}
            onChooseGame={(game) => {
              startGameFlow(game)
              router.push('/game')
            }}
            homeResetToken={homeResetToken}
            toast={showToast}
            onShowSetup={showHome}
            onShowHistory={() => router.push('/history')}
            onNewGame={showHome}
          />
        </div>
        <BottomNav onHomeReselect={() => setHomeResetToken((value) => value + 1)} />
        <Toast message={message} visible={visible} />
      </div>
    </ProtectedScreen>
  )
}
