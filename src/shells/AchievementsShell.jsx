'use client'

import React from 'react'
import { ProtectedScreen } from '../components/auth/ProtectedScreen'
import { BottomNav } from '../components/navigation/BottomNav'

export function AchievementsShell() {
  const stats = [
    { label: 'Tổng ván chơi', value: '24' },
    { label: 'Tỉ lệ thắng', value: '58%' },
    { label: 'Huy hiệu', value: '3/5' },
  ]

  const achievements = [
    {
      id: 1,
      title: 'Nhà Vô Địch Catan',
      desc: 'Chiến thắng 5 ván Catan trên hệ thống.',
      unlocked: true,
      date: '20/05/2026',
      progress: 100,
      icon: '🏆',
    },
    {
      id: 2,
      title: 'Kỷ Lục Điểm Số',
      desc: 'Ghi được hơn 100 điểm trong một ván chơi đơn lẻ.',
      unlocked: true,
      date: '18/05/2026',
      progress: 100,
      icon: '🎯',
    },
    {
      id: 3,
      title: 'Người Chơi Kiên Trì',
      desc: 'Tham gia chơi board game liên tiếp trong 3 ngày.',
      unlocked: true,
      date: '15/05/2026',
      progress: 100,
      icon: '⚡',
    },
    {
      id: 4,
      title: 'Thần Bài Cáo Già',
      desc: 'Giành chiến thắng trong các game có yếu tố ẩn vai trò.',
      unlocked: false,
      progress: 60,
      icon: '🕵️',
    },
    {
      id: 5,
      title: 'Bác Học Board Game',
      desc: 'Trải nghiệm ít nhất 10 loại board game khác nhau trên hệ thống.',
      unlocked: false,
      progress: 40,
      icon: '📚',
    },
  ]

  return (
    <ProtectedScreen>
      <div className="app-shell screen-achievements">
        <div className="achievements-screen">
          <div className="achievements-header">
            <h1>Thành tựu</h1>
            <div className="achievements-subtitle">Thống kê và huy hiệu danh dự của bạn</div>
          </div>

          <div className="achievements-stats">
            {stats.map((stat, i) => (
              <div className="stat-box" key={i}>
                <div className="stat-val">{stat.value}</div>
                <div className="stat-label">{stat.label}</div>
              </div>
            ))}
          </div>

          <div className="achievements-section-title">
            <span>🏅</span> Huy hiệu cá nhân
          </div>

          <div className="achievements-grid">
            {achievements.map((item) => (
              <div key={item.id} className={`badge-card ${item.unlocked ? 'unlocked' : 'locked'}`}>
                <div className="badge-icon-container">
                  <span style={{ fontSize: '24px' }}>{item.icon}</span>
                </div>
                <div className="badge-info">
                  <div className="badge-title">{item.title}</div>
                  <div className="badge-desc">{item.desc}</div>
                  {!item.unlocked && (
                    <div className="badge-progress">
                      <div className="badge-progress-bar" style={{ width: `${item.progress}%` }}></div>
                    </div>
                  )}
                </div>
                {item.unlocked && item.date && (
                  <span className="badge-date">{item.date}</span>
                )}
              </div>
            ))}
          </div>
        </div>
        <BottomNav />
      </div>
    </ProtectedScreen>
  )
}
