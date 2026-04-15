import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import Avatar from './Avatar'
import { useState, useEffect } from 'react'
import api from '../../api/axios'

const NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  )},
  { to: '/profile', label: 'Profile', icon: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  )},
]

export default function Sidebar({ onCreateGroup, groups = [], mobile = false, onClose }) {
  const { user, logout } = useAuth()
  const { dark, toggle } = useTheme()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <aside className={`flex flex-col h-full ${mobile ? '' : 'w-64'} bg-[var(--bg-card)] border-r border-[var(--border)]`}>
      {/* Logo */}
      <div className="p-5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-brand-600 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-sm">S</span>
          </div>
          <span className="font-extrabold text-lg text-[var(--text-primary)] tracking-tight">SplitWise</span>
        </div>
        {mobile && (
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="px-3 space-y-1">
        {NAV.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={mobile ? onClose : undefined}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            {item.icon}
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Groups */}
      <div className="px-3 mt-5">
        <div className="flex items-center justify-between px-4 mb-2">
          <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Groups</span>
          <button onClick={onCreateGroup} className="w-5 h-5 flex items-center justify-center rounded-md hover:bg-brand-100 dark:hover:bg-brand-900/40 text-brand-600 dark:text-brand-400 transition-colors" title="New group">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>

        <div className="space-y-0.5 max-h-52 overflow-y-auto pr-1">
          {groups.length === 0 && (
            <p className="text-xs text-[var(--text-secondary)] px-4 py-2">No groups yet</p>
          )}
          {groups.map(g => (
            <NavLink
              key={g._id}
              to={`/groups/${g._id}`}
              onClick={mobile ? onClose : undefined}
              className={({ isActive }) => `sidebar-link text-sm ${isActive ? 'active' : ''}`}
            >
              <span className="text-base flex-shrink-0">{g.icon || '👥'}</span>
              <span className="truncate">{g.groupName}</span>
            </NavLink>
          ))}
        </div>
      </div>

      <div className="flex-1" />

      {/* Bottom actions */}
      <div className="p-3 border-t border-[var(--border)] space-y-1">
        <button onClick={toggle} className="sidebar-link w-full text-sm">
          {dark ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
          {dark ? 'Light Mode' : 'Dark Mode'}
        </button>

        <button onClick={handleLogout} className="sidebar-link w-full text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Logout
        </button>
      </div>

      {/* User card */}
      <div className="p-3">
        <NavLink to="/profile" className="flex items-center gap-3 p-3 rounded-xl hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors">
          <Avatar user={user} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{user?.name}</p>
            <p className="text-xs text-[var(--text-secondary)] truncate">{user?.email}</p>
          </div>
        </NavLink>
      </div>
    </aside>
  )
}
