import { useState, useEffect, useCallback } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Navbar from './Navbar'
import Modal from './Modal'
import CreateGroupForm from '../groups/CreateGroupForm'
import api from '../../api/axios'

export default function Layout() {
  const [groups, setGroups] = useState([])
  const [showCreateGroup, setShowCreateGroup] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const fetchGroups = useCallback(async () => {
    try {
      const { data } = await api.get('/groups')
      setGroups(data.groups || [])
    } catch {}
  }, [])

  useEffect(() => { fetchGroups() }, [fetchGroups])

  const handleGroupCreated = (group) => {
    setGroups(prev => [group, ...prev])
    setShowCreateGroup(false)
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden md:flex flex-shrink-0">
        <Sidebar
          onCreateGroup={() => setShowCreateGroup(true)}
          groups={groups}
        />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <div className="relative w-64 h-full animate-slide-in">
            <Sidebar
              onCreateGroup={() => { setShowCreateGroup(true); setSidebarOpen(false) }}
              groups={groups}
              mobile
              onClose={() => setSidebarOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-[var(--bg-primary)]">
          <Outlet context={{ groups, fetchGroups }} />
        </main>
      </div>

      {/* Create Group Modal */}
      <Modal open={showCreateGroup} onClose={() => setShowCreateGroup(false)} title="Create Group">
        <CreateGroupForm onSuccess={handleGroupCreated} onCancel={() => setShowCreateGroup(false)} />
      </Modal>
    </div>
  )
}
