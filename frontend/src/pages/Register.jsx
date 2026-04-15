import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import Spinner from '../components/common/Spinner'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [loading, setLoading] = useState(false)
  const [showPw, setShowPw] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.password !== form.confirm) return toast.error('Passwords do not match')
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters')
    setLoading(true)
    try {
      await register(form.name, form.email, form.password)
      toast.success('Account created! Welcome 🎉')
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const strength = form.password.length === 0 ? 0 : form.password.length < 6 ? 1 : form.password.length < 10 ? 2 : 3
  const strengthColors = ['', 'bg-red-400', 'bg-amber-400', 'bg-brand-500']
  const strengthLabels = ['', 'Weak', 'Fair', 'Strong']

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-brand-700 p-12 relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
              <span className="text-white font-extrabold">S</span>
            </div>
            <span className="text-white font-extrabold text-xl tracking-tight">SplitWise</span>
          </div>
        </div>

        <div className="relative z-10 space-y-6">
          <h2 className="text-4xl font-extrabold text-white leading-tight">
            Start splitting<br />smarter today.
          </h2>
          <p className="text-brand-100 text-lg leading-relaxed max-w-sm">
            Join thousands of users who simplify shared expenses with friends, family, and colleagues.
          </p>

          <div className="card p-5 bg-white/10 border-white/20 space-y-3">
            <p className="text-white font-semibold text-sm">How the debt algorithm works:</p>
            <div className="space-y-2 text-brand-100 text-sm">
              <p>1. Rahul pays ₹1,200 for 3 people</p>
              <p>2. Each share = ₹400</p>
              <p>3. Aman & Priya each owe Rahul ₹400</p>
              <div className="border-t border-white/20 pt-2">
                <p className="text-white font-medium">After simplification:</p>
                <p>Instead of 4 transactions → just 2! ✅</p>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute -top-20 -right-20 w-72 h-72 bg-white/5 rounded-full" />
        <div className="absolute -bottom-10 -left-10 w-52 h-52 bg-white/5 rounded-full" />

        <p className="text-brand-200 text-sm relative z-10">© 2024 SplitWise. All rights reserved.</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6 bg-[var(--bg-primary)]">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-brand-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-extrabold text-sm">S</span>
            </div>
            <span className="font-extrabold text-xl text-[var(--text-primary)]">SplitWise</span>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-extrabold text-[var(--text-primary)]">Create account</h1>
            <p className="text-[var(--text-secondary)] mt-1">Start splitting expenses for free</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Full Name</label>
              <input
                className="input"
                placeholder="Rahul Sharma"
                value={form.name}
                onChange={e => set('name', e.target.value)}
                required
                autoComplete="name"
              />
            </div>

            <div>
              <label className="label">Email</label>
              <input
                className="input"
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={e => set('email', e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  className="input pr-12"
                  type={showPw ? 'text' : 'password'}
                  placeholder="Min. 6 characters"
                  value={form.password}
                  onChange={e => set('password', e.target.value)}
                  required
                  autoComplete="new-password"
                />
                <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={showPw ? "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" : "M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"} />
                  </svg>
                </button>
              </div>
              {form.password.length > 0 && (
                <div className="mt-2 space-y-1">
                  <div className="flex gap-1">
                    {[1, 2, 3].map(i => (
                      <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${i <= strength ? strengthColors[strength] : 'bg-gray-200 dark:bg-gray-700'}`} />
                    ))}
                  </div>
                  <p className="text-xs text-[var(--text-secondary)]">{strengthLabels[strength]}</p>
                </div>
              )}
            </div>

            <div>
              <label className="label">Confirm Password</label>
              <input
                className={`input ${form.confirm && form.confirm !== form.password ? 'border-red-400 focus:ring-red-300' : ''}`}
                type="password"
                placeholder="••••••••"
                value={form.confirm}
                onChange={e => set('confirm', e.target.value)}
                required
                autoComplete="new-password"
              />
              {form.confirm && form.confirm !== form.password && (
                <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
              )}
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 py-3 text-base">
              {loading ? <Spinner size="sm" color="white" /> : null}
              Create Account
            </button>
          </form>

          <p className="text-center text-sm text-[var(--text-secondary)] mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-600 font-semibold hover:text-brand-700 transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
