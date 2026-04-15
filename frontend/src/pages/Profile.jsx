import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import toast from 'react-hot-toast'
import Avatar from '../components/common/Avatar'
import Spinner from '../components/common/Spinner'

const AVATAR_COLORS = [
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Felix',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Aneka',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Mia',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Leo',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Max',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Lily',
]

export default function Profile() {
  const { user, updateUser } = useAuth()
  const [name, setName] = useState(user?.name || '')
  const [saving, setSaving] = useState(false)
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirm: '' })
  const [savingPw, setSavingPw] = useState(false)
  const [selectedAvatar, setSelectedAvatar] = useState(user?.avatar || '')

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const { data } = await api.put('/auth/profile', { name, avatar: selectedAvatar })
      updateUser(data.user)
      toast.success('Profile updated!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    if (pwForm.newPassword !== pwForm.confirm) return toast.error('Passwords do not match')
    if (pwForm.newPassword.length < 6) return toast.error('Password must be at least 6 characters')
    setSavingPw(true)
    try {
      await api.put('/auth/password', {
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      })
      toast.success('Password changed!')
      setPwForm({ currentPassword: '', newPassword: '', confirm: '' })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password')
    } finally {
      setSavingPw(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-fade-in">
      <div>
        <h1 className="text-2xl font-extrabold text-[var(--text-primary)]">Profile</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">Manage your account settings</p>
      </div>

      {/* Profile info */}
      <form onSubmit={handleSaveProfile} className="card p-6 space-y-5">
        <h2 className="font-bold text-[var(--text-primary)]">Account Information</h2>

        {/* Avatar */}
        <div>
          <label className="label">Profile Picture</label>
          <div className="flex items-center gap-4 flex-wrap">
            <Avatar user={{ ...user, avatar: selectedAvatar, name }} size="xl" />
            <div className="flex flex-wrap gap-2">
              {AVATAR_COLORS.map((url, i) => (
                <button
                  type="button"
                  key={i}
                  onClick={() => setSelectedAvatar(url)}
                  className={`w-10 h-10 rounded-full overflow-hidden border-2 transition-all ${selectedAvatar === url ? 'border-brand-500 scale-110' : 'border-[var(--border)] hover:border-brand-300'}`}
                >
                  <img src={url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
              <button
                type="button"
                onClick={() => setSelectedAvatar('')}
                className={`w-10 h-10 rounded-full border-2 transition-all flex items-center justify-center text-xs font-bold ${!selectedAvatar ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/30' : 'border-[var(--border)]'}`}
              >
                {user?.name?.charAt(0).toUpperCase()}
              </button>
            </div>
          </div>
        </div>

        <div>
          <label className="label">Full Name</label>
          <input
            className="input"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Your name"
            required
          />
        </div>

        <div>
          <label className="label">Email</label>
          <input className="input opacity-60 cursor-not-allowed" value={user?.email || ''} disabled />
          <p className="text-xs text-[var(--text-secondary)] mt-1">Email cannot be changed</p>
        </div>

        <div>
          <label className="label">Member Since</label>
          <p className="text-sm text-[var(--text-primary)]">
            {new Date(user?.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>

        <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
          {saving ? <Spinner size="sm" color="white" /> : null}
          Save Changes
        </button>
      </form>

      {/* Change password */}
      <form onSubmit={handleChangePassword} className="card p-6 space-y-4">
        <h2 className="font-bold text-[var(--text-primary)]">Change Password</h2>

        <div>
          <label className="label">Current Password</label>
          <input
            className="input"
            type="password"
            placeholder="••••••••"
            value={pwForm.currentPassword}
            onChange={e => setPwForm(f => ({ ...f, currentPassword: e.target.value }))}
            required
          />
        </div>

        <div>
          <label className="label">New Password</label>
          <input
            className="input"
            type="password"
            placeholder="••••••••"
            value={pwForm.newPassword}
            onChange={e => setPwForm(f => ({ ...f, newPassword: e.target.value }))}
            required
          />
        </div>

        <div>
          <label className="label">Confirm New Password</label>
          <input
            className="input"
            type="password"
            placeholder="••••••••"
            value={pwForm.confirm}
            onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))}
            required
          />
        </div>

        <button type="submit" disabled={savingPw} className="btn-secondary flex items-center gap-2">
          {savingPw ? <Spinner size="sm" /> : null}
          Update Password
        </button>
      </form>

      {/* Danger zone */}
      <div className="card p-6 border-red-200 dark:border-red-900">
        <h2 className="font-bold text-red-500 mb-2">Danger Zone</h2>
        <p className="text-sm text-[var(--text-secondary)] mb-4">
          Once you delete your account, there is no going back. Please be certain.
        </p>
        <button
          onClick={() => toast.error('Account deletion is disabled in this demo')}
          className="btn-danger text-sm"
        >
          Delete Account
        </button>
      </div>
    </div>
  )
}
