import React, { useState, useEffect, useRef } from 'react'
import { RotateCw } from 'lucide-react'
import '../../styles/components/pull-to-refresh.css'

const PULL_THRESHOLD = 60 // Khoảng cách kéo tối thiểu bằng px để kích hoạt refresh
const ACTIVATION_THRESHOLD = 12 // Khoảng cách trễ ban đầu trước khi nhận diện là hành vi kéo làm mới có chủ đích

export function PullToRefresh({ children, onRefresh }) {
  const [isStandalone, setIsStandalone] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const containerRef = useRef(null)
  const startX = useRef(0)
  const startY = useRef(0)
  const isEligibleForPull = useRef(false)
  const isPulling = useRef(false)
  const pullDistanceRef = useRef(0)
  const isRefreshingRef = useRef(false)
  const onRefreshRef = useRef(onRefresh)

  // Đồng bộ refs để listener không cần re-bind khi state thay đổi
  useEffect(() => {
    pullDistanceRef.current = pullDistance
  }, [pullDistance])

  useEffect(() => {
    isRefreshingRef.current = isRefreshing
  }, [isRefreshing])

  useEffect(() => {
    onRefreshRef.current = onRefresh
  }, [onRefresh])

  // 1. Kiểm tra xem ứng dụng có đang chạy ở chế độ standalone hay không
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const standalone =
        window.navigator.standalone ||
        window.matchMedia('(display-mode: standalone)').matches ||
        new URLSearchParams(window.location.search).get('test-pwa') === 'true'
      setIsStandalone(Boolean(standalone))
    }
  }, [])

  // 2. Chỉ đăng ký các touch listener nếu chạy ở chế độ standalone
  useEffect(() => {
    if (!isStandalone) return

    const container = containerRef.current
    if (!container) return

    const handleTouchStart = (e) => {
      if (isRefreshingRef.current) return

      // Chỉ có thể bắt đầu kéo nếu người dùng đang ở trên cùng
      if (container.scrollTop <= 0) {
        startX.current = e.touches[0].pageX
        startY.current = e.touches[0].pageY
        isEligibleForPull.current = true
        isPulling.current = false
      } else {
        isEligibleForPull.current = false
        isPulling.current = false
      }
    }

    const handleTouchMove = (e) => {
      if (!isEligibleForPull.current || isRefreshingRef.current) return

      // Nếu người dùng đã cuộn xuống trong container thì hủy khả năng kéo
      if (container.scrollTop > 0) {
        isEligibleForPull.current = false
        isPulling.current = false
        setPullDistance(0)
        return
      }

      const currentX = e.touches[0].pageX
      const currentY = e.touches[0].pageY
      const diffY = currentY - startY.current
      const diffX = currentX - startX.current

      // Nếu vuốt lên (scroll down), để native scroll hoạt động tự nhiên
      if (diffY <= 0) {
        isPulling.current = false
        return
      }

      // Kiểm tra góc vuốt: nếu vuốt ngang nhiều hơn vuốt dọc thì bỏ qua
      if (Math.abs(diffX) > Math.abs(diffY) * 0.8) {
        isEligibleForPull.current = false
        return
      }

      // Chỉ kích hoạt khi vượt qua ngưỡng khoảng cách ban đầu để tránh chạm nhầm
      if (diffY > ACTIVATION_THRESHOLD) {
        if (e.cancelable) {
          e.preventDefault()
        }

        isPulling.current = true
        const effectiveDiff = diffY - ACTIVATION_THRESHOLD
        // Áp dụng cản trở lực kéo (resistance)
        const distance = Math.min(effectiveDiff * 0.42, PULL_THRESHOLD * 1.5)
        setPullDistance(distance)
      }
    }

    const handleTouchEnd = () => {
      isEligibleForPull.current = false

      if (!isPulling.current || isRefreshingRef.current) {
        setPullDistance(0)
        return
      }

      isPulling.current = false
      const currentDistance = pullDistanceRef.current

      if (currentDistance >= PULL_THRESHOLD) {
        setIsRefreshing(true)
        setPullDistance(PULL_THRESHOLD)

        const runRefresh = async () => {
          try {
            if (onRefreshRef.current) {
              await onRefreshRef.current()
            } else {
              // Fallback nếu không truyền hàm onRefresh: reload trang sau 600ms
              await new Promise((resolve) => setTimeout(resolve, 600))
              window.location.reload()
            }
          } catch (err) {
            console.error('Lỗi khi làm mới dữ liệu:', err)
          } finally {
            setIsRefreshing(false)
            setPullDistance(0)
          }
        }

        runRefresh()
      } else {
        setPullDistance(0)
      }
    }

    container.addEventListener('touchstart', handleTouchStart, { passive: true })
    container.addEventListener('touchmove', handleTouchMove, { passive: false })
    container.addEventListener('touchend', handleTouchEnd, { passive: true })
    container.addEventListener('touchcancel', handleTouchEnd, { passive: true })

    return () => {
      container.removeEventListener('touchstart', handleTouchStart)
      container.removeEventListener('touchmove', handleTouchMove)
      container.removeEventListener('touchend', handleTouchEnd)
      container.removeEventListener('touchcancel', handleTouchEnd)
    }
  }, [isStandalone])

  // Nếu không phải chế độ standalone, trả về container cuộn mặc định và không có hiệu ứng gì
  if (!isStandalone) {
    return (
      <div className="pull-to-refresh-container normal-scroll">
        {children}
      </div>
    )
  }

  const indicatorVisible = isRefreshing || pullDistance > 0

  return (
    <div ref={containerRef} className="pull-to-refresh-container">
      <div
        className="pull-to-refresh-indicator"
        style={{
          transform: isRefreshing
            ? 'translateY(28px) scale(1)'
            : indicatorVisible
            ? `translateY(${Math.min(pullDistance * 0.7, 44)}px) scale(${Math.min(0.6 + (pullDistance / PULL_THRESHOLD) * 0.4, 1)})`
            : 'translateY(-20px) scale(0.6)',
          opacity: isRefreshing
            ? 1
            : indicatorVisible
            ? Math.min(pullDistance / (PULL_THRESHOLD * 0.7), 1)
            : 0,
          transition: isPulling.current
            ? 'none'
            : 'transform 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.2s ease',
        }}
      >
        <div className="pull-indicator-circle">
          <RotateCw
            className={`pull-indicator-icon ${isRefreshing ? 'spinning' : ''}`}
            style={{
              transform: isRefreshing ? 'none' : `rotate(${pullDistance * 6}deg)`,
            }}
            size={18}
          />
        </div>
      </div>
      <div className="pull-to-refresh-content">
        {children}
      </div>
    </div>
  )
}
