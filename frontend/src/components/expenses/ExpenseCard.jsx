import { useState } from 'react'
import Avatar from '../common/Avatar'
import { useAuth } from '../../context/AuthContext'

const CAT_ICONS = { food: '🍕', transport: '🚗', accommodation: '🏨', entertainment: '🎬', shopping: '🛍️', utilities: '💡', health: '💊', other: '📦' }

const fmt = (n) => `₹${Number(n).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`

export default function ExpenseCard({ expense, onEdit, onDelete }) {
  const { user } = useAuth()
  const [expanded, setExpanded] = useState(false)

  const myShare = expense.splitBetween?.find(s => s.user?._id === user._id || s.user === user._id)
  const iPaid = expense.paidBy?._id === user._id || expense.paidBy === user._id
  const date = new Date(expense.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

  const splitTypeLabel = { equal: 'Equal split', exact: 'Exact amounts', percentage: 'By percentage' }

  return (
    <div className="card overflow-hidden hover:shadow-md transition-all duration-200">
      <div
        className="p-4 cursor-pointer"
        onClick={() => setExpanded(v => !v)}
      >
        <div className="flex items-start gap-3">
          {/* Category icon */}
          <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center text-xl flex-shrink-0">
            {CAT_ICONS[expense.category] || '📦'}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h4 className="font-semibold text-[var(--text-primary)] truncate">{expense.description}</h4>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <span className="text-xs text-[var(--text-secondary)]">{date}</span>
                  <span className="text-[var(--border)]">·</span>
                  <span className="text-xs text-[var(--text-secondary)]">
                    Paid by <span className="font-medium text-[var(--text-primary)]">{expense.paidBy?.name || 'Unknown'}</span>
                  </span>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="font-bold text-[var(--text-primary)] font-mono">{fmt(expense.amount)}</p>
                {myShare && !iPaid && (
                  <p className="text-xs text-red-500 font-medium">You owe {fmt(myShare.share)}</p>
                )}
                {iPaid && myShare && (
                  <p className="text-xs text-brand-600 font-medium">You paid</p>
                )}
              </div>
            </div>
          </div>

          <svg
            className={`w-4 h-4 text-[var(--text-secondary)] flex-shrink-0 mt-1 transition-transform ${expanded ? 'rotate-180' : ''}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-[var(--border)] px-4 py-3 bg-brand-50/30 dark:bg-brand-900/10 animate-fade-in">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
              {splitTypeLabel[expense.splitType]}
            </span>
            <div className="flex gap-2">
              {onEdit && (
                <button
                  onClick={(e) => { e.stopPropagation(); onEdit(expense) }}
                  className="text-xs text-brand-600 hover:text-brand-700 font-medium px-2 py-1 rounded-lg hover:bg-brand-100 dark:hover:bg-brand-900/40 transition-colors"
                >
                  Edit
                </button>
              )}
              {onDelete && (
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(expense._id) }}
                  className="text-xs text-red-500 hover:text-red-600 font-medium px-2 py-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  Delete
                </button>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            {expense.splitBetween?.map((s, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Avatar user={s.user} size="xs" />
                  <span className="text-sm text-[var(--text-primary)]">{s.user?.name}</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-mono font-medium text-[var(--text-primary)]">{fmt(s.share)}</span>
                  {expense.splitType === 'percentage' && s.percentage && (
                    <span className="text-xs text-[var(--text-secondary)] ml-1">({s.percentage}%)</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {expense.notes && (
            <p className="text-xs text-[var(--text-secondary)] mt-2 italic border-t border-[var(--border)] pt-2">
              📝 {expense.notes}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
