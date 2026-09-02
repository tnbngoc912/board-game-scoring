'use client'

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useGameStore } from '../store/gameStore'
import { useGameSessionStore } from '../store/gameSessionStore'
import { GameOverviewScreen } from '../components/GameOverviewScreen'
import { SetupScreen } from '../components/SetupScreen'
import { GameScreen } from '../components/GameScreen'
import { Toast } from '../components/Toast'
import { useToast } from '../hooks/useToast'
import { ProtectedScreen } from '../components/auth/ProtectedScreen'
import { LoadingState } from '../components/ui/LoadingState'

export function GameFlowShell() {
  const router = useRouter()
  const { message, visible, show: showToast } = useToast()
  const clearPlayers = useGameStore((state) => state.clearPlayers)
  const boardGameId = useGameStore((state) => state.boardGameId)

  const flow = useGameSessionStore((state) => state.flow)
  const goToOverview = useGameSessionStore((state) => state.goToOverview)
  const goToSetup = useGameSessionStore((state) => state.goToSetup)
  const goToEntry = useGameSessionStore((state) => state.goToEntry)

  useEffect(() => {
    if (!boardGameId) router.replace('/')
  }, [boardGameId, router])

  function showHome() {
    clearPlayers()
    router.push('/')
  }

  if (!boardGameId) {
    return <LoadingState label="Đang chuyển hướng..." />
  }

  return (
    <ProtectedScreen>
      <div className="app-shell screen-game">
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {flow === 'overview' ? (
            <GameOverviewScreen
              key={boardGameId}
              boardGameId={boardGameId}
              toast={showToast}
              onBack={showHome}
              onCreateScore={goToSetup}
            />
          ) : null}

          {flow === 'setup' ? (
            <SetupScreen
              onStart={goToEntry}
              initialStep="config"
              onBackFromConfig={goToOverview}
              toast={showToast}
              onShowSetup={showHome}
              onShowHistory={() => router.push('/history')}
              onNewGame={showHome}
            />
          ) : null}

          {flow === 'entry' ? (
            <GameScreen
              toast={showToast}
              onShowSetup={goToOverview}
              onShowHistory={() => router.push('/history')}
            />
          ) : null}
        </div>
        <Toast message={message} visible={visible} />
      </div>
    </ProtectedScreen>
  )
}
