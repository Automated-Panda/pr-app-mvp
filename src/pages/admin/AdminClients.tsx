import { useState, useEffect, useMemo } from 'react'
import { useStore } from '@/store/useStore'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
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
import { Search, Plus, Pencil, Trash2, Users, MapPin, User } from 'lucide-react'
import { formatCurrency, truncate, generateId } from '@/lib/utils'
import type { Client, ClientStatus } from '@/data/types'

/* ------------------------------------------------------------------ */
/*  Status badge variant mapping                                      */
/* ------------------------------------------------------------------ */

const statusVariant: Record<ClientStatus, 'success' | 'warning' | 'destructive'> = {
  Active: 'success',
  Paused: 'warning',
  Cancelled: 'destructive',
}

/* ------------------------------------------------------------------ */
/*  Empty form state                                                  */
/* ------------------------------------------------------------------ */

interface ClientForm {
  name: string
  status: ClientStatus
  packageName: string
  mrr: string
  notes: string
}

const emptyForm: ClientForm = {
  name: '',
  status: 'Active',
  packageName: '',
  mrr: '',
  notes: '',
}

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

export function AdminClients() {
  const clients = useStore((s) => s.clients)
  const locations = useStore((s) => s.locations)
  const users = useStore((s) => s.users)
  const addClient = useStore((s) => s.addClient)
  const updateClient = useStore((s) => s.updateClient)
  const deleteClient = useStore((s) => s.deleteClient)

  /* ---- loading ---- */
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 400)
    return () => clearTimeout(timer)
  }, [])

  /* ---- filters ---- */
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<ClientStatus | ''>('')

  /* ---- dialog state ---- */
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [form, setForm] = useState<ClientForm>(emptyForm)

  /* ---- filtered data ---- */
  const filtered = useMemo(() => {
    let result = clients

    if (statusFilter) {
      result = result.filter((c) => c.status === statusFilter)
    }

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.packageName.toLowerCase().includes(q) ||
          c.notes.toLowerCase().includes(q),
      )
    }

    return result
  }, [clients, statusFilter, search])

  /* ---- dialog helpers ---- */
  const openAdd = () => {
    setEditingClient(null)
    setForm(emptyForm)
    setDialogOpen(true)
  }

  const openEdit = (client: Client) => {
    setEditingClient(client)
    setForm({
      name: client.name,
      status: client.status,
      packageName: client.packageName,
      mrr: String(client.mrr),
      notes: client.notes,
    })
    setDialogOpen(true)
  }

  const handleSave = () => {
    if (!form.name.trim()) {
      toast.error('Client name is required')
      return
    }

    if (editingClient) {
      updateClient(editingClient.id, {
        name: form.name.trim(),
        status: form.status,
        packageName: form.packageName.trim(),
        mrr: Number(form.mrr) || 0,
        notes: form.notes.trim(),
      })
      toast.success(`Client "${form.name}" updated`)
    } else {
      addClient({
        id: generateId(),
        name: form.name.trim(),
        status: form.status,
        packageName: form.packageName.trim(),
        mrr: Number(form.mrr) || 0,
        notes: form.notes.trim(),
        createdAt: new Date().toISOString(),
      })
      toast.success(`Client "${form.name}" created`)
    }

    setDialogOpen(false)
  }

  const handleDelete = (e: React.MouseEvent, client: Client) => {
    e.stopPropagation()
    if (window.confirm(`Delete client "${client.name}"? This cannot be undone.`)) {
      deleteClient(client.id)
      toast.success(`Client "${client.name}" deleted`)
    }
  }

  /* ---- detail info for editing client ---- */
  const clientLocations = useMemo(() => {
    if (!editingClient) return []
    return locations.filter((l) => l.clientId === editingClient.id)
  }, [editingClient, locations])

  const clientProviders = useMemo(() => {
    if (!editingClient) return []
    return users.filter(
      (u) => u.role === 'provider' && u.clientIds?.includes(editingClient.id),
    )
  }, [editingClient, users])

  /* ---- columns ---- */
  const columns = useMemo(
    () => [
      {
        key: 'name',
        header: 'Name',
        render: (client: Client) => (
          <span className="font-medium text-dark-100">{client.name}</span>
        ),
      },
      {
        key: 'status',
        header: 'Status',
        render: (client: Client) => (
          <Badge variant={statusVariant[client.status]}>{client.status}</Badge>
        ),
      },
      {
        key: 'packageName',
        header: 'Package',
        render: (client: Client) => (
          <span className="text-dark-300">{client.packageName || '-'}</span>
        ),
      },
      {
        key: 'mrr',
        header: 'MRR',
        render: (client: Client) => (
          <span className="text-dark-200 font-medium">{formatCurrency(client.mrr)}</span>
        ),
      },
      {
        key: 'notes',
        header: 'Notes',
        render: (client: Client) => (
          <span className="text-dark-400 text-xs">{truncate(client.notes, 40)}</span>
        ),
      },
      {
        key: 'actions',
        header: 'Actions',
        className: 'text-right',
        render: (client: Client) => (
          <div className="flex items-center justify-end gap-1.5">
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation()
                openEdit(client)
              }}
            >
              <Pencil size={14} />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => handleDelete(e, client)}
            >
              <Trash2 size={14} className="text-red-400" />
            </Button>
          </div>
        ),
      },
    ],
    [],
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
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clients"
        description="Manage client accounts"
        action={
          <Button onClick={openAdd}>
            <Plus size={16} />
            Add Client
          </Button>
        }
      />

      {/* ---- Filters ---- */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-500" />
          <Input
            placeholder="Search clients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          options={[
            { value: '', label: 'All Statuses' },
            { value: 'Active', label: 'Active' },
            { value: 'Paused', label: 'Paused' },
            { value: 'Cancelled', label: 'Cancelled' },
          ]}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as ClientStatus | '')}
          className="w-40"
        />
      </div>

      {/* ---- Table ---- */}
      <div className="bg-dark-850 border border-dark-700/50 rounded-xl overflow-hidden">
        <DataTable<Client>
          columns={columns}
          data={filtered}
          onRowClick={(client) => openEdit(client)}
          keyExtractor={(client) => client.id}
          emptyState={
            <EmptyState
              icon={<Users size={24} />}
              title="No clients found"
              description={
                search || statusFilter
                  ? 'Try adjusting your filters.'
                  : 'No clients yet. Add your first client to get started.'
              }
              action={
                !search && !statusFilter ? (
                  <Button onClick={openAdd} size="sm">
                    <Plus size={14} />
                    Add Client
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
            <DialogTitle>{editingClient ? 'Edit Client' : 'Add Client'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-dark-400 mb-1.5 block">Name</label>
              <Input
                placeholder="Client name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-dark-400 mb-1.5 block">Status</label>
              <Select
                options={[
                  { value: 'Active', label: 'Active' },
                  { value: 'Paused', label: 'Paused' },
                  { value: 'Cancelled', label: 'Cancelled' },
                ]}
                value={form.status}
                onChange={(e) =>
                  setForm((f) => ({ ...f, status: e.target.value as ClientStatus }))
                }
              />
            </div>
            <div>
              <label className="text-xs font-medium text-dark-400 mb-1.5 block">
                Package Name
              </label>
              <Input
                placeholder="e.g. Pro Plan"
                value={form.packageName}
                onChange={(e) => setForm((f) => ({ ...f, packageName: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-dark-400 mb-1.5 block">
                MRR ($)
              </label>
              <Input
                type="number"
                placeholder="0"
                value={form.mrr}
                onChange={(e) => setForm((f) => ({ ...f, mrr: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-dark-400 mb-1.5 block">Notes</label>
              <Textarea
                placeholder="Additional notes..."
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              />
            </div>

            {/* ---- Associated info when editing ---- */}
            {editingClient && (
              <div className="pt-2 border-t border-dark-700/50 space-y-3">
                <div>
                  <p className="text-xs font-medium text-dark-400 mb-1.5 flex items-center gap-1.5">
                    <MapPin size={12} /> Locations ({clientLocations.length})
                  </p>
                  {clientLocations.length === 0 ? (
                    <p className="text-xs text-dark-500">No locations associated</p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {clientLocations.map((loc) => (
                        <Badge key={loc.id} variant="secondary">
                          {loc.name}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-xs font-medium text-dark-400 mb-1.5 flex items-center gap-1.5">
                    <User size={12} /> Providers ({clientProviders.length})
                  </p>
                  {clientProviders.length === 0 ? (
                    <p className="text-xs text-dark-500">No providers associated</p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {clientProviders.map((u) => (
                        <Badge key={u.id} variant="secondary">
                          {u.name}
                        </Badge>
                      ))}
                    </div>
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
              {editingClient ? 'Save Changes' : 'Add Client'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
