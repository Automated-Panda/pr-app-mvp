import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '@/store/useStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PenTool, BarChart3, Globe, Workflow, AlertCircle } from 'lucide-react'
import type { Role } from '@/data/types'

const DEMO_ACCOUNTS: Record<string, { password: string; role: Role }> = {
  'admin@peachreviews.com': { password: 'password', role: 'admin' },
  'writer@peachreviews.com': { password: 'password', role: 'writer' },
  'provider@peachreviews.com': { password: 'password', role: 'provider' },
}

const features = [
  {
    icon: Globe,
    title: 'Multi-Platform Management',
    desc: 'Google, Yelp, Trustpilot, Facebook & more',
  },
  {
    icon: BarChart3,
    title: 'Real-Time Analytics',
    desc: 'Track performance across all locations',
  },
  {
    icon: Workflow,
    title: 'Workflow Automation',
    desc: 'Streamlined writer-to-provider pipeline',
  },
]

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const login = useStore(s => s.login)
  const navigate = useNavigate()

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const account = DEMO_ACCOUNTS[email.toLowerCase().trim()]
    if (!account || account.password !== password) {
      setError('Invalid email or password')
      return
    }

    login(account.role, email.toLowerCase().trim())
    const redirectMap: Record<Role, string> = {
      admin: '/admin/overview',
      writer: '/writer/queue',
      provider: '/provider/overview',
    }
    navigate(redirectMap[account.role])
  }

  return (
    <div className="min-h-screen bg-dark-950 flex">
      {/* Left Panel — Branded Showcase */}
      <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden bg-dark-900 items-center justify-center p-12">
        {/* Gradient orbs */}
        <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-peach-500/15 rounded-full blur-[100px] animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-peach-600/10 rounded-full blur-[80px] animate-float" style={{ animationDelay: '-4s' }} />

        <div className="relative z-10 max-w-sm animate-fade-in">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-peach-500 flex items-center justify-center">
              <PenTool size={20} className="text-white" />
            </div>
            <span className="text-xl font-bold text-dark-50">Peach Reviews</span>
          </div>

          <h2 className="text-2xl font-bold text-dark-50 mb-3">
            Review content management, simplified.
          </h2>
          <p className="text-dark-400 text-sm mb-10 leading-relaxed">
            Manage review content across multiple platforms, track writer workflows, and deliver results — all from one dashboard.
          </p>

          {/* Feature cards — glassmorphism */}
          <div className="space-y-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="flex items-start gap-3 p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-sm"
              >
                <div className="w-8 h-8 rounded-lg bg-peach-500/10 flex items-center justify-center shrink-0 mt-0.5">
                  <feature.icon size={16} className="text-peach-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-dark-100">{feature.title}</p>
                  <p className="text-xs text-dark-500 mt-0.5">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel — Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-sm animate-fade-in-delay">
          {/* Mobile-only logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-10 h-10 rounded-xl bg-peach-500 flex items-center justify-center">
              <PenTool size={20} className="text-white" />
            </div>
            <span className="text-xl font-bold text-dark-50">Peach Reviews</span>
          </div>

          <h1 className="text-2xl font-bold text-dark-50 mb-1">Welcome back</h1>
          <p className="text-dark-400 text-sm mb-8">Sign in to your account to continue</p>

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Error message */}
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <AlertCircle size={14} className="text-red-400 shrink-0" />
                <span className="text-sm text-red-400">{error}</span>
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-xs font-medium text-dark-400 mb-1.5">
                Email address
              </label>
              <Input
                type="email"
                placeholder="you@peachreviews.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="h-10"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-medium text-dark-400 mb-1.5">
                Password
              </label>
              <Input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="h-10"
              />
            </div>

            {/* Sign In */}
            <Button type="submit" className="w-full h-10 text-sm font-semibold mt-2">
              Sign In
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
