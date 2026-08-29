import React, { useEffect, useMemo, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useShallow } from 'zustand/react/shallow'
import { useGameStore } from '../store/gameStore'
import { LoadingOverlay } from './LoadingOverlay'
import { ScoreGrid } from './score/ScoreGrid'
import { Header } from './Header'
import Image from "next/image"
import { useAppDataStore } from '../store/appDataStore'
import { updateMatchScores, uploadMatchImages } from '../api/backendService'
import { formatPlayedAt } from '../store/mappers/matchMapper'

const GAME_IMAGE_THEMES = [
  ['#b9d8d4', '#7fb0c8'],
  ['#e2c290', '#a76642'],
  ['#d7b08e', '#71472f'],
  ['#bad2a1', '#54855a'],
  ['#d7c2a4', '#8c613b'],
]

function getGameImageTheme(index) {
  return GAME_IMAGE_THEMES[index % GAME_IMAGE_THEMES.length]
}

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

export function GameScreen({ toast, onShowSetup, onShowHistory, matchToEdit, onCloseEdit, onSaveEdit }) {
  const router = useRouter()
  const pathname = usePathname()
  const didRedirectRef = useRef(false)
  const memoryImagesRef = useRef([])
  const {
    gameName: storeGameName,
    boardGameOverview: storeBoardGameOverview,
    playDateTime: storePlayDateTime,
    scoringType: storeScoringType,
    players: storePlayers,
    categories: storeCategories,
    publishedScores: storePublishedScores,
    publishScores,
    clearPlayers,
  } = useGameStore(
    useShallow((state) => ({
      gameName: state.gameName,
      boardGameOverview: state.boardGameOverview,
      playDateTime: state.playDateTime,
      scoringType: state.scoringType,
      players: state.players,
      categories: state.categories,
      publishedScores: state.publishedScores,
      publishScores: state.publishScores,
      clearPlayers: state.clearPlayers,
    }))
  )

  const isEditMode = Boolean(matchToEdit)

  const gameName = isEditMode ? matchToEdit.gameName : storeGameName
  const scoringType = isEditMode ? (matchToEdit.scoringType || 'COLUMN_BASED') : storeScoringType
  const players = isEditMode ? (matchToEdit.players || []) : storePlayers

  const displayThumbnail = isEditMode
    ? matchToEdit.thumbnailUrl
    : (storeBoardGameOverview?.thumbnail_url || storeBoardGameOverview?.thumbnailUrl || '')
  const displayGameName = isEditMode
    ? matchToEdit.gameName
    : (gameName || storeBoardGameOverview?.name || '')
  const displayPlayedAt = isEditMode
    ? matchToEdit.playedAt
    : (formatPlayedAt(storePlayDateTime) || formatPlayedAt(new Date()))


  const [draftScores, setDraftScores] = useState(() => {
    if (matchToEdit) {
      return JSON.parse(JSON.stringify(matchToEdit.scoreRows || []))
    }
    return buildDraft(storeCategories, storePlayers, storePublishedScores)
  })
  const [focusedCell, setFocusedCell] = useState(null)
  const [matchDescription, setMatchDescription] = useState(() => {
    if (matchToEdit) {
      return matchToEdit.description || ''
    }
    return ''
  })
  const [memoryImages, setMemoryImages] = useState(() => {
    if (matchToEdit) {
      return (matchToEdit.imageAttachments || []).map((img) => ({
        id: img.fileId || img.url || crypto.randomUUID(),
        previewUrl: img.url,
        url: img.url,
        isExisting: true,
        fileName: img.fileName,
        fileId: img.fileId,
      }))
    }
    return []
  })
  const [winnerPlayerId, setWinnerPlayerId] = useState(() => {
    if (matchToEdit) {
      if (matchToEdit.scoringType === 'WINNER_ONLY') {
        const winnerRow = (matchToEdit.scoreRows || []).find((r) => r.id === 'winner')
        if (winnerRow) {
          const winnerId = Object.keys(winnerRow.scores || {}).find(
            (pId) => Number(winnerRow.scores[pId]) === 1
          )
          return winnerId || ''
        }
      }
    }
    return ''
  })
  const [isSaving, setIsSaving] = useState(false)
  const isTotalScoreOnly = scoringType === 'TOTAL_SCORE_ONLY'
  const isWinnerOnly = scoringType === 'WINNER_ONLY'

  useEffect(() => {
    if (isEditMode) return
    if (pathname !== '/game') {
      didRedirectRef.current = false
      return
    }

    if (!gameName?.trim() && !didRedirectRef.current) {
      didRedirectRef.current = true
      router.replace('/')
    }
  }, [pathname, gameName, router, isEditMode])

  useEffect(() => {
    if (isEditMode && matchToEdit) {
      setDraftScores(JSON.parse(JSON.stringify(matchToEdit.scoreRows || [])))
      setMatchDescription(matchToEdit.description || '')
      setMemoryImages(
        (matchToEdit.imageAttachments || []).map((img) => ({
          id: img.fileId || img.url || crypto.randomUUID(),
          previewUrl: img.url,
          url: img.url,
          isExisting: true,
          fileName: img.fileName,
          fileId: img.fileId,
        }))
      )
      if (matchToEdit.scoringType === 'WINNER_ONLY') {
        const winnerRow = (matchToEdit.scoreRows || []).find((r) => r.id === 'winner')
        if (winnerRow) {
          const winnerId = Object.keys(winnerRow.scores || {}).find(
            (pId) => Number(winnerRow.scores[pId]) === 1
          )
          setWinnerPlayerId(winnerId || '')
        }
      } else {
        setWinnerPlayerId('')
      }
    } else if (!isEditMode) {
      setDraftScores(buildDraft(storeCategories, storePlayers, storePublishedScores))
      setMatchDescription('')
      setMemoryImages([])
      setWinnerPlayerId('')
    }
  }, [isEditMode, matchToEdit, storeCategories, storePlayers, storePublishedScores])

  useEffect(() => {
    if (isEditMode) return
    setWinnerPlayerId((current) => (
      players.some((player) => player.id === current) ? current : ''
    ))
  }, [players, isEditMode])

  useEffect(() => {
    memoryImagesRef.current = memoryImages
  }, [memoryImages])

  useEffect(() => () => {
    memoryImagesRef.current.forEach((image) => {
      if (!image.isExisting) URL.revokeObjectURL(image.previewUrl)
    })
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
    const isAllZero = totals.every((item) => item.total === 0)
    if (isAllZero) return new Set()
    const max = Math.max(...totals.map((item) => item.total))
    return new Set(
      totals
        .filter((item) => item.total === max)
        .flatMap((item) => [item.id, String(item.id)])
    )
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

    setIsSaving(true)
    try {
      if (isEditMode) {
        const newImages = memoryImages.filter((image) => !image.isExisting)
        let uploadedImages = []
        if (newImages.length > 0) {
          uploadedImages = await uploadMatchImages(newImages.map((image) => image.file))
        }

        const existingImages = memoryImages
          .filter((image) => image.isExisting)
          .map((image) => ({
            fileId: image.fileId,
            url: image.url,
            fileName: image.fileName,
          }))
        const finalImageAttachments = [...existingImages, ...uploadedImages]

        let playerScores = null
        if (!isWinnerOnly) {
          playerScores = players.map((player) => ({
            user_id: player.id,
            scores: draftScores.reduce((scores, row) => {
              if (row.type === 'text') return scores
              scores[row.id] = Number(row.scores?.[player.id] ?? 0)
              return scores
            }, {}),
          }))
        }

        const winnerIds = isWinnerOnly ? [winnerPlayerId] : null

        await updateMatchScores(matchToEdit.id, {
          description: matchDescription.trim(),
          ...(isWinnerOnly ? { winnerIds } : { playerScores }),
          imageAttachments: finalImageAttachments,
        })

        toast('Đã cập nhật kết quả bảng điểm')

        useAppDataStore.getState().invalidateHistory()
        useAppDataStore.getState().invalidateBoardGames()
        useAppDataStore.getState().invalidateUsers()
        useAppDataStore.getState().invalidateUserGameStats()

        memoryImages.forEach((image) => {
          if (!image.isExisting) URL.revokeObjectURL(image.previewUrl)
        })

        if (onSaveEdit) {
          await onSaveEdit()
        }
      } else {
        const winnerOnlyScores = [{
          id: 'winner',
          name: 'Winner',
          type: 'number',
          scores: players.reduce((scores, player) => {
            scores[player.id] = player.id === winnerPlayerId ? 1 : 0
            return scores
          }, {}),
        }]
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
      }
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Không thể lưu kết quả')
    } finally {
      setIsSaving(false)
    }
  }

  function handleClose() {
    if (isSaving) return

    memoryImages.forEach((image) => {
      if (!image.isExisting) URL.revokeObjectURL(image.previewUrl)
    })
    setMemoryImages([])
    clearPlayers()
    onShowSetup()
  }

  function handleCloseEdit() {
    if (isSaving) return

    memoryImages.forEach((image) => {
      if (!image.isExisting) URL.revokeObjectURL(image.previewUrl)
    })
    onCloseEdit()
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
      if (imageToRemove && !imageToRemove.isExisting) URL.revokeObjectURL(imageToRemove.previewUrl)
      return current.filter((image) => image.id !== imageId)
    })
  }

  return (
    <div className="screen score-screen score-entry-screen loading-shell" aria-busy={isSaving}>
      {isSaving ? <LoadingOverlay label="Đang lưu..." /> : null}
      <Header
        title={isEditMode ? 'Chỉnh Sửa Bảng Điểm' : 'Nhập Điểm'}
        onClose={isEditMode ? handleCloseEdit : handleClose}
        isCloseDisabled={isSaving}
      />

      <div className="score-content">
        <div className="score-entry-main-block">
          {displayGameName && (
            <section className="match-summary-strip">
              <div className="game-card-thumb detail-thumb" style={{ background: `linear-gradient(135deg, ${getGameImageTheme(1).join(', ')})` }}>
                {displayThumbnail ? (
                  <Image loading="lazy" alt="" width={78} height={78} src={displayThumbnail} />
                ) : (
                  <span>{displayGameName?.slice(0, 2).toUpperCase() || 'BG'}</span>
                )}
              </div>
              <div>
                <h2>{displayGameName}</h2>
                <p>{displayPlayedAt}</p>
              </div>
            </section>
          )}

          <section className="score-board">
            <ScoreGrid
              players={players}
              rows={draftScores}
              mode={isWinnerOnly ? 'WINNER_ONLY' : (isTotalScoreOnly ? 'TOTAL_SCORE_ONLY' : 'COLUMN_BASED')}
              stickyHeader
              showTotal={!isTotalScoreOnly && !isWinnerOnly}
              editable
              winningPlayerIds={winningPlayerIds}
              winnerPlayerId={winnerPlayerId}
              onWinnerChange={(playerId) => setWinnerPlayerId((current) => (
                current === playerId ? '' : playerId
              ))}
              getTotal={getDraftTotal}
              getInputValue={getInputValue}
              onCellChange={updateCell}
              onCellFocus={setFocusedCell}
              onCellBlur={() => setFocusedCell(null)}
            />
          </section>
        </div>



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
