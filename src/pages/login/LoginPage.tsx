import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '@/store/useStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AlertCircle } from 'lucide-react'
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

      <div className="relative z-10 w-full max-w-xl animate-fade-in">
        {/* Logo */}
        <div className="flex items-center justify-center gap-4 mb-16">
          <span className="text-4xl" role="img" aria-label="Peach">🍑</span>
          <span className="text-3xl font-bold text-dark-50">Peach Reviews</span>
        </div>

        {/* Card */}
        <div className="bg-dark-900/80 border border-dark-700/50 rounded-2xl px-14 py-14 backdrop-blur-sm shadow-2xl">
          <h1 className="text-2xl font-semibold text-dark-50 mb-3">Sign in</h1>
          <p className="text-dark-500 text-base mb-10">Enter your credentials to continue</p>

          <form onSubmit={handleLogin} className="space-y-8">
            {error && (
              <div className="flex items-center gap-2 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                <AlertCircle size={16} className="text-red-400 shrink-0" />
                <span className="text-sm text-red-400">{error}</span>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-dark-400 mb-2.5">Email</label>
              <Input
                type="email"
                placeholder="you@peachreviews.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="h-12 text-base"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-400 mb-2.5">Password</label>
              <Input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="h-12 text-base"
              />
            </div>

            <Button type="submit" className="w-full h-12 text-base font-semibold mt-4">
              Sign In
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
