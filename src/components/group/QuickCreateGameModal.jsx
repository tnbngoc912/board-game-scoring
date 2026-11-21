import React, { useState } from 'react'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { quickCreateGroupBoardGame, uploadMatchImages } from '../../api/backendService'

export function QuickCreateGameModal({
  isOpen,
  groupId,
  onClose,
  onCreated,
  toast,
}) {
  const [name, setName] = useState('')
  const [thumbnailUrl, setThumbnailUrl] = useState('')
  const [minPlayers, setMinPlayers] = useState(2)
  const [maxPlayers, setMaxPlayers] = useState(6)
  const [minPlayTime, setMinPlayTime] = useState(15)
  const [maxPlayTime, setMaxPlayTime] = useState(60)
  const [description, setDescription] = useState('')
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isOpen) return null

  async function handleFileChange(event) {
    const file = event.target.files?.[0]
    if (!file) return

    setIsUploadingImage(true)
    try {
      const uploaded = await uploadMatchImages([file])
      if (uploaded?.[0]?.url) {
        setThumbnailUrl(uploaded[0].url)
        toast?.('Đã tải ảnh bìa lên thành công')
      }
    } catch (error) {
      toast?.(error?.message || 'Không thể tải ảnh bìa lên')
    } finally {
      setIsUploadingImage(false)
      if (event.target) {
        event.target.value = ''
      }
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const cleanName = name.trim()
    if (!cleanName) {
      toast?.('Vui lòng nhập tên board game')
      return
    }
    if (!groupId) {
      toast?.('Chưa xác định nhóm hiện tại')
      return
    }

    setIsSubmitting(true)
    try {
      const created = await quickCreateGroupBoardGame(groupId, {
        name: cleanName,
        thumbnail_url: thumbnailUrl.trim() || undefined,
        min_players: Number(minPlayers) || 2,
        max_players: Number(maxPlayers) || 6,
        min_play_time: Number(minPlayTime) || 15,
        max_play_time: Number(maxPlayTime) || 60,
        description: description.trim() || undefined,
      })

      setName('')
      setThumbnailUrl('')
      setDescription('')
      toast?.(`Đã tạo "${created.name}" và thêm vào Tủ game nhóm!`)
      onCreated?.(created)
      onClose?.()
    } catch (error) {
      toast?.(error?.message || 'Không thể tạo game nhanh')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="group-modal-backdrop" onClick={onClose}>
      <div className="group-modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="group-modal-header">
          <h2>Tạo Game Nhanh Cho Nhóm</h2>
          <button type="button" className="group-modal-close" onClick={onClose} aria-label="Đóng">
            ✕
          </button>
        </div>

        <div className="group-modal-body">
          <div className="group-note-box">
            Game tạo nhanh sẽ mặc định tính theo <strong>Điểm tổng</strong> để nhóm chơi và ghi điểm ngay lập tức, đồng thời gửi yêu cầu duyệt lên Thư viện chung.
          </div>

          <form className="group-form" onSubmit={handleSubmit}>
            <div className="group-field">
              <label htmlFor="quick-game-name">Tên Board Game *</label>
              <Input
                id="quick-game-name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ví dụ: Uno Flip, Mèo Nổ..."
              />
            </div>

            <div className="group-field">
              <label htmlFor="quick-game-file">Ảnh bìa (Tải từ máy)</label>
              {thumbnailUrl ? (
                <div className="quick-game-image-preview-wrap">
                  <img src={thumbnailUrl} alt="Ảnh bìa xem trước" className="quick-game-image-preview" />
                  <div className="quick-game-preview-actions">
                    <label className="group-action-chip primary" style={{ cursor: 'pointer', margin: 0 }}>
                      {isUploadingImage ? 'Đang tải...' : 'Đổi ảnh'}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        disabled={isUploadingImage}
                        style={{ display: 'none' }}
                      />
                    </label>
                    <button
                      type="button"
                      className="group-btn-danger"
                      onClick={() => setThumbnailUrl('')}
                      disabled={isUploadingImage}
                    >
                      Gỡ ảnh
                    </button>
                  </div>
                </div>
              ) : (
                <input
                  id="quick-game-file"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  disabled={isUploadingImage}
                />
              )}
              {isUploadingImage && !thumbnailUrl ? (
                <span className="group-member-sub">Đang tải ảnh lên...</span>
              ) : null}
            </div>

            <div className="group-field-row">
              <div className="group-field">
                <label htmlFor="quick-min-players">Số người tối thiểu</label>
                <input
                  id="quick-min-players"
                  type="number"
                  min={1}
                  max={20}
                  value={minPlayers}
                  onChange={(e) => setMinPlayers(e.target.value)}
                />
              </div>
              <div className="group-field">
                <label htmlFor="quick-max-players">Số người tối đa</label>
                <input
                  id="quick-max-players"
                  type="number"
                  min={1}
                  max={30}
                  value={maxPlayers}
                  onChange={(e) => setMaxPlayers(e.target.value)}
                />
              </div>
            </div>

            <div className="group-field-row">
              <div className="group-field">
                <label htmlFor="quick-min-time">Thời gian tối thiểu (phút)</label>
                <input
                  id="quick-min-time"
                  type="number"
                  min={5}
                  max={600}
                  value={minPlayTime}
                  onChange={(e) => setMinPlayTime(e.target.value)}
                />
              </div>
              <div className="group-field">
                <label htmlFor="quick-max-time">Thời gian tối đa (phút)</label>
                <input
                  id="quick-max-time"
                  type="number"
                  min={5}
                  max={600}
                  value={maxPlayTime}
                  onChange={(e) => setMaxPlayTime(e.target.value)}
                />
              </div>
            </div>

            <div className="group-field">
              <label htmlFor="quick-game-desc">Mô tả ngắn (Tùy chọn)</label>
              <textarea
                id="quick-game-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ghi chú ngắn về cách chơi hoặc tính điểm..."
              />
            </div>

            <Button
              variant="primary"
              type="submit"
              disabled={isSubmitting || isUploadingImage}
              style={{ width: '100%', marginTop: 'var(--space-3)' }}
            >
              {isSubmitting ? 'Đang tạo game...' : 'Tạo game & Thêm vào Tủ nhóm'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
