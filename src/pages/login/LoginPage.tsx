import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '@/store/useStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PenTool, AlertCircle } from 'lucide-react'
import type { Role } from '@/data/types'

const DEMO_ACCOUNTS: Record<string, { password: string; role: Role }> = {
  'admin@peachreviews.com': { password: 'password', role: 'admin' },
  'writer@peachreviews.com': { password: 'password', role: 'writer' },
  'provider@peachreviews.com': { password: 'password', role: 'provider' },
}

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
    <div className="min-h-screen bg-dark-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Subtle background orb */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-peach-500/[0.07] rounded-full blur-[120px] animate-float" />

      <div className="relative z-10 w-full max-w-md animate-fade-in">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-12">
          <div className="w-11 h-11 rounded-xl bg-peach-500 flex items-center justify-center">
            <PenTool size={22} className="text-white" />
          </div>
          <span className="text-2xl font-bold text-dark-50">Peach Reviews</span>
        </div>

        {/* Card */}
        <div className="bg-dark-900/80 border border-dark-700/50 rounded-2xl px-10 py-10 backdrop-blur-sm shadow-2xl">
          <h1 className="text-xl font-semibold text-dark-50 mb-2">Sign in</h1>
          <p className="text-dark-500 text-sm mb-8">Enter your credentials to continue</p>

          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <AlertCircle size={14} className="text-red-400 shrink-0" />
                <span className="text-sm text-red-400">{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-dark-400 mb-2">Email</label>
              <Input
                type="email"
                placeholder="you@peachreviews.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="h-11"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-dark-400 mb-2">Password</label>
              <Input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="h-11"
              />
            </div>

            <Button type="submit" className="w-full h-11 text-sm font-semibold mt-2">
              Sign In
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
