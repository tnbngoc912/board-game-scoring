import React from 'react'
import Image from 'next/image'
import { Button } from './Button'

/**
 * Component EmptyState hiển thị trạng thái trống (không tìm thấy kết quả, danh sách trống).
 * Hỗ trợ cả giao diện kiểu mới (với ảnh minh họa và nút hành động tùy chỉnh) 
 * và giao diện kiểu cũ (tương thích ngược hoàn toàn với các phần code hiện có).
 */
export function EmptyState({
  imageSrc,
  title = 'Không tìm thấy kết quả nào!',
  description,
  actionText,
  onAction,
  action,
  imageWidth = 120,
  imageHeight = 120,
}) {
  // Giao diện kiểu mới nếu có ảnh minh họa
  if (imageSrc) {
    return (
      <div className="custom-empty-state-container">
        <div className="custom-empty-state-image">
          <Image
            src={imageSrc}
            alt={title}
            width={imageWidth}
            height={imageHeight}
            priority
          />
        </div>
        <div className="custom-empty-state-text">{title}</div>
        {description && <div className="custom-empty-state-description">{description}</div>}
        {actionText && onAction && (
          <Button variant="primary" className="custom-empty-state-btn" onClick={onAction}>
            {actionText}
          </Button>
        )}
        {action}
      </div>
    )
  }

  // Giao diện mặc định kiểu cũ để giữ tương thích ngược
  return (
    <div className="paper-card empty-state">
      <h2>{title}</h2>
      {description ? <p>{description}</p> : null}
      {action || null}
    </div>
  )
}
