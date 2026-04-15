import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import GroupCard from '../components/groups/GroupCard'
import ExpenseCard from '../components/expenses/ExpenseCard'
import { MonthlyBarChart, CategoryDoughnut } from '../components/charts/Charts'
import Spinner from '../components/common/Spinner'

const fmt = (n) => `₹${Math.abs(Number(n)).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`

function StatCard({ label, amount, sub, color }) {
  const colors = {
    green: 'text-brand-600 dark:text-brand-400',
    red: 'text-red-500',
    neutral: 'text-[var(--text-primary)]',
  }
  return (
    <div className="stat-card">
      <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">{label}</p>
      <p className={`text-2xl font-extrabold font-mono ${colors[color]}`}>{amount}</p>
      {sub && <p className="text-xs text-[var(--text-secondary)]">{sub}</p>}
    </div>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const { groups } = useOutletContext()
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchStats = useCallback(async () => {
    try {
      const { data } = await api.get('/expenses/dashboard')
      setStats(data)
    } catch {
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchStats() }, [fetchStats])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Spinner size="lg" />
    </div>
  )

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-[var(--text-primary)]">
          Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">Here's your expense overview</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="You are owed"
          amount={fmt(stats?.stats?.totalOwed || 0)}
          sub="Others owe you"
          color="green"
        />
        <StatCard
          label="You owe"
          amount={fmt(stats?.stats?.totalOwing || 0)}
          sub="To others"
          color="red"
        />
        <StatCard
          label="Net Balance"
          amount={`${(stats?.stats?.balance || 0) >= 0 ? '+' : ''}${fmt(stats?.stats?.balance || 0)}`}
          sub={(stats?.stats?.balance || 0) >= 0 ? 'In your favour' : 'Against you'}
          color={(stats?.stats?.balance || 0) >= 0 ? 'green' : 'red'}
        />
        <StatCard
          label="Total Groups"
          amount={stats?.stats?.groupCount || 0}
          sub={`${stats?.stats?.expenseCount || 0} total expenses`}
          color="neutral"
        />
      </div>

      {/* Charts */}
      {(stats?.monthlyData?.length > 0 || stats?.categoryData?.length > 0) && (
        <div className="grid md:grid-cols-2 gap-4">
          <div className="card p-5">
            <h3 className="font-bold text-[var(--text-primary)] mb-4">Monthly Expenses</h3>
            {stats?.monthlyData && <MonthlyBarChart data={stats.monthlyData} />}
          </div>
          <div className="card p-5">
            <h3 className="font-bold text-[var(--text-primary)] mb-4">Spending by Category</h3>
            {stats?.categoryData && <CategoryDoughnut data={stats.categoryData} />}
          </div>
        </div>
      )}

      {/* Groups + Recent Expenses */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Groups */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-[var(--text-primary)]">Your Groups</h2>
            <span className="text-xs text-[var(--text-secondary)]">{groups.length} groups</span>
          </div>
          {groups.length === 0 ? (
            <div className="card p-8 text-center">
              <p className="text-3xl mb-2">👥</p>
              <p className="font-semibold text-[var(--text-primary)]">No groups yet</p>
              <p className="text-sm text-[var(--text-secondary)] mt-1">Create a group to start splitting expenses</p>
            </div>
          ) : (
            <div className="space-y-3">
              {groups.slice(0, 4).map(g => (
                <GroupCard key={g._id} group={g} />
              ))}
              {groups.length > 4 && (
                <button
                  onClick={() => {}}
                  className="w-full text-sm text-brand-600 hover:text-brand-700 font-medium py-2"
                >
                  View all {groups.length} groups →
                </button>
              )}
            </div>
          )}
        </div>

        {/* Recent Expenses */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-[var(--text-primary)]">Recent Expenses</h2>
          </div>
          {(!stats?.recentExpenses || stats.recentExpenses.length === 0) ? (
            <div className="card p-8 text-center">
              <p className="text-3xl mb-2">💸</p>
              <p className="font-semibold text-[var(--text-primary)]">No expenses yet</p>
              <p className="text-sm text-[var(--text-secondary)] mt-1">Add an expense inside a group</p>
            </div>
          ) : (
            <div className="space-y-3">
              {stats.recentExpenses.map(e => (
                <div
                  key={e._id}
                  onClick={() => navigate(`/groups/${e.groupId}`)}
                  className="card p-3 flex items-center gap-3 cursor-pointer hover:shadow-md transition-all"
                >
                  <div className="w-9 h-9 rounded-xl bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center text-lg flex-shrink-0">
                    {({ food:'🍕',transport:'🚗',accommodation:'🏨',entertainment:'🎬',shopping:'🛍️',utilities:'💡',health:'💊',other:'📦' })[e.category] || '📦'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{e.description}</p>
                    <p className="text-xs text-[var(--text-secondary)]">
                      {new Date(e.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      {' · '}Paid by {e.paidBy?.name}
                    </p>
                  </div>
                  <span className="font-bold font-mono text-sm text-[var(--text-primary)] flex-shrink-0">
                    ₹{Number(e.amount).toLocaleString('en-IN')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
