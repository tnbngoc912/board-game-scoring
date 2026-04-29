import { useState, useCallback, useRef } from 'react'

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

  return { message, visible, show }
}
