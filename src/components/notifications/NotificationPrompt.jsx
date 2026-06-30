'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Icon } from '../ui/Icon'
import { Button } from '../ui/Button'
import { enableFcmNotifications, hasEnabledFcmNotifications } from '../../api/firebaseNotifications'

const NOTIFICATION_PROMPT_DISMISSED_KEY = 'scorekeeper_fcm_prompt_dismissed'
const NOTIFICATION_PROMPT_SNOOZE_MS = 7 * 24 * 60 * 60 * 1000

export function NotificationPrompt({ toast, activeStep }) {
  const [isVisible, setIsVisible] = useState(false)
  const [isEnabling, setIsEnabling] = useState(false)

  useEffect(() => {
    // Hiển thị ở trang chủ ('games') hoặc chi tiết lịch sử ('history-detail')
    const allowedSteps = ['games', 'history-detail']
    if (!allowedSteps.includes(activeStep)) {
      setIsVisible(false)
      return
    }
    
    // Nếu đã bật thông báo rồi thì không hiện ở bất kỳ đâu
    if (hasEnabledFcmNotifications()) {
      setIsVisible(false)
      return
    }

    if (activeStep === 'games') {
      // Ở trang chủ (home): Check thêm hạn snooze 7 ngày trong localStorage
      const dismissedUntil = Number(window.localStorage.getItem(NOTIFICATION_PROMPT_DISMISSED_KEY)) || 0
      setIsVisible(Date.now() > dismissedUntil)
    } else {
      // Ở trang chi tiết lịch sử: Luôn luôn hiển thị
      setIsVisible(true)
    }
  }, [activeStep])

  const handleEnable = useCallback(async () => {
    if (isEnabling) return

    setIsEnabling(true)
    try {
      await enableFcmNotifications()
      setIsVisible(false)
      if (toast) toast('Đã bật thông báo')
    } catch (error) {
      if (toast) toast(error?.message || 'Không bật được thông báo')
    } finally {
      setIsEnabling(false)
    }
  }, [isEnabling, toast])

  const handleDismiss = useCallback(() => {
    if (activeStep === 'games') {
      // Ở trang chủ (home): Lưu snooze 7 ngày vào localStorage
      window.localStorage.setItem(NOTIFICATION_PROMPT_DISMISSED_KEY, String(Date.now() + NOTIFICATION_PROMPT_SNOOZE_MS))
    }
    // Ở cả hai trang: Ẩn tạm thời trên giao diện hiện tại
    setIsVisible(false)
  }, [activeStep])

  if (!isVisible) return null

  return (
    <section className="home-notification-banner" aria-label="Bật thông báo">
      <div className="home-notification-header">
        <Icon src="/notification.png" size={24} color="var(--color-text)" className="home-notification-icon" />
        <h2 className="home-notification-title">Bật thông báo khi có bình luận mới?</h2>
      </div>
      <div className="home-notification-actions">
        <Button 
          variant="ghost" 
          className="home-notification-btn-dismiss" 
          onClick={handleDismiss}
        >
          Để sau
        </Button>
        <Button 
          variant="primary" 
          className="home-notification-btn-confirm" 
          onClick={handleEnable} 
          disabled={isEnabling}
        >
          {isEnabling ? 'Đang bật...' : 'Bật luôn khỏi quên'}
        </Button>
      </div>
    </section>
  )
}
