import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '@/store/useStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PenTool } from 'lucide-react'
import type { Role } from '@/data/types'

const roles: { value: Role; label: string; desc: string }[] = [
  { value: 'admin', label: 'Admin', desc: 'Manage clients, users, and KPIs' },
  { value: 'writer', label: 'Writer', desc: 'Write and manage review content' },
  { value: 'provider', label: 'Provider', desc: 'Deliver written reviews' },
]

export function LoginPage() {
  const [selectedRole, setSelectedRole] = useState<Role>('admin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const login = useStore(s => s.login)
  const navigate = useNavigate()

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    login(selectedRole)
    const redirectMap: Record<Role, string> = {
      admin: '/admin/overview',
      writer: '/writer/queue',
      provider: '/provider/overview',
    }
    navigate(redirectMap[selectedRole])
  }

  return (
    <div className="min-h-screen bg-dark-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo & Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-peach-500 mb-4">
            <PenTool size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-dark-50">Peach Reviews</h1>
          <p className="text-dark-400 text-sm mt-1">Review content management platform</p>
        </div>

        {/* Login Card */}
        <div className="bg-dark-900 border border-dark-700/50 rounded-2xl p-6 shadow-xl">
          <form onSubmit={handleLogin} className="space-y-5">
            {/* Role Selector */}
            <div>
              <label className="block text-xs font-medium text-dark-400 mb-2 uppercase tracking-wider">
                Sign in as
              </label>
              <div className="grid grid-cols-3 gap-2">
                {roles.map(role => (
                  <button
                    key={role.value}
                    type="button"
                    onClick={() => setSelectedRole(role.value)}
                    className={`relative px-3 py-3 rounded-xl border text-center transition-all ${
                      selectedRole === role.value
                        ? 'border-peach-500 bg-peach-500/10 text-peach-400'
                        : 'border-dark-700 bg-dark-850 text-dark-400 hover:border-dark-600'
                    }`}
                  >
                    <span className="block text-sm font-semibold">{role.label}</span>
                    <span className="block text-[10px] mt-0.5 opacity-70">{role.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-medium text-dark-400 mb-1.5 uppercase tracking-wider">
                Email
              </label>
              <Input
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-medium text-dark-400 mb-1.5 uppercase tracking-wider">
                Password
              </label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>

            {/* Login Button */}
            <Button type="submit" className="w-full h-11 text-sm font-semibold">
              Sign In
            </Button>

            <p className="text-center text-[11px] text-dark-500">
              Demo mode — no real authentication required
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
