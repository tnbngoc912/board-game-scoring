'use client'

import React from 'react'
import { useIosInstallPrompt } from '../hooks/useIosInstallPrompt'

export function IosInstallPrompt() {
  const { showPrompt, dismissPrompt } = useIosInstallPrompt()

  if (!showPrompt) return null

  return (
    <div className="ios-install-prompt" role="dialog" aria-labelledby="ios-prompt-title">
      <div className="ios-install-prompt-content">
        <h3 id="ios-prompt-title" style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: 'var(--color-text)' }}>
          Thêm vào màn hình chính
        </h3>
        <p className="ios-install-prompt-text">
          Cài đặt <strong>BG Score</strong> vào điện thoại để trải nghiệm mượt mà như ứng dụng gốc:
        </p>
        <ol style={{ margin: 0, paddingLeft: '20px', fontSize: '13.5px', color: 'var(--color-text)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <li>
            Nhấn vào nút <strong>Chia sẻ</strong>
            <span className="ios-install-prompt-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13"/>
              </svg>
            </span>
            ở thanh công cụ phía dưới Safari.
          </li>
          <li>
            Cuộn xuống dưới và chọn <strong>Thêm vào MH chính (Add to Home Screen)</strong>.
          </li>
        </ol>
        <div className="ios-install-prompt-buttons">
          <button 
            type="button" 
            className="ios-install-prompt-btn-dismiss" 
            onClick={dismissPrompt}
          >
            Tôi đã hiểu
          </button>
        </div>
      </div>
    </div>
  )
}
