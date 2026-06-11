'use client'

import { useEffect, useState } from 'react'
import {
  hasEnabledFcmNotifications,
  listenForegroundNotifications,
  showFcmNotification,
} from '../../api/firebaseNotifications'

export function FcmForegroundListener() {
  const [isEnabled, setIsEnabled] = useState(false)

  useEffect(() => {
    setIsEnabled(hasEnabledFcmNotifications())

    function handleEnabled() {
      setIsEnabled(true)
    }

    function handleDisabled() {
      setIsEnabled(false)
    }

    window.addEventListener('scorekeeper:fcm-enabled', handleEnabled)
    window.addEventListener('scorekeeper:fcm-disabled', handleDisabled)
    return () => {
      window.removeEventListener('scorekeeper:fcm-enabled', handleEnabled)
      window.removeEventListener('scorekeeper:fcm-disabled', handleDisabled)
    }
  }, [])

  useEffect(() => {
    if (!isEnabled) return undefined

    let unsubscribe = null
    let isMounted = true
    listenForegroundNotifications(showFcmNotification)
      .then((nextUnsubscribe) => {
        if (!isMounted) {
          nextUnsubscribe?.()
          return
        }
        unsubscribe = nextUnsubscribe
      })
      .catch(() => {})

    return () => {
      isMounted = false
      unsubscribe?.()
    }
  }, [isEnabled])

  return null
}
