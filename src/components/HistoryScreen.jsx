import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useShallow } from 'zustand/react/shallow'
import { useGameStore } from '../store/gameStore'
import { useAppDataStore } from '../store/appDataStore'
import { deleteMatch, getMatch } from '../api/backendService'
import { LoadingOverlay } from './LoadingOverlay'
import { GameCard } from './GameCard'
import Image from "next/image"
import { ScoreGrid } from "./score/ScoreGrid"
import { Header } from './Header'
import { useAuthStore } from '../store/authStore'
import { HistoryFilterPanel } from './HistoryFilterPanel'
import { SearchBar } from './ui/SearchBar'

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

function getSortableTime(entry) {
  if (entry.playedAtRaw) return new Date(entry.playedAtRaw).getTime() || 0
  return entry.id ? Number(String(entry.id).slice(0, 8)) || 0 : 0
}

function getWinner(entry) {
  if (entry.winner) return entry.winner
  return [...(entry.players || [])].sort((a, b) => b.total - a.total)[0] || null
}

function getTopWinners(entry) {
  const players = entry.players || []
  if (players.length === 0) return []

  const maxTotal = players.reduce((max, player) => Math.max(max, Number(player.total) || 0), Number.NEGATIVE_INFINITY)
  if (!Number.isFinite(maxTotal)) return []

  return players.filter((player) => (Number(player.total) || 0) === maxTotal)
}

function formatWinner(entry) {
  const topWinners = getTopWinners(entry)
  if (topWinners.length === 0) return 'Chua co nguoi thang'

  const names = topWinners.map((player) => player.name).join(', ')
  const total = Number(topWinners[0]?.total) || 0
  return `${names} - ${total} diem`
}

function formatHistoryDateOnly(entry) {
  const raw = entry.playedAtRaw || entry.playedAt
  const date = raw ? new Date(raw) : null
  if (date && !Number.isNaN(date.getTime())) {
    return date.toLocaleDateString('vi-VN')
  }

  const datePart = String(entry.playedAt || '').match(/(\d{1,2}\/\d{1,2}\/\d{4})/)
  return datePart?.[1] || ''
}

function formatHistoryTitle(entry) {
  const description = String(entry.description || '').trim()
  if (description) return description

  return entry.gameName
}

function getComparableId(value) {
  if (!value) return ''
  if (typeof value === 'object') return String(value.id || value._id || value.match_id || '')
  return String(value)
}

function findBoardGameForMatch(match, boardGames) {
  const gameId = getComparableId(match.gameId)
  if (gameId) {
    const byId = boardGames.find((game) => getComparableId(game.id) === gameId)
    if (byId) return byId
  }

  return boardGames.find((game) => game.name === match.gameName) || null
}

function alignScoreRowsWithBoardGame(match, boardGames) {
  const boardGame = findBoardGameForMatch(match, boardGames)
  const categories = boardGame?.categories || []
  if (categories.length === 0) return match

  const rowsById = new Map((match.scoreRows || []).map((row) => [String(row.id), row]))
  const alignedRows = categories.map((category) => {
    const existing = rowsById.get(String(category.id))
    return {
      ...category,
      scores: existing?.scores || {},
    }
  })

  return {
    ...match,
    scoreRows: alignedRows,
  }
}

function attachMatchThumbnail(match, boardGames) {
  const boardGame = findBoardGameForMatch(match, boardGames)
  return {
    ...match,
    thumbnailUrl: match.thumbnailUrl || boardGame?.thumbnail_url || '',
    scoringType: match.scoringType || boardGame?.scoringType || boardGame?.scoring_type || 'COLUMN_BASED',
  }
}

export function HistoryScreen({ onNewGame, onShowSetup, toast }) {
  const router = useRouter()
  const pathname = usePathname()
  const [selectedGameName, setSelectedGameName] = useState('')
  const [selectedPlayerName, setSelectedPlayerName] = useState('')
  const [myMatchesOnly, setMyMatchesOnly] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [selectedMatch, setSelectedMatch] = useState(null)
  const [matchToDelete, setMatchToDelete] = useState(null)
  const [isDetailMenuOpen, setIsDetailMenuOpen] = useState(false)
  const [isLoadingMatchDetail, setIsLoadingMatchDetail] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [lightboxImageIndex, setLightboxImageIndex] = useState(null)
  const detailScreenRef = useRef(null)
  const resetBoard = useGameStore((state) => state.resetBoard)
  
  const currentUser = useAuthStore((state) => state.user)

  const {
    history,
    boardGames,
    users,
    isLoadingHistory,
    fetchHistory,
    fetchBoardGames,
    fetchUsers,
    removeHistoryMatch,
  } = useAppDataStore(
    useShallow((state) => ({
      history: state.history,
      boardGames: state.boardGames,
      users: state.users,
      isLoadingHistory: state.isLoadingHistory,
      fetchHistory: state.fetchHistory,
      fetchBoardGames: state.fetchBoardGames,
      fetchUsers: state.fetchUsers,
      removeHistoryMatch: state.removeHistoryMatch,
    }))
  )
  const routeDetailMatchId = useMemo(() => {
    const match = pathname.match(/^\/history\/(.+)$/)
    return match?.[1] || ''
  }, [pathname])

  useEffect(() => {
    if (!selectedMatch) return

    requestAnimationFrame(() => {
      detailScreenRef.current?.scrollTo({ top: 0, left: 0 })
      window.scrollTo({ top: 0, left: 0 })
    })
    setLightboxImageIndex(null)
  }, [selectedMatch])

  useEffect(() => {
    async function loadHistory() {
      try {
        await Promise.all([fetchHistory(), fetchBoardGames(), fetchUsers()])
      } catch {
        toast('Không tải được lịch sử ván chơi')
      }
    }

    loadHistory()
  }, [fetchBoardGames, fetchHistory, fetchUsers, toast])

  const historyWithThumbnails = useMemo(
    () => history
      .map((entry) => attachMatchThumbnail(entry, boardGames))
      .sort((a, b) => getSortableTime(b) - getSortableTime(a)),
    [boardGames, history]
  )

  const gameOptions = useMemo(
    () => [...new Set(historyWithThumbnails.map((entry) => entry.gameName).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'vi')),
    [historyWithThumbnails]
  )

  const playerOptions = useMemo(
    () => users.map((u) => u.name).filter(Boolean).sort((a, b) => a.localeCompare(b, 'vi')),
    [users]
  )

  const filteredHistory = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase()

    return historyWithThumbnails.filter((entry) => {
      const matchesGame = !selectedGameName || entry.gameName === selectedGameName
      const matchesSearch = !keyword || (entry.description || '').toLowerCase().includes(keyword)
      const matchesPlayer = !selectedPlayerName || (entry.players || []).some(
        (p) => p.name === selectedPlayerName
      )
      const matchesMyMatches = !myMatchesOnly || (currentUser && (entry.players || []).some(
        (p) => p.name === currentUser.name || String(p.id) === String(currentUser.id)
      ))
      return matchesGame && matchesSearch && matchesPlayer && matchesMyMatches
    })
  }, [historyWithThumbnails, searchTerm, selectedGameName, selectedPlayerName, myMatchesOnly, currentUser])

  const hasFilters = Boolean(selectedGameName || selectedPlayerName || myMatchesOnly || searchTerm.trim())

  const handleNewGame = useCallback(async () => {
    const ok = await resetBoard()
    if (ok) {
      toast('Đã tạo ván mới')
      onNewGame()
    } else {
      toast('Không thể tạo ván mới')
    }
  }, [onNewGame, resetBoard, toast])

  const openMatchDetail = useCallback(async (entry, options = {}) => {
    const { syncRoute = true } = options
    if (syncRoute) router.push(`/history/${entry.id}`)
    setIsDetailMenuOpen(false)
    setIsLoadingMatchDetail(true)

    try {
      const [detail, cachedBoardGames] = await Promise.all([getMatch(entry.id), fetchBoardGames()])
      const matchWithRows = detail.scoreRows?.length ? detail : { ...detail, scoreRows: entry.scoreRows || [] }
      const normalizedMatch = detail.scoreRows?.length
        ? matchWithRows
        : alignScoreRowsWithBoardGame(matchWithRows, cachedBoardGames)
      setSelectedMatch(attachMatchThumbnail(normalizedMatch, cachedBoardGames))
    } catch {
      toast('Khong tai duoc chi tiet bang diem')
    } finally {
      setIsLoadingMatchDetail(false)
    }
  }, [fetchBoardGames, router, toast])

  useEffect(() => {
    if (!routeDetailMatchId) {
      if (selectedMatch) {
        setSelectedMatch(null)
        setIsDetailMenuOpen(false)
      }
      return
    }

    if (String(selectedMatch?.id || '') === routeDetailMatchId) return

    const entry = historyWithThumbnails.find((item) => String(item.id) === routeDetailMatchId)
    if (!entry) return

    openMatchDetail(entry, { syncRoute: false })
  }, [routeDetailMatchId, selectedMatch, historyWithThumbnails])

  const clearFilters = useCallback(() => {
    setSelectedGameName('')
    setSelectedPlayerName('')
    setMyMatchesOnly(false)
    setSearchTerm('')
  }, [])

  const confirmDelete = useCallback(async () => {
    if (!matchToDelete) return

    setIsDeleting(true)
    try {
      await deleteMatch(matchToDelete.id)
      removeHistoryMatch(matchToDelete.id)
      if (selectedMatch?.id === matchToDelete.id) setSelectedMatch(null)
      setMatchToDelete(null)
      setIsDetailMenuOpen(false)
      toast('Đã xóa bảng điểm')
    } catch {
      toast('Không thể xóa bảng điểm')
    } finally {
      setIsDeleting(false)
    }
  }, [matchToDelete, removeHistoryMatch, selectedMatch?.id, toast])

  if (routeDetailMatchId && !selectedMatch) {
    return (
      <div className="screen score-screen history-detail-screen loading-shell" aria-busy="true">
        <LoadingOverlay label="Đang tải..." />
      </div>
    )
  }

  if (selectedMatch) {
    const winner = getWinner(selectedMatch)
    const players = selectedMatch.players || []
    const maxTotal = players.reduce((max, player) => Math.max(max, Number(player.total) || 0), Number.NEGATIVE_INFINITY)
    const winningPlayerIds = new Set(
      players
        .filter((player) => (Number(player.total) || 0) === maxTotal)
        .map((player) => player.id)
    )
    const scoreRows = selectedMatch.scoreRows || []
    const scoringType = selectedMatch.scoringType || 'COLUMN_BASED'
    const isTotalScoreOnly = scoringType === 'TOTAL_SCORE_ONLY'
    const isWinnerOnly = scoringType === 'WINNER_ONLY'
    const displayedScoreRows = isTotalScoreOnly ? scoreRows.slice(0, 1) : scoreRows
    const memoryImages = (selectedMatch.imageAttachments || []).filter((image) => image?.url)

    return (
      <div ref={detailScreenRef} className="screen score-screen history-detail-screen loading-shell" aria-busy={isLoadingMatchDetail}>
        {isLoadingMatchDetail ? <LoadingOverlay label="Đang tải..." /> : null}
        <Header title="Bảng Điểm"
          onBack={() => {
            setIsDetailMenuOpen(false)
            router.push('/history')
          }}
        />

        <DetailActionMenu
          isOpen={isDetailMenuOpen}
          onClose={() => setIsDetailMenuOpen(false)}
          onEdit={() => {
            setIsDetailMenuOpen(false)
            toast('Tính năng chỉnh sửa sẽ được bổ sung')
          }}
          onDelete={() => {
            setIsDetailMenuOpen(false)
            setMatchToDelete(selectedMatch)
          }}
        />

        <div className={isDetailMenuOpen ? 'detail-content dimmed' : 'detail-content'}>
          <section className="match-summary-strip">
            <div className="game-card-thumb detail-thumb" style={{ background: `linear-gradient(135deg, ${getGameImageTheme(1).join(', ')})` }}>
              {selectedMatch.thumbnailUrl ? (
                <Image loading="lazy" alt="" width={78} height={78} src={selectedMatch.thumbnailUrl} />
              ) : (
                <span>{selectedMatch.gameName?.slice(0, 2).toUpperCase() || 'BG'}</span>
              )}
            </div>
            <div>
              <h2>{selectedMatch.gameName}</h2>
              <p>{selectedMatch.playedAt}</p>
            </div>
          </section>

          {isWinnerOnly ? (
            <section className="winner-only-list history-winner-only-card" aria-label="Nguoi choi va nguoi thang">
              {players.map((player) => {
                const isWinner = winner?.id === player.id

                return (
                  <div key={player.id} className={`winner-only-player${isWinner ? ' winner' : ''}`}>
                    <span>{player.name}</span>
                    <div className="winner-only-crown-row" aria-label={isWinner ? 'Nguoi thang' : undefined}>
                      {isWinner ? <Image src="/crown.svg" alt="" width={32} height={28} /> : null}
                    </div>
                  </div>
                )
              })}
            </section>
          ) : (
            <section className="score-board history-score-board">
              <ScoreGrid
                players={players}
                rows={displayedScoreRows}
                mode={isTotalScoreOnly ? "TOTAL_SCORE_ONLY" : "COLUMN_BASED"}
                stickyHeader
                showTotal={!isTotalScoreOnly}
                winningPlayerIds={winningPlayerIds}
                editable={false}
              />
            </section>
          )}

          {selectedMatch.description ? (
            <div className="history-detail-note">{selectedMatch.description}</div>
          ) : null}

          {memoryImages.length ? (
            <section className="history-memory-section" aria-label="Hình ảnh kỉ niệm">
              <h2>Hình ảnh kỉ niệm</h2>
              <div className="history-memory-grid">
                {memoryImages.map((image, index) => (
                  <button
                    key={image.fileId || image.url || index}
                    className="history-memory-card"
                    type="button"
                    onClick={() => setLightboxImageIndex(index)}
                    aria-label={`Mở hình ảnh kỉ niệm ${index + 1}`}
                  >
                    <Image
                      src={image.url}
                      alt={image.fileName || 'Hình ảnh kỉ niệm'}
                      width={320}
                      height={320}
                      loading="lazy"
                    />
                  </button>
                ))}
              </div>
            </section>
          ) : null}
        </div>

        <MemoryImageLightbox
          images={memoryImages}
          activeIndex={lightboxImageIndex}
          onClose={() => setLightboxImageIndex(null)}
          onChange={setLightboxImageIndex}
        />

        {isDetailMenuOpen ? (
          <button
            className="detail-menu-dismiss"
            type="button"
            onClick={() => setIsDetailMenuOpen(false)}
            aria-label="Dong tuy chon"
          />
        ) : null}

        <DeleteConfirmDialog
          entry={matchToDelete}
          isDeleting={isDeleting}
          onCancel={() => setMatchToDelete(null)}
          onConfirm={confirmDelete}
        />
      </div>
    )
  }


  return (
    <div className="screen history-screen">
      <Header />

      <div className="screen-inner history-content">
        <section className="home-search-panel" aria-label="Tim va loc lich su">
          <SearchBar
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            onClear={() => setSearchTerm('')}
            placeholder="Tìm ván chơi"
            isFilterOpen={isFilterOpen}
            onFilterToggle={() => setIsFilterOpen((value) => !value)}
            hasFilters={hasFilters}
          />


          <HistoryFilterPanel
            selectedGameName={selectedGameName}
            setSelectedGameName={setSelectedGameName}
            gameOptions={gameOptions}
            selectedPlayerName={selectedPlayerName}
            setSelectedPlayerName={setSelectedPlayerName}
            playerOptions={playerOptions}
            myMatchesOnly={myMatchesOnly}
            setMyMatchesOnly={setMyMatchesOnly}
            onClear={clearFilters}
            isOpen={isFilterOpen}
          />
        </section>

        <div className="history-list" aria-busy={isLoadingHistory}>
          {isLoadingHistory ? (
            <>
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="game-card game-card--history game-card-skeleton" aria-hidden="true">
                  <div className="game-card-thumb" />
                  <div className="game-card-info">
                    <span className="game-card-skeleton-line title" />
                    <span className="game-card-skeleton-line" />
                    <span className="game-card-skeleton-line short" />
                  </div>
                </div>
              ))}
            </>
          ) : null}

          {!isLoadingHistory && historyWithThumbnails.length === 0 ? (
            <div className="paper-card history-empty-state">
              <h2>Chua co van dau nao duoc ghi lai</h2>
              <p>Luu ket qua van choi dau tien de xem lai bang diem tai day.</p>
              <button className="score-save-btn history-empty-btn" onClick={handleNewGame}>Tao van moi</button>
            </div>
          ) : null}

          {!isLoadingHistory && historyWithThumbnails.length > 0 && filteredHistory.length === 0 ? (
            <div className="paper-card history-empty-state">
              <h2>Khong tim thay van dau</h2>
              <p>Thu tu khoa khac hoac bo loc game khac.</p>
              <button className="secondary-mini history-clear-btn" onClick={clearFilters}>Bo loc</button>
            </div>
          ) : null}

          {filteredHistory.map((entry, index) => {
            const [startColor, endColor] = getGameImageTheme(index)
            const topWinners = getTopWinners(entry)
            const winnerNames = topWinners.map((player) => player.name).join(', ')

            return (
              <GameCard
                as="article"
                key={entry.id}
                title={formatHistoryTitle(entry)}
                thumbnailUrl={entry.thumbnailUrl}
                fallbackText={entry.gameName?.slice(0, 2).toUpperCase() || 'BG'}
                background={`linear-gradient(135deg, ${startColor}, ${endColor})`}
                className="game-card--history"
                role="button"
                tabIndex={0}
                onClick={() => openMatchDetail(entry)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') openMatchDetail(entry)
                }}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.02 }}
              >
                <p>{entry.playedAt}</p>
                <div className="history-winner-line">
                  <Image src="/crown.svg" width={16} height={14} alt='' />
                  <span>{winnerNames || 'Chua co nguoi thang'}</span>
                </div>
              </GameCard>
            )
          })}
        </div>
      </div>

      <DeleteConfirmDialog
        entry={matchToDelete}
        isDeleting={isDeleting}
        onCancel={() => setMatchToDelete(null)}
        onConfirm={confirmDelete}
      />
    </div>
  )
}

function MemoryImageLightbox({ images, activeIndex, onClose, onChange }) {
  const hasImages = images.length > 0
  const isOpen = activeIndex !== null && hasImages
  const activeImage = isOpen ? images[activeIndex] : null
  const [imageTransform, setImageTransform] = useState({ scale: 1, x: 0, y: 0 })
  const imageTransformRef = useRef(imageTransform)
  const activePointersRef = useRef(new Map())
  const pinchStartRef = useRef(null)
  const dragStartRef = useRef(null)
  const swipeStartXRef = useRef(null)
  const swipeStartYRef = useRef(null)
  const swipeHandledRef = useRef(false)

  const applyImageTransform = useCallback((nextTransform) => {
    imageTransformRef.current = nextTransform
    setImageTransform(nextTransform)
  }, [])

  const showPrevious = useCallback(() => {
    onChange((activeIndex - 1 + images.length) % images.length)
  }, [activeIndex, images.length, onChange])

  const showNext = useCallback(() => {
    onChange((activeIndex + 1) % images.length)
  }, [activeIndex, images.length, onChange])

  useEffect(() => {
    if (!isOpen) return undefined

    function handleKeyDown(event) {
      if (event.key === 'Escape') onClose()
      if (event.key === 'ArrowLeft') showPrevious()
      if (event.key === 'ArrowRight') showNext()
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose, showNext, showPrevious])

  useEffect(() => {
    activePointersRef.current.clear()
    pinchStartRef.current = null
    dragStartRef.current = null
    swipeStartXRef.current = null
    swipeStartYRef.current = null
    swipeHandledRef.current = false
    applyImageTransform({ scale: 1, x: 0, y: 0 })
  }, [activeIndex, applyImageTransform])

  const handlePointerDown = useCallback((event) => {
    activePointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY })
    event.currentTarget.setPointerCapture?.(event.pointerId)

    if (activePointersRef.current.size >= 2) {
      const [firstPointer, secondPointer] = [...activePointersRef.current.values()]
      const distance = Math.hypot(secondPointer.x - firstPointer.x, secondPointer.y - firstPointer.y)

      pinchStartRef.current = {
        distance,
        scale: imageTransformRef.current.scale,
      }
      dragStartRef.current = null
      swipeStartXRef.current = null
      swipeStartYRef.current = null
      swipeHandledRef.current = true
      return
    }

    swipeStartXRef.current = event.clientX
    swipeStartYRef.current = event.clientY
    swipeHandledRef.current = false
    dragStartRef.current = {
      x: event.clientX,
      y: event.clientY,
      transform: imageTransformRef.current,
    }
  }, [])

  const handlePointerMove = useCallback((event) => {
    if (!activePointersRef.current.has(event.pointerId)) return

    activePointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY })

    if (activePointersRef.current.size >= 2 && pinchStartRef.current) {
      const [firstPointer, secondPointer] = [...activePointersRef.current.values()]
      const distance = Math.hypot(secondPointer.x - firstPointer.x, secondPointer.y - firstPointer.y)
      const nextScale = Math.min(4, Math.max(1, (distance / pinchStartRef.current.distance) * pinchStartRef.current.scale))

      applyImageTransform({
        ...imageTransformRef.current,
        scale: nextScale,
        x: nextScale === 1 ? 0 : imageTransformRef.current.x,
        y: nextScale === 1 ? 0 : imageTransformRef.current.y,
      })
      swipeHandledRef.current = true
      return
    }

    if (imageTransformRef.current.scale > 1 && dragStartRef.current) {
      const deltaX = event.clientX - dragStartRef.current.x
      const deltaY = event.clientY - dragStartRef.current.y

      applyImageTransform({
        scale: imageTransformRef.current.scale,
        x: dragStartRef.current.transform.x + deltaX,
        y: dragStartRef.current.transform.y + deltaY,
      })
      return
    }

    if (images.length <= 1 || swipeStartXRef.current === null || swipeStartYRef.current === null || swipeHandledRef.current) return

    const deltaX = event.clientX - swipeStartXRef.current
    const deltaY = event.clientY - swipeStartYRef.current

    if (Math.abs(deltaX) < 50 || Math.abs(deltaX) < Math.abs(deltaY) * 1.2) return

    swipeHandledRef.current = true
    if (deltaX < 0) {
      showNext()
    } else {
      showPrevious()
    }
  }, [applyImageTransform, images.length, showNext, showPrevious])

  const handlePointerEnd = useCallback((event) => {
    activePointersRef.current.delete(event.pointerId)
    pinchStartRef.current = null
    dragStartRef.current = null

    if (activePointersRef.current.size === 0) {
      swipeStartXRef.current = null
      swipeStartYRef.current = null
      swipeHandledRef.current = false
    }

    event.currentTarget.releasePointerCapture?.(event.pointerId)
  }, [])

  if (!isOpen) return null

  return (
    <div className="memory-lightbox" role="dialog" aria-modal="true" aria-label="Xem hình ảnh kỉ niệm">
      <button className="memory-lightbox-backdrop" type="button" onClick={onClose} aria-label="Đóng hình ảnh" />
      <div className="memory-lightbox-content">
        <button className="memory-lightbox-close" type="button" onClick={onClose} aria-label="Đóng">
          <Image src="/close-icon.svg" alt="" width={32} height={32} />
        </button>

        <div
          className="memory-lightbox-image-wrap"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerEnd}
          onPointerCancel={handlePointerEnd}
          onPointerLeave={handlePointerEnd}
        >
          <Image
            src={activeImage.url}
            alt={activeImage.fileName || 'Hình ảnh kỉ niệm'}
            width={1200}
            height={900}
            priority
            style={{
              transform: `translate3d(${imageTransform.x}px, ${imageTransform.y}px, 0) scale(${imageTransform.scale})`,
            }}
          />
        </div>

        {images.length > 1 ? (
          <div className="memory-lightbox-count">{activeIndex + 1}/{images.length}</div>
        ) : null}
      </div>
    </div>
  )
}

function DetailActionMenu({ isOpen, onEdit, onDelete }) {
  if (!isOpen) return null

  return (
    <div className="detail-action-menu" role="menu" aria-label="Tuy chon bang diem">
      <button type="button" role="menuitem" className="detail-action-item" onClick={onEdit}>
        <span className="detail-action-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24">
            <path d="M4 16.5V20h3.5L18.1 9.4l-3.5-3.5L4 16.5z" />
            <path d="M13.5 7 17 10.5" />
            <path d="M15.4 4.1l1.2-1.2a2 2 0 0 1 2.8 0l1.7 1.7a2 2 0 0 1 0 2.8l-1.2 1.2" />
          </svg>
        </span>
        <span>Chinh sua bang diem</span>
      </button>

      <button type="button" role="menuitem" className="detail-action-item" onClick={onDelete}>
        <span className="detail-action-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24">
            <path d="M4 7h16" />
            <path d="M10 11v6M14 11v6" />
            <path d="M6 7l1 14h10l1-14" />
            <path d="M9 7V4h6v3" />
          </svg>
        </span>
        <span>Xoa bang diem</span>
      </button>
    </div>
  )
}

function DeleteConfirmDialog({ entry, isDeleting, onCancel, onConfirm }) {
  if (!entry) return null

  return (
    <div className="confirm-backdrop" role="presentation">
      <div className="confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="delete-history-title">
        <h2 id="delete-history-title">Xoa bang diem</h2>
        <p>Ban co chac muon xoa bang diem cua van choi nay?</p>
        <p className="confirm-subtext">{entry.gameName} · {formatWinner(entry)}</p>
        <div className="confirm-actions">
          <button className="confirm-secondary" onClick={onCancel} disabled={isDeleting}>Giu lai</button>
          <button className="confirm-danger" onClick={onConfirm} disabled={isDeleting}>{isDeleting ? 'Dang xoa...' : 'Xoa'}</button>
        </div>
      </div>
    </div>
  )
}
