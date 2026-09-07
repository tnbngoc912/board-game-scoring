import { useState, useEffect } from 'react'

export function checkIsStandalone() {
  if (typeof window === 'undefined') return false
  return Boolean(
    window.navigator.standalone ||
    window.matchMedia('(display-mode: standalone)').matches ||
    new URLSearchParams(window.location.search).get('test-pwa') === 'true'
  )
}

export function useIsStandalone() {
  const [isStandalone, setIsStandalone] = useState(checkIsStandalone)

  useEffect(() => {
    setIsStandalone(checkIsStandalone())
  }, [])

  return isStandalone
}
