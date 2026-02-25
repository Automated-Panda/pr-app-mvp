# Peach Reviews MVP Polish — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Polish the Peach Reviews MVP into a convincing, demo-ready app for a live client presentation.

**Architecture:** Frontend-only React 19 SPA. All changes are client-side: login page rewrite, Zustand persist middleware for localStorage, global error boundary, and .gitignore hardening. No backend or API changes.

**Tech Stack:** React 19, TypeScript, Vite 7, Zustand 5, Tailwind CSS 4, Radix UI, Lucide React

**Note on testing:** No test framework is installed in this project. Verification steps use `npm run build` (TypeScript type-check + Vite build) and visual checks via `npm run dev`. Each task ends with a build verification.

---

## Task 1: Harden .gitignore

**Files:**
- Modify: `peach-reviews/.gitignore`

**Step 1: Add sensitive file patterns to .gitignore**

Append the following to the end of `peach-reviews/.gitignore`:

```gitignore

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
.env*.local

# Secrets & credentials
*.pem
*.key
*.cert
*.p12

# OS files
Thumbs.db

# IDE extras
*.swp
*.swo
```

Note: `.DS_Store`, `.idea`, and `.vscode/*` are already present in the existing .gitignore.

**Step 2: Verify no sensitive files are tracked**

Run: `cd peach-reviews && git ls-files | grep -E '\.(env|pem|key|cert|p12)' || echo "No sensitive files tracked"`
Expected: "No sensitive files tracked"

**Step 3: Commit**

```bash
cd peach-reviews
git add .gitignore
git commit -m "chore: harden .gitignore with env, secrets, and OS patterns"
```

---

## Task 2: Add Zustand persist middleware for localStorage

**Files:**
- Modify: `peach-reviews/src/store/useStore.ts`

**Step 1: Add the persist middleware import**

At the top of `src/store/useStore.ts`, change:

```typescript
import { create } from 'zustand'
```

to:

```typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
```

**Step 2: Wrap the store creator with persist**

Change the store creation from:

```typescript
export const useStore = create<AppState>()((set, _get) => ({
```

to:

```typescript
export const useStore = create<AppState>()(persist(
  (set, _get) => ({
```

And at the very end of the store (after the final `}))`) close it with:

```typescript
  }),
  {
    name: 'peach-reviews-storage',
  }
))
```

The full closing should change from `}))` to `}),\n  {\n    name: 'peach-reviews-storage',\n  }\n))`.

**Step 3: Add a resetStore action to the AppState interface**

Add to the interface (after `deleteUser`):

```typescript
  /* ---- reset ---- */
  resetStore: () => void
```

**Step 4: Implement resetStore in the store body**

Add as the last action before the closing of the store function:

```typescript
  /* ================================================================ */
  /*  Reset                                                            */
  /* ================================================================ */

  resetStore: () =>
    set(() => ({
      currentUser: null,
      clients: [...seedClients],
      locations: [...seedLocations],
      users: [...seedUsers],
      tasks: [...seedTasks],
      globalActivity: [...initialGlobalActivity],
    })),
```

**Step 5: Verify build**

Run: `cd peach-reviews && npm run build`
Expected: Build succeeds with no TypeScript errors.

**Step 6: Commit**

```bash
cd peach-reviews
git add src/store/useStore.ts
git commit -m "feat: add localStorage persistence via Zustand persist middleware"
```

---

## Task 3: Add "Reset Demo Data" to Topbar user menu

**Files:**
- Modify: `peach-reviews/src/layouts/Topbar.tsx`

**Step 1: Import RotateCcw icon and toast**

Add to the existing imports in `Topbar.tsx`:

```typescript
import { Search, Bell, LogOut, User, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'
```

(Replace the existing lucide import line; add the sonner import.)

**Step 2: Get resetStore from the store**

Inside the `Topbar` component, add after the existing store selectors:

```typescript
const resetStore = useStore(s => s.resetStore)
```

**Step 3: Add handleReset function**

After `handleLogout`, add:

```typescript
const handleReset = () => {
  localStorage.removeItem('peach-reviews-storage')
  resetStore()
  setShowUserMenu(false)
  toast.success('Demo data has been reset')
}
```

**Step 4: Add the menu item in the dropdown**

In the user menu dropdown `<div>`, between the "Signed in as" section and the "Sign out" button, add:

```tsx
<button
  onClick={handleReset}
  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-dark-300 hover:text-dark-100 hover:bg-dark-800 transition-colors"
>
  <RotateCcw size={14} />
  Reset demo data
</button>
```

**Step 5: Verify build**

Run: `cd peach-reviews && npm run build`
Expected: Build succeeds.

**Step 6: Commit**

```bash
cd peach-reviews
git add src/layouts/Topbar.tsx
git commit -m "feat: add reset demo data button to user menu"
```

---

## Task 4: Create ErrorBoundary component

**Files:**
- Create: `peach-reviews/src/components/ErrorBoundary.tsx`
- Modify: `peach-reviews/src/main.tsx`

**Step 1: Create the ErrorBoundary component**

Create `src/components/ErrorBoundary.tsx` with this content:

```tsx
import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-dark-950 flex items-center justify-center p-4">
          <div className="bg-dark-900 border border-dark-700/50 rounded-2xl p-8 max-w-md w-full text-center shadow-xl">
            <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-400">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-dark-50 mb-2">Something went wrong</h1>
            <p className="text-dark-400 text-sm mb-6">
              The application encountered an unexpected error. Please reload to continue.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center justify-center rounded-lg font-medium bg-peach-500 text-white hover:bg-peach-600 h-10 px-6 text-sm transition-colors"
            >
              Reload Application
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
```

**Step 2: Wrap the app with ErrorBoundary in main.tsx**

In `src/main.tsx`, add the import:

```typescript
import { ErrorBoundary } from './components/ErrorBoundary'
```

Then wrap the render tree. Change from:

```tsx
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
      <Toaster ... />
    </BrowserRouter>
  </StrictMode>,
)
```

to:

```tsx
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <App />
        <Toaster ... />
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
)
```

(Keep the existing Toaster props exactly as they are.)

**Step 3: Verify build**

Run: `cd peach-reviews && npm run build`
Expected: Build succeeds.

**Step 4: Commit**

```bash
cd peach-reviews
git add src/components/ErrorBoundary.tsx src/main.tsx
git commit -m "feat: add global error boundary to prevent white-screen crashes"
```

---

## Task 5: Update seed user emails for demo accounts

**Files:**
- Modify: `peach-reviews/src/data/seed.ts`

The login page will authenticate against `admin@peachreviews.com`, `writer@peachreviews.com`, and `provider@peachreviews.com`. We need to update the first user of each role in seed data to use these emails so the login maps to real seed users.

**Step 1: Update the admin user email (user u1)**

In `src/data/seed.ts`, change the admin user (u1, Sarah Chen):

```typescript
email: 'sarah.chen@peachreviews.com',
```

to:

```typescript
email: 'admin@peachreviews.com',
```

**Step 2: Update the first writer user email (user u2)**

Change the writer user (u2, Marcus Thompson):

```typescript
email: 'marcus.thompson@peachreviews.com',
```

to:

```typescript
email: 'writer@peachreviews.com',
```

**Step 3: Update the first provider user email (user u8)**

Change the provider user (u8, Dr. Alan Moore):

```typescript
email: 'alan.moore@brightsmile.com',
```

to:

```typescript
email: 'provider@peachreviews.com',
```

**Step 4: Verify build**

Run: `cd peach-reviews && npm run build`
Expected: Build succeeds.

**Step 5: Commit**

```bash
cd peach-reviews
git add src/data/seed.ts
git commit -m "feat: update seed user emails for demo login accounts"
```

---

## Task 6: Add CSS animations for login page

**Files:**
- Modify: `peach-reviews/src/index.css`

**Step 1: Add keyframes and utility classes**

Append the following after the scrollbar styles at the end of `src/index.css`:

```css
@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes float {
  0%, 100% {
    transform: translate(0, 0) scale(1);
  }
  33% {
    transform: translate(10px, -10px) scale(1.02);
  }
  66% {
    transform: translate(-5px, 5px) scale(0.98);
  }
}

.animate-fade-in {
  animation: fade-in 0.6s ease-out both;
}

.animate-fade-in-delay {
  animation: fade-in 0.6s ease-out 0.15s both;
}

.animate-float {
  animation: float 8s ease-in-out infinite;
}
```

**Step 2: Verify build**

Run: `cd peach-reviews && npm run build`
Expected: Build succeeds.

**Step 3: Commit**

```bash
cd peach-reviews
git add src/index.css
git commit -m "feat: add fade-in and float animations for login page"
```

---

## Task 7: Rewrite LoginPage — Dark & Premium Split Layout

**Files:**
- Rewrite: `peach-reviews/src/pages/login/LoginPage.tsx`

**Step 1: Rewrite the entire LoginPage component**

Replace the entire contents of `src/pages/login/LoginPage.tsx` with:

```tsx
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

    login(account.role)
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
```

**Step 2: Update the store login action to match by email**

In `src/store/useStore.ts`, the current `login` action finds a user by role:

```typescript
login: (role) =>
  set(() => {
    const user = seedUsers.find((u) => u.role === role) ?? null
    return { currentUser: user }
  }),
```

Change the interface and implementation to accept email instead:

In the `AppState` interface, change:
```typescript
login: (role: Role) => void
```
to:
```typescript
login: (role: Role, email?: string) => void
```

Change the implementation to:
```typescript
login: (role, email) =>
  set(() => {
    const user = email
      ? seedUsers.find((u) => u.email === email) ?? seedUsers.find((u) => u.role === role) ?? null
      : seedUsers.find((u) => u.role === role) ?? null
    return { currentUser: user }
  }),
```

Then update the LoginPage to pass the email. In the `handleLogin` function, change:
```typescript
login(account.role)
```
to:
```typescript
login(account.role, email.toLowerCase().trim())
```

**Step 3: Verify build**

Run: `cd peach-reviews && npm run build`
Expected: Build succeeds.

**Step 4: Visual verification**

Run: `cd peach-reviews && npm run dev`

Check:
- Login page shows split layout (left branded panel, right login form)
- Glassmorphism feature cards visible on left
- Gradient orbs floating behind
- Typing `admin@peachreviews.com` / `password` → redirects to admin dashboard
- Typing `writer@peachreviews.com` / `password` → redirects to writer queue
- Typing `provider@peachreviews.com` / `password` → redirects to provider overview
- Wrong credentials → shows red "Invalid email or password" error
- On mobile widths, left panel hides, logo appears above form

**Step 5: Commit**

```bash
cd peach-reviews
git add src/pages/login/LoginPage.tsx src/store/useStore.ts
git commit -m "feat: redesign login page with premium split layout and hardcoded demo accounts"
```

---

## Task 8: Final integration verification

**Step 1: Full build check**

Run: `cd peach-reviews && npm run build`
Expected: Build succeeds with no errors.

**Step 2: Full flow test via dev server**

Run: `cd peach-reviews && npm run dev`

Verify this complete flow:
1. Load app → login page appears with split layout
2. Login as `admin@peachreviews.com` / `password`
3. Admin dashboard loads with mock data
4. Navigate to Clients, add a new client
5. Refresh the page → client persists (localStorage working)
6. Click user menu → "Reset demo data" option visible
7. Click "Reset demo data" → toast confirms, data resets
8. Sign out → back to login
9. Login as `writer@peachreviews.com` / `password`
10. Writer queue loads with tasks
11. Login as `provider@peachreviews.com` / `password`
12. Provider overview loads with KPIs

**Step 3: Final commit**

```bash
cd peach-reviews
git add -A
git commit -m "chore: final verification — MVP polish complete"
```

(Only if there are any remaining uncommitted changes.)
