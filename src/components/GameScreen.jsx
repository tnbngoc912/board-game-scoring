import React, { useEffect, useMemo, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useShallow } from 'zustand/react/shallow'
import { useGameStore } from '../store/gameStore'
import { LoadingOverlay } from './LoadingOverlay'
import { ScoreGrid } from './score/ScoreGrid'
import { Header } from './Header'
import Image from "next/image"

const MAX_MEMORY_IMAGES = 3

function buildDraft(categories, players, publishedScores) {
  return categories.map((category) => {
    const existing = publishedScores.find((entry) => entry.id === category.id)
    const type = category.type === 'text' ? 'text' : 'number'
    const scores = {}

    players.forEach((player) => {
      scores[player.id] = existing?.scores?.[player.id] ?? (type === 'text' ? '' : 0)
    })

    return {
      id: category.id,
      name: category.name,
      type,
      scores,
    }
  })
}

export function GameScreen({ toast, onShowSetup, onShowHistory }) {
  const router = useRouter()
  const pathname = usePathname()
  const didRedirectRef = useRef(false)
  const memoryImagesRef = useRef([])
  const {
    gameName,
    scoringType,
    players,
    categories,
    publishedScores,
    publishScores,
    clearPlayers,
  } = useGameStore(
    useShallow((state) => ({
      gameName: state.gameName,
      scoringType: state.scoringType,
      players: state.players,
      categories: state.categories,
      publishedScores: state.publishedScores,
      publishScores: state.publishScores,
      clearPlayers: state.clearPlayers,
    }))
  )
  const [draftScores, setDraftScores] = useState(() => buildDraft(categories, players, publishedScores))
  const [focusedCell, setFocusedCell] = useState(null)
  const [matchDescription, setMatchDescription] = useState('')
  const [memoryImages, setMemoryImages] = useState([])
  const [winnerPlayerId, setWinnerPlayerId] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const isTotalScoreOnly = scoringType === 'TOTAL_SCORE_ONLY'
  const isWinnerOnly = scoringType === 'WINNER_ONLY'

  useEffect(() => {
    if (pathname !== '/game') {
      didRedirectRef.current = false
      return
    }

    if (!gameName?.trim() && !didRedirectRef.current) {
      didRedirectRef.current = true
      router.replace('/')
    }
  }, [pathname, gameName, router])

  useEffect(() => {
    setDraftScores(buildDraft(categories, players, publishedScores))
  }, [categories, players, publishedScores])

  useEffect(() => {
    setWinnerPlayerId((current) => (
      players.some((player) => player.id === current) ? current : ''
    ))
  }, [players])

  useEffect(() => {
    memoryImagesRef.current = memoryImages
  }, [memoryImages])

  useEffect(() => () => {
    memoryImagesRef.current.forEach((image) => URL.revokeObjectURL(image.previewUrl))
  }, [])

  const winningPlayerIds = useMemo(() => {
    const totals = players.map((player) => ({
      id: player.id,
      total: draftScores.reduce((sum, row) => {
        if (row.type === 'text') return sum
        const score = Number(row.scores[player.id] ?? 0)
        return sum + (Number.isNaN(score) ? 0 : score)
      }, 0),
    }))
    if (totals.length === 0) return new Set()
    const max = Math.max(...totals.map((item) => item.total))
    return new Set(totals.filter((item) => item.total === max).map((item) => item.id))
  }, [players, draftScores])

  function updateCell(categoryId, playerId, value, type) {
    const nextValue = type === 'text'
      ? value
      : Number.parseInt(value, 10)

    setDraftScores((current) => current.map((row) => (
      row.id === categoryId
        ? {
          ...row,
          scores: {
            ...row.scores,
            [playerId]: type === 'text' || !Number.isNaN(nextValue) ? nextValue : 0,
          },
        }
        : row
    )))
  }

  function getInputValue(row, playerId) {
    const value = row.scores[playerId] ?? (row.type === 'text' ? '' : 0)
    if (row.type !== 'text' && focusedCell === `${row.id}:${playerId}` && value === 0) return ''
    return value
  }

  function getDraftTotal(playerId) {
    return draftScores.reduce((sum, row) => {
      if (row.type === 'text') return sum

      const score = Number(row.scores[playerId] ?? 0)
      return sum + (Number.isNaN(score) ? 0 : score)
    }, 0)
  }

  async function handleSave() {
    if (isSaving) return

    if (isWinnerOnly && !winnerPlayerId) {
      toast('Vui lòng chọn người thắng')
      return
    }

    const winnerOnlyScores = [{
      id: 'winner',
      name: 'Winner',
      type: 'number',
      scores: players.reduce((scores, player) => {
        scores[player.id] = player.id === winnerPlayerId ? 1 : 0
        return scores
      }, {}),
    }]
    setIsSaving(true)
    try {
      const ok = await publishScores(
        isWinnerOnly ? winnerOnlyScores : draftScores,
        matchDescription,
        memoryImages.map((image) => image.file)
      )
      toast(ok ? 'Đã lưu kết quả' : 'Không thể lưu kết quả')
      if (ok) {
        memoryImages.forEach((image) => URL.revokeObjectURL(image.previewUrl))
        setMemoryImages([])
        clearPlayers()
        onShowHistory()
      }
    } finally {
      setIsSaving(false)
    }
  }

  function handleClose() {
    if (isSaving) return

    memoryImages.forEach((image) => URL.revokeObjectURL(image.previewUrl))
    setMemoryImages([])
    clearPlayers()
    onShowSetup()
  }

  function handleAddMemoryImages(files) {
    const imageFiles = Array.from(files || []).filter((file) => file.type.startsWith('image/'))
    if (imageFiles.length === 0) return

    setMemoryImages((current) => {
      const availableSlots = MAX_MEMORY_IMAGES - current.length
      const nextImages = imageFiles.slice(0, availableSlots).map((file) => ({
        id: `${file.name}-${file.lastModified}-${crypto.randomUUID()}`,
        file,
        previewUrl: URL.createObjectURL(file),
      }))

      return [...current, ...nextImages]
    })
  }

  function handleRemoveMemoryImage(imageId) {
    setMemoryImages((current) => {
      const imageToRemove = current.find((image) => image.id === imageId)
      if (imageToRemove) URL.revokeObjectURL(imageToRemove.previewUrl)
      return current.filter((image) => image.id !== imageId)
    })
  }

  return (
    <div className="screen score-screen score-entry-screen loading-shell" aria-busy={isSaving}>
      {isSaving ? <LoadingOverlay label="Đang lưu..." /> : null}
      <Header title="Nhập Điểm" onClose={handleClose} isCloseDisabled={isSaving} />

      <div className="score-content">
        {isWinnerOnly ? (
          <section className="winner-picker-card" aria-label="Chon nguoi thang">
            {players.map((player) => (
              <label key={player.id} className="winner-picker-row">
                <span>{player.name}</span>
                <input
                  type="checkbox"
                  checked={winnerPlayerId === player.id}
                  onChange={() => setWinnerPlayerId((current) => (
                    current === player.id ? '' : player.id
                  ))}
                />
              </label>
            ))}
          </section>
        ) : (
          <section className="score-board">
            <ScoreGrid
              players={players}
              rows={draftScores}
              mode={isTotalScoreOnly ? 'TOTAL_SCORE_ONLY' : 'COLUMN_BASED'}
              stickyHeader
              showTotal={!isTotalScoreOnly}
              editable
              winningPlayerIds={winningPlayerIds}
              getTotal={getDraftTotal}
              getInputValue={getInputValue}
              onCellChange={updateCell}
              onCellFocus={setFocusedCell}
              onCellBlur={() => setFocusedCell(null)}
            />
          </section>
        )}


        <textarea
          className="match-description"
          value={matchDescription}
          onChange={(event) => setMatchDescription(event.target.value)}
          placeholder="Nhập mô tả ván chơi (tùy chọn)"
        />

        <MemoryImageUploader
          images={memoryImages}
          disabled={isSaving}
          onAddImages={handleAddMemoryImages}
          onRemoveImage={handleRemoveMemoryImage}
        />

        <button className="score-save-btn" onClick={handleSave} disabled={isSaving}>
          {isSaving ? 'Đang lưu...' : 'Lưu kết quả'}
        </button>
      </div>
    </div>
  )
}

function MemoryImageUploader({ images, disabled, onAddImages, onRemoveImage }) {
  const inputRef = useRef(null)
  const canAddMore = images.length < MAX_MEMORY_IMAGES

  function handleInputChange(event) {
    onAddImages(event.target.files)
    event.target.value = ''
  }

  return (
    <section className="score-memory-section" aria-label="Hình ảnh kỉ niệm">
      <h2>Hình ảnh kỉ niệm</h2>
      <div className="score-memory-grid">
        {images.map((image) => (
          <div key={image.id} className="score-memory-card">
            <img src={image.previewUrl} alt="Hình ảnh kỉ niệm" />
            <button
              type="button"
              className="score-memory-remove"
              onClick={() => onRemoveImage(image.id)}
              disabled={disabled}
              aria-label="Xóa hình ảnh"
            >
              <Image src="/black-close-icon.svg" alt="" width={24} height={24} />
            </button>
          </div>
        ))}

        {canAddMore ? (
          <button
            type="button"
            className="score-memory-upload"
            onClick={() => inputRef.current?.click()}
            disabled={disabled}
            aria-label="Tải lên hình ảnh kỉ niệm"
          >
            <Image src="/icon-upload.svg" alt="" width={28} height={28} />
            <span>Tải lên</span>
          </button>
        ) : null}
      </div>
      <input
        ref={inputRef}
        className="score-memory-input"
        type="file"
        accept="image/*"
        multiple
        disabled={disabled || !canAddMore}
        onChange={handleInputChange}
      />
    </section>
  )
}
