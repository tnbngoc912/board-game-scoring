import { useState, useCallback, useRef, useEffect } from 'react'

const globalToastListeners = new Set()

export function triggerGlobalToast(msg, duration = 2500) {
  globalToastListeners.forEach((listener) => {
    try {
      listener(msg, duration)
    } catch {
      // ignore
    }
  })
}

export function useToast() {
  const [message, setMessage] = useState('')
  const [visible, setVisible] = useState(false)
  const timerRef = useRef(null)

  const show = useCallback((msg, duration = 2000) => {
    setMessage(msg)
    setVisible(true)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setVisible(false), duration)
  }, [])

  useEffect(() => {
    globalToastListeners.add(show)
    return () => {
      globalToastListeners.delete(show)
    }
  }, [show])

  return { message, visible, show }
}
