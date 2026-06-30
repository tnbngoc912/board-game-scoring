import { useState, useEffect } from 'react'

export function useIosInstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false)

  useEffect(() => {
    // 1. Kiểm tra môi trường browser
    if (typeof window === 'undefined' || typeof navigator === 'undefined') return

    // 2. Hỗ trợ chế độ test nhanh trên mọi trình duyệt (kể cả máy tính) khi có query ?test-pwa=true
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get('test-pwa') === 'true') {
      setShowPrompt(true)
      document.documentElement.classList.add('is-standalone')
      return
    }

    // 3. Kiểm tra xem có phải iOS (iPhone, iPad, iPod) không
    const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream

    // 4. Kiểm tra xem ứng dụng đã chạy ở chế độ standalone (đã thêm vào màn hình chính) chưa
    const isStandalone = window.navigator.standalone || 
                        window.matchMedia('(display-mode: standalone)').matches

    if (isStandalone) {
      document.documentElement.classList.add('is-standalone')
    }

    // 5. Kiểm tra xem người dùng đã từ chối hiển thị gợi ý này trước đó chưa
    const promptDismissed = localStorage.getItem('iosPwaPromptDismissed') === 'true'

    // Hiển thị gợi ý nếu: là iOS, chưa chạy standalone, và chưa từ chối trước đó
    if (isIos && !isStandalone && !promptDismissed) {
      setShowPrompt(true)
    }
  }, [])

  const dismissPrompt = () => {
    localStorage.setItem('iosPwaPromptDismissed', 'true')
    setShowPrompt(false)
  }

  return { showPrompt, dismissPrompt }
}

