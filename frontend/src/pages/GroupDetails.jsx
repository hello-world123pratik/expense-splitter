import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import Modal from '../components/common/Modal'
import AddExpenseForm from '../components/expenses/AddExpenseForm'
import ExpenseCard from '../components/expenses/ExpenseCard'
import BalanceSummary from '../components/expenses/BalanceSummary'
import Avatar from '../components/common/Avatar'
import Spinner from '../components/common/Spinner'
import toast from 'react-hot-toast'

const fmt = (n) => `₹${Number(n).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`

export default function GroupDetails() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('expenses') // expenses | balances | activity
  const [showAddExpense, setShowAddExpense] = useState(false)
  const [showAddMember, setShowAddMember] = useState(false)
  const [editExpense, setEditExpense] = useState(null)
  const [memberEmail, setMemberEmail] = useState('')
  const [addingMember, setAddingMember] = useState(false)
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('')

  const CATS = ['', 'food', 'transport', 'accommodation', 'entertainment', 'shopping', 'utilities', 'health', 'other']

  const fetch = useCallback(async () => {
    try {
      const { data } = await api.get(`/groups/${id}`)
      setData(data)
    } catch (err) {
      if (err.response?.status === 404) navigate('/dashboard')
      toast.error('Failed to load group')
    } finally {
      setLoading(false)
    }
  }, [id, navigate])

  useEffect(() => { fetch() }, [fetch])

  const handleAddMember = async (e) => {
    e.preventDefault()
    if (!memberEmail.trim()) return
    setAddingMember(true)
    try {
      await api.post(`/groups/${id}/members`, { email: memberEmail })
      toast.success('Member added!')
      setMemberEmail('')
      setShowAddMember(false)
      fetch()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add member')
    } finally {
      setAddingMember(false)
    }
  }

  const handleDeleteExpense = async (expenseId) => {
    if (!confirm('Delete this expense?')) return
    try {
      await api.delete(`/expenses/${expenseId}`)
      toast.success('Expense deleted')
      fetch()
    } catch {
      toast.error('Failed to delete expense')
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>
  )

  if (!data) return null

  const { group, expenses, payments, totalAmount, balances, transactions } = data

  const filteredExpenses = expenses.filter(e => {
    const matchSearch = !search || e.description.toLowerCase().includes(search.toLowerCase())
    const matchCat = !filterCategory || e.category === filterCategory
    return matchSearch && matchCat
  })

  const isAdmin = group.members?.find(m => m.user._id === user._id)?.role === 'admin'

  return (
    <div className="max-w-4xl mx-auto space-y-5 animate-fade-in">
      {/* Header */}
      <div className="card p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center text-3xl flex-shrink-0">
              {group.icon || '👥'}
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-[var(--text-primary)]">{group.groupName}</h1>
              {group.description && (
                <p className="text-sm text-[var(--text-secondary)] mt-0.5">{group.description}</p>
              )}
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="badge badge-green capitalize">{group.category}</span>
                <span className="text-xs text-[var(--text-secondary)]">{group.members?.length} members</span>
                <span className="text-xs text-[var(--text-secondary)]">·</span>
                <span className="text-xs text-[var(--text-secondary)]">Total: <span className="font-semibold text-[var(--text-primary)]">{fmt(totalAmount)}</span></span>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={() => setShowAddMember(true)} className="btn-secondary text-sm py-2 px-4">
              + Member
            </button>
            <button onClick={() => setShowAddExpense(true)} className="btn-primary text-sm py-2 px-4">
              + Expense
            </button>
          </div>
        </div>

        {/* Members row */}
        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-[var(--border)] flex-wrap">
          <span className="text-xs text-[var(--text-secondary)] font-medium">Members:</span>
          {group.members?.map((m, i) => (
            <div key={i} className="flex items-center gap-1.5 bg-brand-50 dark:bg-brand-900/20 rounded-full px-2.5 py-1">
              <Avatar user={m.user} size="xs" />
              <span className="text-xs font-medium text-[var(--text-primary)]">{m.user.name}</span>
              {m.role === 'admin' && <span className="text-[10px] text-brand-600 font-bold">★</span>}
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[var(--bg-card)] rounded-2xl p-1 border border-[var(--border)]">
        {[
          { key: 'expenses', label: `Expenses (${expenses.length})` },
          { key: 'balances', label: 'Balances' },
          { key: 'activity', label: 'Activity' },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 py-2 px-3 rounded-xl text-sm font-semibold transition-all ${tab === t.key ? 'bg-brand-600 text-white shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Expenses tab */}
      {tab === 'expenses' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex gap-3 flex-wrap">
            <input
              className="input flex-1 min-w-40"
              placeholder="Search expenses…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <select className="input w-44" value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
              <option value="">All Categories</option>
              {CATS.filter(Boolean).map(c => (
                <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
              ))}
            </select>
          </div>

          {filteredExpenses.length === 0 ? (
            <div className="card p-10 text-center">
              <p className="text-4xl mb-3">💸</p>
              <p className="font-semibold text-[var(--text-primary)]">
                {search || filterCategory ? 'No matching expenses' : 'No expenses yet'}
              </p>
              <p className="text-sm text-[var(--text-secondary)] mt-1 mb-4">
                {!search && !filterCategory && 'Add the first expense to get started'}
              </p>
              {!search && !filterCategory && (
                <button onClick={() => setShowAddExpense(true)} className="btn-primary text-sm">
                  Add Expense
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredExpenses.map(e => (
                <ExpenseCard
                  key={e._id}
                  expense={e}
                  onEdit={(exp) => setEditExpense(exp)}
                  onDelete={handleDeleteExpense}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Balances tab */}
      {tab === 'balances' && (
        <BalanceSummary
          balances={balances}
          transactions={transactions}
          groupId={id}
          onSettle={fetch}
          currentUserId={user._id}
        />
      )}

      {/* Activity tab */}
      {tab === 'activity' && (
        <div className="card p-4">
          <h3 className="font-bold text-[var(--text-primary)] mb-4">Activity Log</h3>
          {group.activityLog?.length === 0 ? (
            <p className="text-sm text-[var(--text-secondary)] text-center py-6">No activity yet</p>
          ) : (
            <div className="space-y-3">
              {[...group.activityLog].reverse().map((log, i) => (
                <div key={i} className="flex gap-3 items-start">
                  <Avatar user={log.user} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[var(--text-primary)]">{log.details}</p>
                    <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                      {new Date(log.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short', year: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add Expense Modal */}
      <Modal open={showAddExpense} onClose={() => setShowAddExpense(false)} title="Add Expense" size="lg">
        <AddExpenseForm
          groupId={id}
          members={group.members || []}
          onSuccess={() => { setShowAddExpense(false); fetch() }}
          onCancel={() => setShowAddExpense(false)}
        />
      </Modal>

      {/* Edit Expense Modal */}
      <Modal open={!!editExpense} onClose={() => setEditExpense(null)} title="Edit Expense" size="lg">
        {editExpense && (
          <AddExpenseForm
            groupId={id}
            members={group.members || []}
            expense={editExpense}
            onSuccess={() => { setEditExpense(null); fetch() }}
            onCancel={() => setEditExpense(null)}
          />
        )}
      </Modal>

      {/* Add Member Modal */}
      <Modal open={showAddMember} onClose={() => setShowAddMember(false)} title="Add Member">
        <form onSubmit={handleAddMember} className="space-y-4">
          <div>
            <label className="label">Member's Email</label>
            <input
              className="input"
              type="email"
              placeholder="friend@example.com"
              value={memberEmail}
              onChange={e => setMemberEmail(e.target.value)}
              required
            />
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              The user must already have an account on SplitWise.
            </p>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => setShowAddMember(false)} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={addingMember} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {addingMember ? <Spinner size="sm" color="white" /> : null}
              Add Member
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
