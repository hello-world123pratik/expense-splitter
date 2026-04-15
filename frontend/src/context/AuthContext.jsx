import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api from '../api/axios'
import toast from 'react-hot-toast'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')) } catch { return null }
  })
  const [loading, setLoading] = useState(true)
  const [notifications, setNotifications] = useState([])

  const fetchMe = useCallback(async () => {
    try {
      const { data } = await api.get('/auth/me')
      setUser(data.user)
      localStorage.setItem('user', JSON.stringify(data.user))
    } catch {
      logout()
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) fetchMe()
    else setLoading(false)
  }, [fetchMe])

  const fetchNotifications = useCallback(async () => {
    try {
      const { data } = await api.get('/auth/notifications')
      setNotifications(data.notifications || [])
    } catch {}
  }, [])

  useEffect(() => {
    if (user) fetchNotifications()
  }, [user, fetchNotifications])

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password })
    localStorage.setItem('token', data.token)
    localStorage.setItem('user', JSON.stringify(data.user))
    setUser(data.user)
    return data
  }

  const register = async (name, email, password) => {
    const { data } = await api.post('/auth/register', { name, email, password })
    localStorage.setItem('token', data.token)
    localStorage.setItem('user', JSON.stringify(data.user))
    setUser(data.user)
    return data
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
  }

  const updateUser = (updated) => {
    setUser(updated)
    localStorage.setItem('user', JSON.stringify(updated))
  }

  const markNotificationsRead = async () => {
    try {
      await api.put('/auth/notifications/read')
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    } catch {}
  }

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <AuthContext.Provider value={{
      user, loading, login, register, logout, updateUser,
      notifications, fetchNotifications, markNotificationsRead, unreadCount,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
