import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from './store/gameStore'
import { SetupScreen } from './components/SetupScreen'
import { GameScreen } from './components/GameScreen'
import { HistoryScreen } from './components/HistoryScreen'
import { Toast } from './components/Toast'
import { useToast } from './hooks/useToast'

export default function App() {
  const [screen, setScreen] = useState('setup')
  const { darkMode } = useGameStore()
  const { message, visible, show: showToast } = useToast()

  useEffect(() => {
    document.documentElement.className = darkMode ? '' : 'theme-light'
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', darkMode ? '#8c613b' : '#f5eedf')
  }, [darkMode])

  const screenProps = {
    toast: showToast,
    onShowSetup: () => setScreen('setup'),
    onShowHistory: () => setScreen('history'),
    onNewGame: () => setScreen('setup'),
  }

  return (
    <div className="app-shell">
      <AnimatePresence mode="wait">
        <motion.div
          key={screen}
          initial={{ opacity: 0, x: 18 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -18 }}
          transition={{ duration: 0.16, ease: 'easeOut' }}
          style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
        >
          {screen === 'setup' ? <SetupScreen onStart={() => setScreen('game')} {...screenProps} /> : null}
          {screen === 'game' ? <GameScreen {...screenProps} /> : null}
          {screen === 'history' ? <HistoryScreen {...screenProps} /> : null}
        </motion.div>
      </AnimatePresence>

      <Toast message={message} visible={visible} />
    </div>
  )
}
