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
  const [homeResetToken, setHomeResetToken] = useState(0)
  const { darkMode } = useGameStore()
  const { message, visible, show: showToast } = useToast()

  useEffect(() => {
    document.documentElement.className = darkMode ? '' : 'theme-light'
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', darkMode ? '#8c613b' : '#f5eedf')
  }, [darkMode])

  function showHome() {
    setScreen('setup')
    setHomeResetToken((value) => value + 1)
  }

  const screenProps = {
    toast: showToast,
    onShowSetup: showHome,
    onShowHistory: () => setScreen('history'),
    onNewGame: showHome,
  }

  return (
    <div className={`app-shell screen-${screen}`}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={screen}
          initial={false}
          animate={{ opacity: 1 }}
          exit={{ opacity: 1 }}
          transition={{ duration: 0 }}
          style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
        >
          {screen === 'setup' ? <SetupScreen onStart={() => setScreen('game')} homeResetToken={homeResetToken} {...screenProps} /> : null}
          {screen === 'game' ? <GameScreen {...screenProps} /> : null}
          {screen === 'history' ? <HistoryScreen {...screenProps} /> : null}
        </motion.div>
      </AnimatePresence>

      {screen !== 'game' ? (
        <nav
          className="bottom-nav"
          aria-label="Dieu huong chinh"
          style={{ '--bottom-nav-active': screen === 'history' ? '100%' : '0%' }}
        >
          <button
            className={`bottom-nav-item${screen === 'setup' ? ' active' : ''}`}
            onClick={showHome}
          >
            <span aria-hidden="true">
              <svg viewBox="0 0 24 24"><path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6h-4v6H5a1 1 0 0 1-1-1v-9.5z" /></svg>
            </span>
            Trang chu
          </button>
          <button
            className={`bottom-nav-item${screen === 'history' ? ' active' : ''}`}
            onClick={() => setScreen('history')}
          >
            <span aria-hidden="true">
              <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5" /><path d="M12 7v5l3.5 3.5" /></svg>
            </span>
            Lich su
          </button>
          <button className="bottom-nav-item" type="button">
            <span aria-hidden="true">
              <svg viewBox="0 0 24 24"><path d="M5 7h14M5 12h14M5 17h14" /></svg>
            </span>
            Khac
          </button>
        </nav>
      ) : null}

      <Toast message={message} visible={visible} />
    </div>
  )
}
