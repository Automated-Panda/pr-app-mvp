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
import { Search, Plus, Pencil, Trash2, MapPin } from 'lucide-react'
import { generateId } from '@/lib/utils'
import type { Location, Platform } from '@/data/types'

/* ------------------------------------------------------------------ */
/*  Form state                                                        */
/* ------------------------------------------------------------------ */

interface LocationForm {
  clientId: string
  name: string
  city: string
  active: boolean
  platforms: string
  slaHours: string
  airtableLocationId: string
}

const emptyForm: LocationForm = {
  clientId: '',
  name: '',
  city: '',
  active: true,
  platforms: '',
  slaHours: '48',
  airtableLocationId: '',
}

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

export function AdminLocations() {
  const clients = useStore((s) => s.clients)
  const locations = useStore((s) => s.locations)
  const tasks = useStore((s) => s.tasks)
  const addLocation = useStore((s) => s.addLocation)
  const updateLocation = useStore((s) => s.updateLocation)
  const deleteLocation = useStore((s) => s.deleteLocation)

  /* ---- loading ---- */
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 400)
    return () => clearTimeout(timer)
  }, [])

  /* ---- filters ---- */
  const [search, setSearch] = useState('')
  const [clientFilter, setClientFilter] = useState('')
  const [activeFilter, setActiveFilter] = useState('')

  /* ---- dialog state ---- */
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingLocation, setEditingLocation] = useState<Location | null>(null)
  const [form, setForm] = useState<LocationForm>(emptyForm)

  /* ---- lookup maps ---- */
  const clientMap = useMemo(
    () => new Map(clients.map((c) => [c.id, c.name])),
    [clients],
  )

  const pendingByLocation = useMemo(() => {
    const map = new Map<string, number>()
    for (const t of tasks) {
      if (
        t.internalStatus === 'New' ||
        t.internalStatus === 'Writing' ||
        t.internalStatus === 'Written'
      ) {
        map.set(t.locationId, (map.get(t.locationId) || 0) + 1)
      }
    }
    return map
  }, [tasks])

  /* ---- filtered data ---- */
  const filtered = useMemo(() => {
    let result = locations

    if (clientFilter) {
      result = result.filter((l) => l.clientId === clientFilter)
    }

    if (activeFilter === 'active') {
      result = result.filter((l) => l.active)
    } else if (activeFilter === 'inactive') {
      result = result.filter((l) => !l.active)
    }

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (l) =>
          l.name.toLowerCase().includes(q) ||
          l.city.toLowerCase().includes(q) ||
          (clientMap.get(l.clientId) ?? '').toLowerCase().includes(q) ||
          l.airtableLocationId.toLowerCase().includes(q),
      )
    }

    return result
  }, [locations, clientFilter, activeFilter, search, clientMap])

  /* ---- dialog helpers ---- */
  const openAdd = () => {
    setEditingLocation(null)
    setForm(emptyForm)
    setDialogOpen(true)
  }

  const openEdit = (location: Location) => {
    setEditingLocation(location)
    setForm({
      clientId: location.clientId,
      name: location.name,
      city: location.city,
      active: location.active,
      platforms: location.platforms.join(', '),
      slaHours: String(location.slaHours),
      airtableLocationId: location.airtableLocationId,
    })
    setDialogOpen(true)
  }

  const parsePlatforms = (str: string): Platform[] => {
    const valid: Platform[] = ['Google', 'Trustpilot', 'Facebook', 'Yelp', 'TripAdvisor']
    return str
      .split(',')
      .map((s) => s.trim())
      .filter((s): s is Platform => valid.includes(s as Platform))
  }

  const handleSave = () => {
    if (!form.name.trim()) {
      toast.error('Location name is required')
      return
    }
    if (!form.clientId) {
      toast.error('Please select a client')
      return
    }

    const platforms = parsePlatforms(form.platforms)

    if (editingLocation) {
      updateLocation(editingLocation.id, {
        clientId: form.clientId,
        name: form.name.trim(),
        city: form.city.trim(),
        active: form.active,
        platforms,
        slaHours: Number(form.slaHours) || 48,
        airtableLocationId: form.airtableLocationId.trim(),
      })
      toast.success(`Location "${form.name}" updated`)
    } else {
      addLocation({
        id: generateId(),
        clientId: form.clientId,
        name: form.name.trim(),
        city: form.city.trim(),
        active: form.active,
        platforms,
        slaHours: Number(form.slaHours) || 48,
        airtableLocationId: form.airtableLocationId.trim(),
      })
      toast.success(`Location "${form.name}" created`)
    }

    setDialogOpen(false)
  }

  const handleDelete = (e: React.MouseEvent, location: Location) => {
    e.stopPropagation()
    if (window.confirm(`Delete location "${location.name}"? This cannot be undone.`)) {
      deleteLocation(location.id)
      toast.success(`Location "${location.name}" deleted`)
    }
  }

  /* ---- client options for select ---- */
  const clientOptions = useMemo(
    () => clients.map((c) => ({ value: c.id, label: c.name })),
    [clients],
  )

  /* ---- columns ---- */
  const columns = useMemo(
    () => [
      {
        key: 'client',
        header: 'Client',
        render: (loc: Location) => (
          <span className="text-dark-100 font-medium">
            {clientMap.get(loc.clientId) ?? 'Unknown'}
          </span>
        ),
      },
      {
        key: 'name',
        header: 'Location Name',
        render: (loc: Location) => <span className="text-dark-200">{loc.name}</span>,
      },
      {
        key: 'city',
        header: 'City',
        render: (loc: Location) => <span className="text-dark-300">{loc.city}</span>,
      },
      {
        key: 'active',
        header: 'Active',
        render: (loc: Location) => (
          <div className="flex items-center gap-1.5">
            <span
              className={`h-2 w-2 rounded-full ${loc.active ? 'bg-emerald-500' : 'bg-red-500'}`}
            />
            <span className={`text-xs ${loc.active ? 'text-emerald-400' : 'text-red-400'}`}>
              {loc.active ? 'Active' : 'Inactive'}
            </span>
          </div>
        ),
      },
      {
        key: 'platforms',
        header: 'Platforms',
        render: (loc: Location) => (
          <div className="flex flex-wrap gap-1">
            {loc.platforms.map((p) => (
              <Badge key={p} variant="secondary">
                {p}
              </Badge>
            ))}
          </div>
        ),
      },
      {
        key: 'slaHours',
        header: 'SLA Hours',
        render: (loc: Location) => (
          <span className="text-dark-300">{loc.slaHours}h</span>
        ),
      },
      {
        key: 'pending',
        header: 'Pending Tasks',
        render: (loc: Location) => {
          const count = pendingByLocation.get(loc.id) || 0
          return count > 0 ? (
            <Badge variant={count >= 3 ? 'destructive' : 'warning'}>{count}</Badge>
          ) : (
            <span className="text-dark-500 text-xs">0</span>
          )
        },
      },
      {
        key: 'airtableLocationId',
        header: 'Airtable ID',
        render: (loc: Location) => (
          <span className="text-dark-500 text-xs font-mono">
            {loc.airtableLocationId || '-'}
          </span>
        ),
      },
      {
        key: 'actions',
        header: 'Actions',
        className: 'text-right',
        render: (loc: Location) => (
          <div className="flex items-center justify-end gap-1.5">
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation()
                openEdit(loc)
              }}
            >
              <Pencil size={14} />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => handleDelete(e, loc)}
            >
              <Trash2 size={14} className="text-red-400" />
            </Button>
          </div>
        ),
      },
    ],
    [clientMap, pendingByLocation],
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
        title="Locations"
        description="Manage client locations"
        action={
          <Button onClick={openAdd}>
            <Plus size={16} />
            Add Location
          </Button>
        }
      />

      {/* ---- Filters ---- */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-500" />
          <Input
            placeholder="Search locations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          options={[{ value: '', label: 'All Clients' }, ...clientOptions]}
          value={clientFilter}
          onChange={(e) => setClientFilter(e.target.value)}
          className="w-44"
        />
        <Select
          options={[
            { value: '', label: 'All Status' },
            { value: 'active', label: 'Active' },
            { value: 'inactive', label: 'Inactive' },
          ]}
          value={activeFilter}
          onChange={(e) => setActiveFilter(e.target.value)}
          className="w-36"
        />
      </div>

      {/* ---- Table ---- */}
      <div className="bg-dark-850 border border-dark-700/50 rounded-xl overflow-hidden">
        <DataTable<Location>
          columns={columns}
          data={filtered}
          onRowClick={(loc) => openEdit(loc)}
          keyExtractor={(loc) => loc.id}
          emptyState={
            <EmptyState
              icon={<MapPin size={24} />}
              title="No locations found"
              description={
                search || clientFilter || activeFilter
                  ? 'Try adjusting your filters.'
                  : 'No locations yet. Add your first location to get started.'
              }
              action={
                !search && !clientFilter && !activeFilter ? (
                  <Button onClick={openAdd} size="sm">
                    <Plus size={14} />
                    Add Location
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
            <DialogTitle>
              {editingLocation ? 'Edit Location' : 'Add Location'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-dark-400 mb-1.5 block">Client</label>
              <Select
                options={clientOptions}
                placeholder="Select a client"
                value={form.clientId}
                onChange={(e) => setForm((f) => ({ ...f, clientId: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-dark-400 mb-1.5 block">
                Location Name
              </label>
              <Input
                placeholder="e.g. Downtown Office"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-dark-400 mb-1.5 block">City</label>
              <Input
                placeholder="e.g. New York"
                value={form.city}
                onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="loc-active"
                checked={form.active}
                onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
                className="rounded border-dark-600 bg-dark-800 text-peach-500 focus:ring-peach-500/40"
              />
              <label htmlFor="loc-active" className="text-sm text-dark-200">
                Active
              </label>
            </div>
            <div>
              <label className="text-xs font-medium text-dark-400 mb-1.5 block">
                Platforms (comma-separated)
              </label>
              <Input
                placeholder="Google, Trustpilot, Facebook"
                value={form.platforms}
                onChange={(e) => setForm((f) => ({ ...f, platforms: e.target.value }))}
              />
              <p className="text-[11px] text-dark-500 mt-1">
                Valid: Google, Trustpilot, Facebook, Yelp, TripAdvisor
              </p>
            </div>
            <div>
              <label className="text-xs font-medium text-dark-400 mb-1.5 block">
                SLA Hours
              </label>
              <Input
                type="number"
                placeholder="48"
                value={form.slaHours}
                onChange={(e) => setForm((f) => ({ ...f, slaHours: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-dark-400 mb-1.5 block">
                Airtable Location ID
              </label>
              <Input
                placeholder="rec..."
                value={form.airtableLocationId}
                onChange={(e) =>
                  setForm((f) => ({ ...f, airtableLocationId: e.target.value }))
                }
              />
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="secondary">Cancel</Button>
            </DialogClose>
            <Button onClick={handleSave}>
              {editingLocation ? 'Save Changes' : 'Add Location'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
