import { useState, useEffect, useMemo } from 'react'
import { useStore } from '@/store/useStore'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { DataTable } from '@/components/ui/data-table'
import { EmptyState } from '@/components/ui/empty-state'
import { PageHeader } from '@/components/ui/page-header'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
import { Search, Plus, Pencil, Trash2, Users } from 'lucide-react'
import { generateId } from '@/lib/utils'
import type { User, Role } from '@/data/types'

/* ------------------------------------------------------------------ */
/*  Role badge variant mapping                                        */
/* ------------------------------------------------------------------ */

const roleVariant: Record<Role, 'default' | 'success' | 'secondary'> = {
  admin: 'default',
  writer: 'secondary',
  provider: 'success',
}

const roleLabel: Record<Role, string> = {
  admin: 'Admin',
  writer: 'Writer',
  provider: 'Provider',
}

/* ------------------------------------------------------------------ */
/*  Form state                                                        */
/* ------------------------------------------------------------------ */

interface UserForm {
  name: string
  email: string
  role: Role
  clientIds: string[]
}

const emptyForm: UserForm = {
  name: '',
  email: '',
  role: 'writer',
  clientIds: [],
}

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

export function AdminUsers() {
  const users = useStore((s) => s.users)
  const tasks = useStore((s) => s.tasks)
  const clients = useStore((s) => s.clients)
  const addUser = useStore((s) => s.addUser)
  const updateUser = useStore((s) => s.updateUser)
  const deleteUser = useStore((s) => s.deleteUser)

  /* ---- loading ---- */
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 400)
    return () => clearTimeout(timer)
  }, [])

  /* ---- filters ---- */
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<Role | ''>('')

  /* ---- dialog state ---- */
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [form, setForm] = useState<UserForm>(emptyForm)

  /* ---- computed stats ---- */
  const writerTaskCounts = useMemo(() => {
    const map = new Map<string, number>()
    for (const t of tasks) {
      if (t.writerId) {
        map.set(t.writerId, (map.get(t.writerId) || 0) + 1)
      }
    }
    return map
  }, [tasks])

  const providerClientCounts = useMemo(() => {
    const map = new Map<string, number>()
    for (const u of users) {
      if (u.role === 'provider' && u.clientIds) {
        map.set(u.id, u.clientIds.length)
      }
    }
    return map
  }, [users])

  /* ---- filtered data ---- */
  const filtered = useMemo(() => {
    let result = users

    if (roleFilter) {
      result = result.filter((u) => u.role === roleFilter)
    }

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q),
      )
    }

    return result
  }, [users, roleFilter, search])

  /* ---- dialog helpers ---- */
  const openAdd = () => {
    setEditingUser(null)
    setForm(emptyForm)
    setDialogOpen(true)
  }

  const openEdit = (user: User) => {
    setEditingUser(user)
    setForm({
      name: user.name,
      email: user.email,
      role: user.role,
      clientIds: user.clientIds ?? [],
    })
    setDialogOpen(true)
  }

  const handleSave = () => {
    if (!form.name.trim()) {
      toast.error('User name is required')
      return
    }
    if (!form.email.trim()) {
      toast.error('Email is required')
      return
    }

    if (editingUser) {
      updateUser(editingUser.id, {
        name: form.name.trim(),
        email: form.email.trim(),
        role: form.role,
        clientIds: form.role === 'provider' ? form.clientIds : undefined,
      })
      toast.success(`User "${form.name}" updated`)
    } else {
      addUser({
        id: generateId(),
        name: form.name.trim(),
        email: form.email.trim(),
        role: form.role,
        clientIds: form.role === 'provider' ? form.clientIds : undefined,
      })
      toast.success(`User "${form.name}" created`)
    }

    setDialogOpen(false)
  }

  const handleDelete = (e: React.MouseEvent, user: User) => {
    e.stopPropagation()
    if (window.confirm(`Delete user "${user.name}"? This cannot be undone.`)) {
      deleteUser(user.id)
      toast.success(`User "${user.name}" deleted`)
    }
  }

  /* ---- client options for provider association ---- */
  const clientOptions = useMemo(
    () => clients.map((c) => ({ value: c.id, label: c.name })),
    [clients],
  )

  const toggleClientId = (clientId: string) => {
    setForm((f) => ({
      ...f,
      clientIds: f.clientIds.includes(clientId)
        ? f.clientIds.filter((id) => id !== clientId)
        : [...f.clientIds, clientId],
    }))
  }

  /* ---- columns ---- */
  const columns = useMemo(
    () => [
      {
        key: 'name',
        header: 'Name',
        render: (user: User) => (
          <span className="font-medium text-dark-100">{user.name}</span>
        ),
      },
      {
        key: 'email',
        header: 'Email',
        render: (user: User) => <span className="text-dark-300">{user.email}</span>,
      },
      {
        key: 'role',
        header: 'Role',
        render: (user: User) => (
          <Badge variant={roleVariant[user.role]}>{roleLabel[user.role]}</Badge>
        ),
      },
      {
        key: 'stats',
        header: 'Stats',
        render: (user: User) => {
          if (user.role === 'writer') {
            const count = writerTaskCounts.get(user.id) || 0
            return <span className="text-xs text-dark-400">{count} tasks assigned</span>
          }
          if (user.role === 'provider') {
            const count = providerClientCounts.get(user.id) || 0
            return <span className="text-xs text-dark-400">{count} clients</span>
          }
          return <span className="text-xs text-dark-500">-</span>
        },
      },
      {
        key: 'actions',
        header: 'Actions',
        className: 'text-right',
        render: (user: User) => (
          <div className="flex items-center justify-end gap-1.5">
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation()
                openEdit(user)
              }}
            >
              <Pencil size={14} />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => handleDelete(e, user)}
            >
              <Trash2 size={14} className="text-red-400" />
            </Button>
          </div>
        ),
      },
    ],
    [writerTaskCounts, providerClientCounts],
  )

  /* ---- skeleton ---- */
  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
        <div className="flex gap-3">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-9 w-36" />
          <Skeleton className="h-9 w-28 ml-auto" />
        </div>
        <div className="space-y-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users"
        description="Manage users and their roles"
        action={
          <Button onClick={openAdd}>
            <Plus size={16} />
            Add User
          </Button>
        }
      />

      {/* ---- Filters ---- */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-500" />
          <Input
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          options={[
            { value: '', label: 'All Roles' },
            { value: 'admin', label: 'Admin' },
            { value: 'writer', label: 'Writer' },
            { value: 'provider', label: 'Provider' },
          ]}
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as Role | '')}
          className="w-36"
        />
      </div>

      {/* ---- Table ---- */}
      <div className="bg-dark-850 border border-dark-700/50 rounded-xl overflow-hidden">
        <DataTable<User>
          columns={columns}
          data={filtered}
          onRowClick={(user) => openEdit(user)}
          keyExtractor={(user) => user.id}
          emptyState={
            <EmptyState
              icon={<Users size={24} />}
              title="No users found"
              description={
                search || roleFilter
                  ? 'Try adjusting your filters.'
                  : 'No users yet. Add your first user to get started.'
              }
              action={
                !search && !roleFilter ? (
                  <Button onClick={openAdd} size="sm">
                    <Plus size={14} />
                    Add User
                  </Button>
                ) : undefined
              }
            />
          }
        />
      </div>

      {/* ---- Add / Edit Dialog ---- */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingUser ? 'Edit User' : 'Add User'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-dark-400 mb-1.5 block">Name</label>
              <Input
                placeholder="Full name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-dark-400 mb-1.5 block">Email</label>
              <Input
                type="email"
                placeholder="user@example.com"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-dark-400 mb-1.5 block">Role</label>
              <Select
                options={[
                  { value: 'admin', label: 'Admin' },
                  { value: 'writer', label: 'Writer' },
                  { value: 'provider', label: 'Provider' },
                ]}
                value={form.role}
                onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as Role }))}
              />
            </div>

            {/* ---- Provider client associations ---- */}
            {form.role === 'provider' && (
              <div>
                <label className="text-xs font-medium text-dark-400 mb-1.5 block">
                  Associated Clients
                </label>
                <div className="space-y-1.5 max-h-40 overflow-y-auto rounded-lg border border-dark-700 bg-dark-800 p-2">
                  {clientOptions.length === 0 ? (
                    <p className="text-xs text-dark-500 py-1">No clients available</p>
                  ) : (
                    clientOptions.map((opt) => (
                      <label
                        key={opt.value}
                        className="flex items-center gap-2 text-sm text-dark-200 py-1 px-1 rounded hover:bg-dark-700 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={form.clientIds.includes(opt.value)}
                          onChange={() => toggleClientId(opt.value)}
                          className="rounded border-dark-600 bg-dark-800 text-peach-500 focus:ring-peach-500/40"
                        />
                        {opt.label}
                      </label>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="secondary">Cancel</Button>
            </DialogClose>
            <Button onClick={handleSave}>
              {editingUser ? 'Save Changes' : 'Add User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
