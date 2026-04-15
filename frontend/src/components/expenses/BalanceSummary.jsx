import Avatar from '../common/Avatar'
import { useAuth } from '../../context/AuthContext'
import { useState } from 'react'
import api from '../../api/axios'
import toast from 'react-hot-toast'
import Modal from '../common/Modal'
import Spinner from '../common/Spinner'

const fmt = (n) => `₹${Math.abs(Number(n)).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`

function SettleModal({ transaction, groupId, onSuccess, onClose }) {
  const [loading, setLoading] = useState(false)
  const [note, setNote] = useState('')

  const handleSettle = async () => {
    setLoading(true)
    try {
      await api.post('/payments', {
        receiver: transaction.to,
        amount: transaction.amount,
        groupId,
        note,
      })
      toast.success('Payment recorded!')
      onSuccess()
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to record payment')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="card p-4 bg-brand-50/50 dark:bg-brand-900/20 border-brand-200 dark:border-brand-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Avatar user={transaction.fromUser} size="sm" />
            <span className="text-sm font-medium">{transaction.fromUser?.name}</span>
          </div>
          <div className="flex items-center gap-2 text-[var(--text-secondary)]">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
            <span className="font-bold font-mono text-brand-600">{fmt(transaction.amount)}</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{transaction.toUser?.name}</span>
            <Avatar user={transaction.toUser} size="sm" />
          </div>
        </div>
      </div>

      <div>
        <label className="label">Note (optional)</label>
        <input
          className="input"
          placeholder="e.g. Paid via UPI"
          value={note}
          onChange={e => setNote(e.target.value)}
        />
      </div>

      <div className="flex gap-3">
        <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
        <button onClick={handleSettle} disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2">
          {loading ? <Spinner size="sm" color="white" /> : '✅'}
          Confirm Settlement
        </button>
      </div>
    </div>
  )
}

export default function BalanceSummary({ balances, transactions, groupId, onSettle, currentUserId }) {
  const [settleTarget, setSettleTarget] = useState(null)

  const myBalance = balances?.find(b => b.user?._id === currentUserId)?.balance || 0

  return (
    <div className="space-y-4">
      {/* My balance card */}
      <div className={`card p-4 border-2 ${myBalance > 0 ? 'border-brand-200 dark:border-brand-800 bg-brand-50/50 dark:bg-brand-900/20' : myBalance < 0 ? 'border-red-200 dark:border-red-900 bg-red-50/50 dark:bg-red-900/10' : 'border-[var(--border)]'}`}>
        <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">Your Balance</p>
        <p className={`text-2xl font-extrabold font-mono ${myBalance > 0 ? 'text-brand-600' : myBalance < 0 ? 'text-red-500' : 'text-[var(--text-secondary)]'}`}>
          {myBalance > 0 ? '+' : ''}{fmt(myBalance)}
        </p>
        <p className="text-xs text-[var(--text-secondary)] mt-0.5">
          {myBalance > 0 ? 'You are owed' : myBalance < 0 ? 'You owe' : 'All settled up'}
        </p>
      </div>

      {/* Simplified transactions */}
      {transactions?.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">Suggested Settlements</h4>
          <div className="space-y-2">
            {transactions.map((t, i) => {
              const isMyPayment = t.from === currentUserId
              const isMyReceipt = t.to === currentUserId
              return (
                <div key={i} className={`card p-3 flex items-center justify-between gap-3 ${isMyPayment ? 'border-red-200 dark:border-red-900' : isMyReceipt ? 'border-brand-200 dark:border-brand-800' : ''}`}>
                  <div className="flex items-center gap-2 min-w-0">
                    <Avatar user={t.fromUser} size="sm" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                        <span className="font-semibold">{isMyPayment ? 'You' : t.fromUser?.name}</span>
                        <span className="text-[var(--text-secondary)]"> → </span>
                        <span className="font-semibold">{isMyReceipt ? 'You' : t.toUser?.name}</span>
                      </p>
                      <p className="text-xs text-[var(--text-secondary)]">should pay</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="font-bold font-mono text-[var(--text-primary)]">{fmt(t.amount)}</span>
                    {isMyPayment && (
                      <button
                        onClick={() => setSettleTarget(t)}
                        className="btn-primary text-xs py-1.5 px-3"
                      >
                        Settle
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {transactions?.length === 0 && (
        <div className="text-center py-6">
          <p className="text-3xl mb-2">🎉</p>
          <p className="font-semibold text-[var(--text-primary)]">All settled up!</p>
          <p className="text-sm text-[var(--text-secondary)]">No pending payments in this group.</p>
        </div>
      )}

      {/* All member balances */}
      {balances?.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">Member Balances</h4>
          <div className="space-y-1.5">
            {balances.map((b, i) => (
              <div key={i} className="flex items-center justify-between p-2.5 rounded-xl hover:bg-brand-50/50 dark:hover:bg-brand-900/10 transition-colors">
                <div className="flex items-center gap-2">
                  <Avatar user={b.user} size="sm" />
                  <span className="text-sm font-medium text-[var(--text-primary)]">
                    {b.user?._id === currentUserId ? 'You' : b.user?.name}
                  </span>
                </div>
                <span className={`font-mono font-bold text-sm ${b.balance > 0.01 ? 'text-brand-600' : b.balance < -0.01 ? 'text-red-500' : 'text-[var(--text-secondary)]'}`}>
                  {b.balance > 0.01 ? '+' : ''}{b.balance !== 0 ? fmt(b.balance) : '—'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <Modal open={!!settleTarget} onClose={() => setSettleTarget(null)} title="Record Settlement">
        {settleTarget && (
          <SettleModal
            transaction={settleTarget}
            groupId={groupId}
            onSuccess={onSettle}
            onClose={() => setSettleTarget(null)}
          />
        )}
      </Modal>
    </div>
  )
}
