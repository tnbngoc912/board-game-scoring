import React, { useEffect, useMemo, useState } from 'react'
import { addBoardGameToGroup, getBoardGames } from '../../api/backendService'

export function GroupCatalogModal({
  isOpen,
  groupId,
  existingGames = [],
  onClose,
  onAdded,
  toast,
}) {
  const [search, setSearch] = useState('')
  const [catalogGames, setCatalogGames] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [addingId, setAddingId] = useState('')

  const existingIdSet = useMemo(
    () => new Set((existingGames || []).map((g) => String(g.id || g._id))),
    [existingGames]
  )

  useEffect(() => {
    if (!isOpen) return
    let cancelled = false

    async function loadCatalog() {
      setIsLoading(true)
      try {
        const res = await getBoardGames({ search: search.trim() || undefined, limit: 50 })
        if (!cancelled) {
          setCatalogGames(res?.items || [])
        }
      } catch {
        if (!cancelled) {
          toast?.('Không thể tải kho game mẫu')
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    const timer = setTimeout(loadCatalog, 200)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [isOpen, search, toast])

  if (!isOpen) return null

  async function handleAddGame(game) {
    const targetId = String(game.id || game._id)
    if (!groupId || !targetId) return

    setAddingId(targetId)
    try {
      await addBoardGameToGroup(groupId, targetId)
      toast?.(`Đã thêm "${game.name}" vào Tủ game của nhóm`)
      onAdded?.()
    } catch (error) {
      toast?.(error?.message || 'Không thể thêm game vào tủ nhóm')
    } finally {
      setAddingId('')
    }
  }

  return (
    <div className="group-modal-backdrop" onClick={onClose}>
      <div className="group-modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="group-modal-header">
          <h2>Thêm từ Thư viện mẫu</h2>
          <button type="button" className="group-modal-close" onClick={onClose} aria-label="Đóng">
            ✕
          </button>
        </div>

        <div className="group-modal-body">
          <div className="group-field">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm tên board game trong kho mẫu..."
            />
          </div>

          {isLoading ? (
            <div className="group-note-box">Đang tải danh sách game mẫu...</div>
          ) : catalogGames.length === 0 ? (
            <div className="group-note-box">Không tìm thấy tựa game phù hợp trong kho mẫu.</div>
          ) : (
            <div className="group-member-list">
              {catalogGames.map((game) => {
                const gid = String(game.id || game._id)
                const alreadyInCabinet = existingIdSet.has(gid)
                const minP = game.min_players ?? game.minPlayers ?? 2
                const maxP = game.max_players ?? game.maxPlayers ?? 6

                return (
                  <div key={gid} className="group-catalog-item">
                    <div className="group-catalog-meta">
                      <div className="group-catalog-title">{game.name}</div>
                      <div className="group-catalog-sub">
                        {minP}-{maxP} người chơi
                      </div>
                    </div>

                    {alreadyInCabinet ? (
                      <span className="group-role-badge">Đã có trong tủ</span>
                    ) : (
                      <button
                        type="button"
                        className="group-action-chip primary"
                        disabled={addingId === gid}
                        onClick={() => handleAddGame(game)}
                      >
                        {addingId === gid ? 'Đang thêm...' : '+ Thêm vào tủ'}
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
