import { useState } from 'react'
import api from '../../api/axios'
import toast from 'react-hot-toast'
import Spinner from '../common/Spinner'

const CATEGORIES = [
  { value: 'trip', label: '✈️ Trip' },
  { value: 'home', label: '🏠 Home' },
  { value: 'office', label: '💼 Office' },
  { value: 'friends', label: '🎉 Friends' },
  { value: 'family', label: '👨‍👩‍👧 Family' },
  { value: 'other', label: '📦 Other' },
]

const ICONS = ['👥', '✈️', '🏠', '💼', '🎉', '🍕', '🎮', '🏋️', '🌴', '🎓']

export default function CreateGroupForm({ onSuccess, onCancel }) {
  const [form, setForm] = useState({ groupName: '', description: '', category: 'other', icon: '👥' })
  const [emails, setEmails] = useState([''])
  const [loading, setLoading] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const addEmail = () => setEmails(e => [...e, ''])
  const removeEmail = (i) => setEmails(e => e.filter((_, idx) => idx !== i))
  const setEmail = (i, v) => setEmails(e => e.map((em, idx) => idx === i ? v : em))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.groupName.trim()) return toast.error('Group name is required')
    setLoading(true)
    try {
      const memberEmails = emails.filter(e => e.trim())
      const { data } = await api.post('/groups', { ...form, memberEmails })
      toast.success('Group created!')
      onSuccess(data.group)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create group')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Icon picker */}
      <div>
        <label className="label">Icon</label>
        <div className="flex flex-wrap gap-2">
          {ICONS.map(icon => (
            <button
              type="button"
              key={icon}
              onClick={() => set('icon', icon)}
              className={`w-10 h-10 text-xl rounded-xl border-2 transition-all ${form.icon === icon ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/30' : 'border-[var(--border)] hover:border-brand-300'}`}
            >
              {icon}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="label">Group Name *</label>
        <input className="input" placeholder="e.g. Goa Trip 2024" value={form.groupName} onChange={e => set('groupName', e.target.value)} required />
      </div>

      <div>
        <label className="label">Description</label>
        <input className="input" placeholder="Optional description" value={form.description} onChange={e => set('description', e.target.value)} />
      </div>

      <div>
        <label className="label">Category</label>
        <select className="input" value={form.category} onChange={e => set('category', e.target.value)}>
          {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      </div>

      {/* Add members by email */}
      <div>
        <label className="label">Invite Members (by email)</label>
        <div className="space-y-2">
          {emails.map((email, i) => (
            <div key={i} className="flex gap-2">
              <input
                className="input flex-1"
                type="email"
                placeholder="member@example.com"
                value={email}
                onChange={e => setEmail(i, e.target.value)}
              />
              {emails.length > 1 && (
                <button type="button" onClick={() => removeEmail(i)} className="px-3 py-2 rounded-xl border border-red-200 text-red-500 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-900/20 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          ))}
          <button type="button" onClick={addEmail} className="text-sm text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add another email
          </button>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel} className="btn-secondary flex-1">Cancel</button>
        <button type="submit" disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2">
          {loading ? <Spinner size="sm" color="white" /> : null}
          Create Group
        </button>
      </div>
    </form>
  )
}
