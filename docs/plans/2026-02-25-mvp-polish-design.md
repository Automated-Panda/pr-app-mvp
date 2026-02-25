# Peach Reviews MVP Polish — Design Document

**Date:** 2026-02-25
**Goal:** Polish the MVP into a convincing live demo for client presentation

## Context

This is a frontend-only React 19 + TypeScript + Vite app for managing review content across three roles (Admin, Writer, Provider). Currently uses in-memory mock data with no persistence, a basic login page, and no error handling. The goal is to make it demo-ready for a live walkthrough to convince a client to commission the full build.

---

## 1. Login Page Redesign — Dark & Premium Split Layout

### Current State
- Basic centered card with role picker buttons, email/password inputs
- "Demo mode — no real authentication required" text visible
- No visual impact or brand presence

### Design

**Layout:** Split screen
- **Left panel (~45%):** Branded showcase area with dark gradient background and peach accent colors. Features a glassmorphism card listing product highlights (multi-platform management, real-time analytics, workflow automation). Blurred peach gradient orb for visual depth.
- **Right panel (~55%):** Clean login form on dark-900 background.

**Login form:**
- Logo + "Sign in to your account" heading
- Email input field
- Password input field
- "Sign In" button with peach gradient
- No role picker, no "demo mode" text

**Hardcoded test accounts:**
| Email | Password | Role |
|-------|----------|------|
| admin@peachreviews.com | password | Admin |
| writer@peachreviews.com | password | Writer |
| provider@peachreviews.com | password | Provider |

**Authentication logic:**
- Match email + password against hardcoded credentials
- On match: set `currentUser` to the corresponding seed user, redirect to role-appropriate dashboard
- On mismatch: show inline error "Invalid email or password"
- Credentials stored in a constant map in the login module (not in .env — these are demo-only)

**Visual details:**
- Glassmorphism: `backdrop-blur-xl`, semi-transparent backgrounds (`bg-white/5`), subtle border (`border-white/10`)
- Peach gradient orb: absolute-positioned, blurred, `bg-peach-500/20`
- Smooth fade-in animation on mount
- Input focus states with peach ring

---

## 2. Data Persistence — Zustand + localStorage

### Current State
- All data loaded from seed.ts into Zustand on every page load
- Any changes (add client, write review, etc.) lost on refresh

### Design

**Implementation:** Wrap Zustand store with `persist` middleware

```
create<AppState>()(persist(
  (set, get) => ({ ... existing store ... }),
  { name: 'peach-reviews-storage' }
))
```

**Behavior:**
- First visit: seed data loads as normal, gets persisted to localStorage
- Subsequent visits: data loaded from localStorage (survives refresh)
- Store rehydrates automatically on app start

**Reset mechanism:**
- Add "Reset Demo Data" option in the Topbar user dropdown menu
- Clears localStorage and reloads seed data
- Useful to reset before a demo walkthrough

---

## 3. Error Boundary

### Current State
- No error handling — any component crash shows white screen

### Design

- Create `ErrorBoundary` React class component (error boundaries require class components)
- Wrap around `<App />` in main.tsx
- Fallback UI: centered card matching dark theme with:
  - "Something went wrong" heading
  - Brief error description (non-technical)
  - "Reload Application" button that calls `window.location.reload()`
- Styled with existing dark theme colors

---

## 4. Gitignore Hardening

### Current State
Missing common sensitive file patterns.

### Additions
```
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
.DS_Store

# IDE
.idea/
*.swp
*.swo
```

Note: `dist/` is already in .gitignore. Will verify it's not tracked in git.

---

## Summary of Changes

| Area | Files Modified/Created |
|------|----------------------|
| Login page | `src/pages/login/LoginPage.tsx` (rewrite) |
| Store persistence | `src/store/useStore.ts` (add persist middleware) |
| Reset demo data | `src/layouts/Topbar.tsx` (add menu item) |
| Error boundary | `src/components/ErrorBoundary.tsx` (new) |
| Entry point | `src/main.tsx` (wrap with ErrorBoundary) |
| Gitignore | `.gitignore` (add sensitive patterns) |
| Index CSS | `src/index.css` (add glassmorphism + animation utilities if needed) |
