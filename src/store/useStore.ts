import { create } from 'zustand'
import type {
  User,
  Client,
  Location,
  Task,
  Role,
  InternalStatus,
  ActivityEntry,
} from '@/data/types'
import { seedClients, seedLocations, seedUsers, seedTasks } from '@/data/seed'

/* ------------------------------------------------------------------ */
/*  Helper                                                            */
/* ------------------------------------------------------------------ */

const createActivity = (action: string, user: User | null): ActivityEntry => ({
  id: crypto.randomUUID(),
  timestamp: new Date().toISOString(),
  action,
  userId: user?.id,
  userName: user?.name,
})

/* ------------------------------------------------------------------ */
/*  Store interface                                                   */
/* ------------------------------------------------------------------ */

interface AppState {
  /* ---- state ---- */
  currentUser: User | null
  clients: Client[]
  locations: Location[]
  users: User[]
  tasks: Task[]
  globalActivity: ActivityEntry[]

  /* ---- auth ---- */
  login: (role: Role) => void
  logout: () => void

  /* ---- task actions ---- */
  startWriting: (taskId: string) => void
  saveDraft: (taskId: string, content: string) => void
  markWritten: (taskId: string) => void
  markDelivered: (taskId: string) => void
  reassignTask: (taskId: string, writerId: string) => void

  /* ---- CRUD: clients ---- */
  addClient: (client: Client) => void
  updateClient: (id: string, updates: Partial<Client>) => void
  deleteClient: (id: string) => void

  /* ---- CRUD: locations ---- */
  addLocation: (location: Location) => void
  updateLocation: (id: string, updates: Partial<Location>) => void
  deleteLocation: (id: string) => void

  /* ---- CRUD: users ---- */
  addUser: (user: User) => void
  updateUser: (id: string, updates: Partial<User>) => void
  deleteUser: (id: string) => void
}

/* ------------------------------------------------------------------ */
/*  Initial global activity (aggregated from seed tasks)              */
/* ------------------------------------------------------------------ */

const initialGlobalActivity: ActivityEntry[] = seedTasks
  .flatMap((t) => t.activity)
  .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

/* ------------------------------------------------------------------ */
/*  Store                                                             */
/* ------------------------------------------------------------------ */

export const useStore = create<AppState>()((set, _get) => ({
  /* ================================================================ */
  /*  State                                                           */
  /* ================================================================ */

  currentUser: null,
  clients: [...seedClients],
  locations: [...seedLocations],
  users: [...seedUsers],
  tasks: [...seedTasks],
  globalActivity: [...initialGlobalActivity],

  /* ================================================================ */
  /*  Auth                                                            */
  /* ================================================================ */

  login: (role) =>
    set(() => {
      const user = seedUsers.find((u) => u.role === role) ?? null
      return { currentUser: user }
    }),

  logout: () => set({ currentUser: null }),

  /* ================================================================ */
  /*  Task actions                                                    */
  /* ================================================================ */

  startWriting: (taskId) =>
    set((state) => {
      const entry = createActivity(`Started writing task ${taskId}`, state.currentUser)
      return {
        tasks: state.tasks.map((t) =>
          t.id === taskId
            ? {
                ...t,
                internalStatus: 'Writing' as InternalStatus,
                airtableStatus: 'In Progress' as const,
                activity: [...t.activity, entry],
              }
            : t,
        ),
        globalActivity: [entry, ...state.globalActivity],
      }
    }),

  saveDraft: (taskId, content) =>
    set((state) => {
      const entry = createActivity(`Saved draft for task ${taskId}`, state.currentUser)
      return {
        tasks: state.tasks.map((t) =>
          t.id === taskId
            ? {
                ...t,
                contentDraft: content,
                activity: [...t.activity, entry],
              }
            : t,
        ),
        globalActivity: [entry, ...state.globalActivity],
      }
    }),

  markWritten: (taskId) =>
    set((state) => {
      const entry = createActivity(`Marked task ${taskId} as written`, state.currentUser)
      return {
        tasks: state.tasks.map((t) =>
          t.id === taskId
            ? {
                ...t,
                internalStatus: 'Written' as InternalStatus,
                airtableStatus: 'Written' as const,
                writtenAt: new Date().toISOString(),
                activity: [...t.activity, entry],
              }
            : t,
        ),
        globalActivity: [entry, ...state.globalActivity],
      }
    }),

  markDelivered: (taskId) =>
    set((state) => {
      const entry = createActivity(`Marked task ${taskId} as delivered`, state.currentUser)
      return {
        tasks: state.tasks.map((t) =>
          t.id === taskId
            ? {
                ...t,
                internalStatus: 'Delivered' as InternalStatus,
                airtableStatus: 'Delivered' as const,
                deliveredAt: new Date().toISOString(),
                activity: [...t.activity, entry],
              }
            : t,
        ),
        globalActivity: [entry, ...state.globalActivity],
      }
    }),

  reassignTask: (taskId, writerId) =>
    set((state) => {
      const writer = state.users.find((u) => u.id === writerId)
      const entry = createActivity(
        `Reassigned task ${taskId} to ${writer?.name ?? writerId}`,
        state.currentUser,
      )
      return {
        tasks: state.tasks.map((t) =>
          t.id === taskId
            ? {
                ...t,
                writerId,
                activity: [...t.activity, entry],
              }
            : t,
        ),
        globalActivity: [entry, ...state.globalActivity],
      }
    }),

  /* ================================================================ */
  /*  CRUD: Clients                                                   */
  /* ================================================================ */

  addClient: (client) =>
    set((state) => {
      const entry = createActivity(`Added client "${client.name}"`, state.currentUser)
      return {
        clients: [...state.clients, client],
        globalActivity: [entry, ...state.globalActivity],
      }
    }),

  updateClient: (id, updates) =>
    set((state) => {
      const entry = createActivity(`Updated client ${id}`, state.currentUser)
      return {
        clients: state.clients.map((c) => (c.id === id ? { ...c, ...updates } : c)),
        globalActivity: [entry, ...state.globalActivity],
      }
    }),

  deleteClient: (id) =>
    set((state) => {
      const client = state.clients.find((c) => c.id === id)
      const entry = createActivity(
        `Deleted client "${client?.name ?? id}"`,
        state.currentUser,
      )
      return {
        clients: state.clients.filter((c) => c.id !== id),
        globalActivity: [entry, ...state.globalActivity],
      }
    }),

  /* ================================================================ */
  /*  CRUD: Locations                                                 */
  /* ================================================================ */

  addLocation: (location) =>
    set((state) => {
      const entry = createActivity(`Added location "${location.name}"`, state.currentUser)
      return {
        locations: [...state.locations, location],
        globalActivity: [entry, ...state.globalActivity],
      }
    }),

  updateLocation: (id, updates) =>
    set((state) => {
      const entry = createActivity(`Updated location ${id}`, state.currentUser)
      return {
        locations: state.locations.map((l) => (l.id === id ? { ...l, ...updates } : l)),
        globalActivity: [entry, ...state.globalActivity],
      }
    }),

  deleteLocation: (id) =>
    set((state) => {
      const location = state.locations.find((l) => l.id === id)
      const entry = createActivity(
        `Deleted location "${location?.name ?? id}"`,
        state.currentUser,
      )
      return {
        locations: state.locations.filter((l) => l.id !== id),
        globalActivity: [entry, ...state.globalActivity],
      }
    }),

  /* ================================================================ */
  /*  CRUD: Users                                                     */
  /* ================================================================ */

  addUser: (user) =>
    set((state) => {
      const entry = createActivity(`Added user "${user.name}"`, state.currentUser)
      return {
        users: [...state.users, user],
        globalActivity: [entry, ...state.globalActivity],
      }
    }),

  updateUser: (id, updates) =>
    set((state) => {
      const entry = createActivity(`Updated user ${id}`, state.currentUser)
      return {
        users: state.users.map((u) => (u.id === id ? { ...u, ...updates } : u)),
        globalActivity: [entry, ...state.globalActivity],
      }
    }),

  deleteUser: (id) =>
    set((state) => {
      const user = state.users.find((u) => u.id === id)
      const entry = createActivity(
        `Deleted user "${user?.name ?? id}"`,
        state.currentUser,
      )
      return {
        users: state.users.filter((u) => u.id !== id),
        globalActivity: [entry, ...state.globalActivity],
      }
    }),
}))
