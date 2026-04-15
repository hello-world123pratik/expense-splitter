import { useState } from 'react'
import api from '../../api/axios'
import toast from 'react-hot-toast'
import Spinner from '../common/Spinner'
import Avatar from '../common/Avatar'
import { useAuth } from '../../context/AuthContext'

const CATEGORIES = ['food', 'transport', 'accommodation', 'entertainment', 'shopping', 'utilities', 'health', 'other']
const CAT_ICONS = { food: '🍕', transport: '🚗', accommodation: '🏨', entertainment: '🎬', shopping: '🛍️', utilities: '💡', health: '💊', other: '📦' }

export default function AddExpenseForm({ groupId, members, onSuccess, onCancel, expense }) {
  const { user } = useAuth()
  const isEdit = !!expense

  const [form, setForm] = useState({
    description: expense?.description || '',
    amount: expense?.amount || '',
    category: expense?.category || 'other',
    paidBy: expense?.paidBy?._id || user._id,
    splitType: expense?.splitType || 'equal',
    date: expense?.date ? expense.date.split('T')[0] : new Date().toISOString().split('T')[0],
    notes: expense?.notes || '',
  })

  const [selected, setSelected] = useState(
    expense?.splitBetween?.map(s => s.user._id) || members.map(m => m.user._id)
  )
  const [exactAmounts, setExactAmounts] = useState(
    expense?.splitBetween?.reduce((acc, s) => ({ ...acc, [s.user._id]: s.share }), {}) || {}
  )
  const [percentages, setPercentages] = useState(
    expense?.splitBetween?.reduce((acc, s) => ({ ...acc, [s.user._id]: s.percentage || 0 }), {}) || {}
  )
  const [loading, setLoading] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const toggleMember = (id) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const getPerShare = () => {
    if (!form.amount || selected.length === 0) return 0
    return parseFloat(form.amount) / selected.length
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.description.trim()) return toast.error('Description is required')
    if (!form.amount || parseFloat(form.amount) <= 0) return toast.error('Enter a valid amount')
    if (selected.length === 0) return toast.error('Select at least one member to split with')

    let splitBetween = []
    if (form.splitType === 'equal') {
      splitBetween = selected.map(id => ({ userId: id }))
    } else if (form.splitType === 'exact') {
      const total = selected.reduce((sum, id) => sum + (parseFloat(exactAmounts[id]) || 0), 0)
      if (Math.abs(total - parseFloat(form.amount)) > 0.01) {
        return toast.error(`Split amounts (₹${total}) don't match total (₹${form.amount})`)
      }
      splitBetween = selected.map(id => ({ userId: id, amount: parseFloat(exactAmounts[id]) || 0 }))
    } else if (form.splitType === 'percentage') {
      const totalPct = selected.reduce((sum, id) => sum + (parseFloat(percentages[id]) || 0), 0)
      if (Math.abs(totalPct - 100) > 0.01) {
        return toast.error(`Percentages must add up to 100% (currently ${totalPct}%)`)
      }
      splitBetween = selected.map(id => ({ userId: id, percentage: parseFloat(percentages[id]) || 0 }))
    }

    setLoading(true)
    try {
      let data
      if (isEdit) {
        const res = await api.put(`/expenses/${expense._id}`, { ...form, splitBetween })
        data = res.data
        toast.success('Expense updated!')
      } else {
        const res = await api.post('/expenses', { ...form, groupId, splitBetween })
        data = res.data
        toast.success('Expense added!')
      }
      onSuccess(data.expense)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save expense')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="label">Description *</label>
          <input className="input" placeholder="What's this expense for?" value={form.description} onChange={e => set('description', e.target.value)} required />
        </div>

        <div>
          <label className="label">Amount (₹) *</label>
          <input className="input font-mono" type="number" min="0.01" step="0.01" placeholder="0.00" value={form.amount} onChange={e => set('amount', e.target.value)} required />
        </div>

        <div>
          <label className="label">Date</label>
          <input className="input" type="date" value={form.date} onChange={e => set('date', e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Category</label>
          <select className="input" value={form.category} onChange={e => set('category', e.target.value)}>
            {CATEGORIES.map(c => (
              <option key={c} value={c}>{CAT_ICONS[c]} {c.charAt(0).toUpperCase() + c.slice(1)}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">Paid By</label>
          <select className="input" value={form.paidBy} onChange={e => set('paidBy', e.target.value)}>
            {members.map(m => (
              <option key={m.user._id} value={m.user._id}>{m.user.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="label">Notes</label>
        <input className="input" placeholder="Optional notes" value={form.notes} onChange={e => set('notes', e.target.value)} />
      </div>

      {/* Split type */}
      <div>
        <label className="label">Split Type</label>
        <div className="flex gap-2">
          {['equal', 'exact', 'percentage'].map(t => (
            <button
              type="button"
              key={t}
              onClick={() => set('splitType', t)}
              className={`flex-1 py-2 px-3 rounded-xl text-sm font-medium border-2 transition-all ${form.splitType === t ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300' : 'border-[var(--border)] text-[var(--text-secondary)] hover:border-brand-300'}`}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Split between */}
      <div>
        <label className="label">Split Between</label>
        <div className="space-y-2">
          {members.map(m => (
            <div key={m.user._id} className="flex items-center gap-3 p-2.5 rounded-xl border border-[var(--border)] hover:border-brand-300 transition-colors">
              <input
                type="checkbox"
                checked={selected.includes(m.user._id)}
                onChange={() => toggleMember(m.user._id)}
                className="w-4 h-4 accent-brand-600 flex-shrink-0"
              />
              <Avatar user={m.user} size="sm" />
              <span className="flex-1 text-sm font-medium text-[var(--text-primary)]">{m.user.name}</span>

              {selected.includes(m.user._id) && (
                <>
                  {form.splitType === 'equal' && (
                    <span className="text-xs font-mono text-brand-600 font-medium">₹{getPerShare().toFixed(2)}</span>
                  )}
                  {form.splitType === 'exact' && (
                    <input
                      type="number"
                      className="input w-24 py-1 text-sm"
                      placeholder="0.00"
                      value={exactAmounts[m.user._id] || ''}
                      onChange={e => setExactAmounts(a => ({ ...a, [m.user._id]: e.target.value }))}
                    />
                  )}
                  {form.splitType === 'percentage' && (
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        className="input w-16 py-1 text-sm"
                        placeholder="0"
                        value={percentages[m.user._id] || ''}
                        onChange={e => setPercentages(p => ({ ...p, [m.user._id]: e.target.value }))}
                      />
                      <span className="text-xs text-[var(--text-secondary)]">%</span>
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel} className="btn-secondary flex-1">Cancel</button>
        <button type="submit" disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2">
          {loading ? <Spinner size="sm" color="white" /> : null}
          {isEdit ? 'Update' : 'Add'} Expense
        </button>
      </div>
    </form>
  )
}
