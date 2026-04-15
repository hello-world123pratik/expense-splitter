import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import Avatar from './Avatar'

export default function Navbar({ onMenuClick }) {
  const { user, notifications, unreadCount, markNotificationsRead } = useAuth()
  const [notifOpen, setNotifOpen] = useState(false)
  const ref = useRef()

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setNotifOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleNotifOpen = () => {
    setNotifOpen(v => !v)
    if (!notifOpen && unreadCount > 0) markNotificationsRead()
  }

  const typeIcon = (type) => {
    const icons = {
      expense: '💸', payment: '✅', group: '👥', general: '🔔'
    }
    return icons[type] || '🔔'
  }

  return (
    <header className="h-16 flex items-center justify-between px-4 md:px-6 border-b border-[var(--border)] bg-[var(--bg-card)]">
      {/* Mobile menu button */}
      <button onClick={onMenuClick} className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <div className="hidden md:block" />

      <div className="flex items-center gap-2" ref={ref}>
        {/* Notifications */}
        <div className="relative">
          <button
            onClick={handleNotifOpen}
            className="relative p-2 rounded-xl hover:bg-brand-50 dark:hover:bg-brand-900/30 transition-colors"
          >
            <svg className="w-5 h-5 text-[var(--text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 h-4 w-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 card shadow-xl z-50 animate-slide-up overflow-hidden">
              <div className="p-4 border-b border-[var(--border)]">
                <h3 className="font-semibold text-[var(--text-primary)]">Notifications</h3>
              </div>
              <div className="max-h-80 overflow-y-auto divide-y divide-[var(--border)]">
                {notifications.length === 0 ? (
                  <p className="p-4 text-sm text-[var(--text-secondary)] text-center">No notifications</p>
                ) : (
                  notifications.slice(0, 10).map((n, i) => (
                    <div key={i} className={`p-3 hover:bg-brand-50/50 dark:hover:bg-brand-900/20 transition-colors ${!n.read ? 'bg-brand-50/30 dark:bg-brand-900/10' : ''}`}>
                      <div className="flex gap-2.5">
                        <span className="text-lg flex-shrink-0 mt-0.5">{typeIcon(n.type)}</span>
                        <div>
                          <p className="text-sm text-[var(--text-primary)]">{n.message}</p>
                          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                            {new Date(n.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <Avatar user={user} size="sm" />
      </div>
    </header>
  )
}
