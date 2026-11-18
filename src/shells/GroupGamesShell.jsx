import React, { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Header } from '../components/Header'
import { ProtectedScreen } from '../components/auth/ProtectedScreen'
import { GroupCatalogModal } from '../components/group/GroupCatalogModal'
import { QuickCreateGameModal } from '../components/group/QuickCreateGameModal'
import { GroupInfoCard } from '../components/group/GroupInfoCard'
import { Button } from '../components/ui/Button'
import { SearchBar } from '../components/ui/SearchBar'
import { usePermissions } from '../hooks/usePermissions'
import { useGroupStore } from '../store/groupStore'
import { useAppDataStore } from '../store/appDataStore'
import { useToast } from '../hooks/useToast'
import { Toast } from '../components/Toast'
import { PullToRefresh } from '../components/ui/PullToRefresh'
import { Icon } from '../components/ui/Icon'

function formatGameGenres(game) {
  const raw = game.genres || game.category_ids || game.categoryIds || []
  const list = Array.isArray(raw) ? raw : [raw]
  const labels = list
    .map((item) => (typeof item === 'string' ? item : item?.name || item?.label || ''))
    .filter(Boolean)
  return labels.length > 0 ? ` • ${labels.slice(0, 2).join(', ')}` : ''
}

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
              <GroupInfoCard
                group={activeGroup}
                subtitle={`${boardGames.length} trò chơi trong tủ`}
              />

              {canCreateBoardGame ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <Button
                    variant="secondary"
                    onClick={() => setIsCatalogModalOpen(true)}
                  >
                    + Thư viện mẫu
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => setIsQuickCreateModalOpen(true)}
                  >
                    + Tạo game mới
                  </Button>
                </div>
              ) : null}

              <SearchBar
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onClear={() => setSearchTerm('')}
                placeholder="Tìm game trong tủ nhóm..."
              />

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
                      <Button
                        variant="secondary"
                        onClick={() => setIsCatalogModalOpen(true)}
                      >
                        + Thêm từ thư viện mẫu
                      </Button>
                      <Button
                        variant="primary"
                        onClick={() => setIsQuickCreateModalOpen(true)}
                      >
                        + Tạo game mới (Điểm tổng)
                      </Button>
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="group-member-list">
                  {filteredGames.map((game) => (
                    <div key={game.id || game._id} className="group-catalog-item" style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', minWidth: 0, flex: 1 }}>
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
                            {formatGameGenres(game)}
                          </div>
                        </div>
                      </div>
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
