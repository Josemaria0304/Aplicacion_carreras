import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { appNotifications } from '@/data/seed'
import type { AppNotification, AppSettings, Role, Toast } from '@/types'

export interface SessionUser {
  id: string
  name: string
  email: string
  initials: string
  role: Role
  driverId?: string | null
}

const guestUser: SessionUser = {
  id: '',
  name: 'Invitado',
  email: '',
  initials: 'IN',
  role: 'public',
}

const defaultSettings: AppSettings = {
  compact: false,
  showSectors: true,
  autoScroll: true,
  simulationSpeed: 1,
  pushResults: true,
  pushFlags: true,
  pushEntries: true,
}

interface SessionStore {
  role: Role
  isAuthenticated: boolean
  authReady: boolean
  user: SessionUser
  notifications: AppNotification[]
  toasts: Toast[]
  sidebarOpen: boolean
  settings: AppSettings
  restoreSession: () => Promise<void>
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  markAllRead: () => void
  toggleSidebar: () => void
  closeSidebar: () => void
  pushToast: (toast: Omit<Toast, 'id'>) => void
  dismissToast: (id: string) => void
  updateSettings: (patch: Partial<AppSettings>) => void
}

export const useSession = create<SessionStore>()(
  persist(
    (set, get) => ({
      role: 'public',
      isAuthenticated: false,
      authReady: false,
      user: guestUser,
      notifications: appNotifications,
      toasts: [],
      sidebarOpen: false,
      settings: defaultSettings,
      restoreSession: async () => {
        try {
          const response = await fetch('/api/auth/session')
          if (!response.ok) throw new Error('No hay una sesión activa.')
          const { user } = (await response.json()) as { user: SessionUser }
          set({ role: user.role, user, isAuthenticated: true })
        } catch {
          set({ role: 'public', user: guestUser, isAuthenticated: false })
        } finally {
          set({ authReady: true })
        }
      },
      login: async (email, password) => {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        })
        const body = await response.json().catch(() => ({}))
        if (!response.ok) {
          throw new Error(typeof body.error === 'string' ? body.error : 'No se pudo iniciar sesión.')
        }
        const user = body.user as SessionUser
        set({ role: user.role, user, isAuthenticated: true, authReady: true, sidebarOpen: false })
      },
      register: async (name, email, password) => {
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password }),
        })
        const body = await response.json().catch(() => ({}))
        if (!response.ok) {
          throw new Error(typeof body.error === 'string' ? body.error : 'No se pudo crear la cuenta.')
        }
        const user = body.user as SessionUser
        set({ role: user.role, user, isAuthenticated: true, authReady: true, sidebarOpen: false })
      },
      logout: async () => {
        try {
          await fetch('/api/auth/logout', { method: 'POST' })
        } finally {
          set({ role: 'public', user: guestUser, isAuthenticated: false, sidebarOpen: false })
        }
      },
      markAllRead: () =>
        set((state) => ({
          notifications: state.notifications.map((notification) => ({
            ...notification,
            read: true,
          })),
        })),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      closeSidebar: () => set({ sidebarOpen: false }),
      pushToast: (toast) => {
        const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
        set((state) => ({ toasts: [...state.toasts, { ...toast, id }] }))
        window.setTimeout(() => get().dismissToast(id), 4600)
      },
      dismissToast: (id) =>
        set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) })),
      updateSettings: (patch) =>
        set((state) => ({ settings: { ...state.settings, ...patch } })),
    }),
    {
      name: 'apex-session',
      partialize: (state) => ({
        notifications: state.notifications,
        settings: state.settings,
      }),
    },
  ),
)
