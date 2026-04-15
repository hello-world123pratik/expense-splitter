import { useNavigate } from 'react-router-dom'
import Avatar from '../common/Avatar'

const formatCurrency = (n) => `₹${Math.abs(n).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`

export default function GroupCard({ group }) {
  const navigate = useNavigate()

  return (
    <div
      onClick={() => navigate(`/groups/${group._id}`)}
      className="card p-5 cursor-pointer hover:shadow-md hover:border-brand-200 dark:hover:border-brand-700 transition-all duration-200 group"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center text-2xl flex-shrink-0">
            {group.icon || '👥'}
          </div>
          <div>
            <h3 className="font-bold text-[var(--text-primary)] group-hover:text-brand-600 transition-colors leading-tight">
              {group.groupName}
            </h3>
            <p className="text-xs text-[var(--text-secondary)] capitalize">{group.category}</p>
          </div>
        </div>

        <div className={`text-sm font-bold font-mono ${group.userBalance > 0 ? 'text-brand-600' : group.userBalance < 0 ? 'text-red-500' : 'text-[var(--text-secondary)]'}`}>
          {group.userBalance > 0 ? '+' : ''}{group.userBalance !== 0 ? formatCurrency(group.userBalance) : '—'}
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
        {/* Member avatars */}
        <div className="flex -space-x-2">
          {(group.members || []).slice(0, 4).map((m, i) => (
            <Avatar key={i} user={m.user} size="xs" className="ring-2 ring-[var(--bg-card)]" />
          ))}
          {group.members?.length > 4 && (
            <div className="h-6 w-6 rounded-full bg-gray-200 dark:bg-gray-700 ring-2 ring-[var(--bg-card)] flex items-center justify-center text-[10px] font-bold text-gray-600 dark:text-gray-300">
              +{group.members.length - 4}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <span>{group.expenseCount || 0} expenses</span>
          {group.totalAmount > 0 && (
            <span className="font-medium text-[var(--text-primary)]">{formatCurrency(group.totalAmount)} total</span>
          )}
        </div>
      </div>
    </div>
  )
}
