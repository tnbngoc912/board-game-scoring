import React, { useState, useEffect, useRef } from 'react'
import { RotateCw } from 'lucide-react'
import '../../styles/components/pull-to-refresh.css'

export function PullToRefresh({ children, onRefresh }) {
  const [isStandalone, setIsStandalone] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const containerRef = useRef(null)
  const startY = useRef(0)
  const isPulling = useRef(false)

  const PULL_THRESHOLD = 60 // Khoảng cách kéo tối thiểu bằng px để kích hoạt refresh

  // 1. Kiểm tra xem ứng dụng có đang chạy ở chế độ standalone hay không
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const standalone = window.navigator.standalone || 
                         window.matchMedia('(display-mode: standalone)').matches ||
                         new URLSearchParams(window.location.search).get('test-pwa') === 'true'
      setIsStandalone(standalone)
    }
  }, [])

  // 2. Chỉ đăng ký các touch listener nếu chạy ở chế độ standalone
  useEffect(() => {
    if (!isStandalone) return

    const container = containerRef.current
    if (!container) return

    const handleTouchStart = (e) => {
      // Chỉ bắt đầu kéo nếu người dùng đang cuộn ở trên cùng (scrollTop === 0)
      if (container.scrollTop === 0) {
        startY.current = e.touches[0].pageY
        isPulling.current = true
      } else {
        isPulling.current = false
      }
    }

    const handleTouchMove = (e) => {
      if (!isPulling.current || isRefreshing) return

      const currentY = e.touches[0].pageY
      const diff = currentY - startY.current

      // Kéo từ trên xuống dưới
      if (diff > 0) {
        // Ngăn chặn hành vi cuộn quá tay (bounce) mặc định của iOS Safari
        if (e.cancelable) {
          e.preventDefault()
        }
        
        // Áp dụng cản trở lực kéo (resistance) để cho cảm giác đầm tay hơn
        const distance = Math.min(diff * 0.45, PULL_THRESHOLD * 1.6)
        setPullDistance(distance)
      }
    }

    const handleTouchEnd = () => {
      if (!isPulling.current || isRefreshing) return
      isPulling.current = false

      if (pullDistance >= PULL_THRESHOLD) {
        setIsRefreshing(true)
        setPullDistance(PULL_THRESHOLD)

        const runRefresh = async () => {
          try {
            if (onRefresh) {
              await onRefresh()
            } else {
              // Fallback nếu không truyền hàm onRefresh: reload trang sau 800ms
              await new Promise((resolve) => setTimeout(resolve, 800))
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

    return () => {
      container.removeEventListener('touchstart', handleTouchStart)
      container.removeEventListener('touchmove', handleTouchMove)
      container.removeEventListener('touchend', handleTouchEnd)
    }
  }, [pullDistance, isRefreshing, onRefresh, isStandalone])

  // Nếu không phải chế độ standalone, trả về container cuộn mặc định và không có hiệu ứng gì
  if (!isStandalone) {
    return (
      <div className="pull-to-refresh-container normal-scroll">
        {children}
      </div>
    )
  }

  return (
    <div ref={containerRef} className="pull-to-refresh-container">
      <div
        className="pull-to-refresh-indicator"
        style={{
          transform: `translateY(${pullDistance}px)`,
          opacity: Math.min(pullDistance / PULL_THRESHOLD, 1),
          transition: isPulling.current ? 'none' : 'transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.2s ease',
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
      <div
        className="pull-to-refresh-content"
        style={{
          transform: `translateY(${pullDistance}px)`,
          transition: isPulling.current ? 'none' : 'transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        }}
      >
        {children}
      </div>
    </div>
  )
}
