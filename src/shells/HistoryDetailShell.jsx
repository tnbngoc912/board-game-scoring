'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { ProtectedScreen } from '../components/auth/ProtectedScreen'
import { HistoryScreen } from '../components/HistoryScreen'
import { Toast } from '../components/Toast'
import { useToast } from '../hooks/useToast'
import { useGameStore } from '../store/gameStore'

export function HistoryDetailShell() {
  const router = useRouter()
  const { message, visible, show: showToast } = useToast()
  const clearPlayers = useGameStore((state) => state.clearPlayers)

  function showHome() {
    clearPlayers()
    router.push('/')
  }

  return (
    <ProtectedScreen>
      <div className="app-shell screen-history">
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <HistoryScreen
            toast={showToast}
            onShowSetup={showHome}
            onShowHistory={() => router.push('/history')}
            onNewGame={showHome}
          />
        </div>
        <Toast message={message} visible={visible} />
      </div>
    </ProtectedScreen>
  )
}
