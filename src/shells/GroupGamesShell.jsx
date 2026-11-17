import React, { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Header } from '../components/Header'
import { ProtectedScreen } from '../components/auth/ProtectedScreen'
import { GroupCatalogModal } from '../components/group/GroupCatalogModal'
import { QuickCreateGameModal } from '../components/group/QuickCreateGameModal'
import { usePermissions } from '../hooks/usePermissions'
import { useGroupStore } from '../store/groupStore'
import { useAppDataStore } from '../store/appDataStore'
import { useToast } from '../hooks/useToast'
import { Toast } from '../components/Toast'
import { PullToRefresh } from '../components/ui/PullToRefresh'
import { Icon } from '../components/ui/Icon'

export function GroupGamesShell() {
  const router = useRouter()
  const { message, visible, show: showToast } = useToast()
  const { isAdmin, boardGame, activeGroup } = usePermissions()
  const activeGroupId = useGroupStore((state) => state.activeGroupId)
  const canCreateBoardGame = boardGame?.canCreate

  const boardGames = useAppDataStore((state) => state.boardGames || [])
  const isLoadingGames = useAppDataStore((state) => state.isLoadingBoardGames)
  const fetchBoardGames = useAppDataStore((state) => state.fetchBoardGames)

  const [searchTerm, setSearchTerm] = useState('')
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false)
  const [isQuickCreateModalOpen, setIsQuickCreateModalOpen] = useState(false)

  const currentGroupId = activeGroup?.id || activeGroupId

  useEffect(() => {
    fetchBoardGames({ force: true }).catch(() => {})
  }, [fetchBoardGames, currentGroupId])

  const filteredGames = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    if (!term) return boardGames
    return boardGames.filter((g) =>
      g.name?.toLowerCase().includes(term) ||
      g.vietnamese_name?.toLowerCase().includes(term)
    )
  }, [boardGames, searchTerm])

  const roleLabel =
    activeGroup?.my_role === 'OWNER'
      ? 'Chủ nhóm'
      : activeGroup?.my_role === 'ADMIN'
        ? 'Quản trị'
        : 'Thành viên'

  return (
    <ProtectedScreen>
      <div className="app-shell screen-account">
        <div className="account-screen has-ptr">
          <Header
            title="Tủ Game Của Nhóm"
            onBack={() => router.push('/account')}
          />

          <PullToRefresh
            onRefresh={async () => {
              try {
                await fetchBoardGames({ force: true })
                showToast('Đã làm mới tủ game')
              } catch {
                showToast('Không thể làm mới dữ liệu')
              }
            }}
          >
            <div className="account-content" style={{ paddingBottom: '32px' }}>
              <div className="account-profile-card">
                <div className="account-avatar-wrapper" style={{ background: 'var(--color-brand-100)' }}>
                  <Icon src="/home.png" size={32} color="#93653f" />
                </div>
                <div className="account-user-info" style={{ flex: 1 }}>
                  <div className="account-user-name" style={{ fontSize: 18 }}>
                    {activeGroup?.name || 'Chưa chọn nhóm'}
                  </div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <span className="group-role-badge">{roleLabel}</span>
                    <span style={{ fontSize: 13, color: 'var(--color-subtext)' }}>
                      • {boardGames.length} trò chơi trong tủ
                    </span>
                  </div>
                </div>
              </div>

              {canCreateBoardGame ? (
                <div className="group-empty-actions" style={{ justifyContent: 'stretch', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <button
                    type="button"
                    className="group-btn-secondary"
                    style={{ minHeight: '44px', justifyContent: 'center' }}
                    onClick={() => setIsCatalogModalOpen(true)}
                  >
                    + Thư viện mẫu
                  </button>
                  <button
                    type="button"
                    className="group-btn-primary"
                    style={{ minHeight: '44px', justifyContent: 'center' }}
                    onClick={() => setIsQuickCreateModalOpen(true)}
                  >
                    + Tạo game mới
                  </button>
                </div>
              ) : null}

              <div className="search-bar search-bar--plain" style={{ background: 'var(--color-card)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border-control)' }}>
                <span className="search-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24">
                    <circle cx="11" cy="11" r="7" />
                    <path d="M16.5 16.5L21 21" />
                  </svg>
                </span>
                <input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Tìm game trong tủ nhóm..."
                  aria-label="Tìm game trong tủ nhóm"
                  style={{ minHeight: 44 }}
                />
                {searchTerm ? (
                  <button
                    className="search-clear-button"
                    type="button"
                    onClick={() => setSearchTerm('')}
                    aria-label="Xóa từ khóa"
                  >
                    ✕
                  </button>
                ) : null}
              </div>

              {isLoadingGames && boardGames.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--color-subtext)' }}>
                  Đang tải danh sách game...
                </div>
              ) : filteredGames.length === 0 ? (
                <div className="group-empty-cabinet">
                  <h3>
                    {searchTerm ? 'Không tìm thấy game phù hợp' : 'Tủ game của nhóm đang trống'}
                  </h3>
                  <p>
                    {searchTerm
                      ? 'Thử tìm với từ khóa khác hoặc thêm tựa game mới vào tủ game.'
                      : 'Hãy thêm các trò chơi từ Thư viện mẫu hoặc tạo nhanh game mới để các thành viên bắt đầu chơi và ghi điểm.'}
                  </p>
                  {canCreateBoardGame && !searchTerm ? (
                    <div className="group-empty-actions">
                      <button
                        type="button"
                        className="group-btn-secondary"
                        onClick={() => setIsCatalogModalOpen(true)}
                      >
                        + Thêm từ thư viện mẫu
                      </button>
                      <button
                        type="button"
                        className="group-btn-primary"
                        onClick={() => setIsQuickCreateModalOpen(true)}
                      >
                        + Tạo game mới (Điểm tổng)
                      </button>
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="group-member-list">
                  {filteredGames.map((game) => (
                    <div key={game.id || game._id} className="group-catalog-item" style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', minWidth: 0 }}>
                        <div
                          style={{
                            width: 48,
                            height: 48,
                            borderRadius: 'var(--radius-sm)',
                            overflow: 'hidden',
                            background: 'var(--color-brand-100)',
                            flexShrink: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            color: 'var(--color-brand-700)',
                          }}
                        >
                          {game.thumbnail_url || game.thumbnailUrl ? (
                            <img
                              src={game.thumbnail_url || game.thumbnailUrl}
                              alt={game.name}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          ) : (
                            game.name?.slice(0, 2).toUpperCase() || 'BG'
                          )}
                        </div>
                        <div className="group-catalog-meta">
                          <div className="group-catalog-title">{game.name}</div>
                          <div className="group-catalog-sub">
                            {game.min_players || game.minPlayers || 2} - {game.max_players || game.maxPlayers || 6} người chơi
                            {game.genres?.length ? ` • ${game.genres.slice(0, 2).join(', ')}` : ''}
                          </div>
                        </div>
                      </div>
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: 'var(--color-success)',
                          background: 'rgba(76, 175, 103, 0.12)',
                          padding: '4px 8px',
                          borderRadius: 'var(--radius-pill)',
                          flexShrink: 0,
                        }}
                      >
                        Trong tủ
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </PullToRefresh>
        </div>

        <GroupCatalogModal
          isOpen={isCatalogModalOpen}
          groupId={currentGroupId}
          existingGames={boardGames}
          onClose={() => setIsCatalogModalOpen(false)}
          onAdded={() => {
            fetchBoardGames({ force: true }).catch(() => {})
            showToast('Đã thêm game vào tủ nhóm!')
          }}
          toast={showToast}
        />

        <QuickCreateGameModal
          isOpen={isQuickCreateModalOpen}
          groupId={currentGroupId}
          onClose={() => setIsQuickCreateModalOpen(false)}
          onCreated={() => {
            fetchBoardGames({ force: true }).catch(() => {})
            showToast('Đã tạo game mới thành công!')
          }}
          toast={showToast}
        />

        <Toast message={message} visible={visible} />
      </div>
    </ProtectedScreen>
  )
}
