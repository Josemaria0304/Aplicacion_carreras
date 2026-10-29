import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { appNotifications } from '@/data/seed'
import type { AppNotification, AppSettings, Role, Toast } from '@/types'

export interface DemoUser {
  name: string
  email: string
  initials: string
  driverId?: string
}

export const DEMO_USERS: Record<Role, DemoUser> = {
  organizer: {
    name: 'Julia Lima',
    email: 'julia.lima@apexrace.io',
    initials: 'JL',
  },
  director: {
    name: 'Ricardo Sosa',
    email: 'ricardo.sosa@apexrace.io',
    initials: 'RS',
  },
  steward: {
    name: 'Marta Vega',
    email: 'marta.vega@apexrace.io',
    initials: 'MV',
  },
  timekeeper: {
    name: 'Diego Ferrer',
    email: 'diego.ferrer@apexrace.io',
    initials: 'DF',
  },
  pilot: {
    name: 'Alex Rossi',
    email: 'alex.rossi@aurora.team',
    initials: 'AR',
    driverId: 'd-rossi',
  },
  press: {
    name: 'Camila Duarte',
    email: 'camila.duarte@press.apexrace.io',
    initials: 'CD',
  },
  public: {
    name: 'Invitado',
    email: 'invitado@apexrace.io',
    initials: 'IN',
  },
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
  user: DemoUser
  notifications: AppNotification[]
  toasts: Toast[]
  sidebarOpen: boolean
  settings: AppSettings
  login: (role: Role) => void
  logout: () => void
  setRole: (role: Role) => void
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
      role: 'organizer',
      isAuthenticated: true,
      user: DEMO_USERS.organizer,
      notifications: appNotifications,
      toasts: [],
      sidebarOpen: false,
      settings: defaultSettings,
      login: (role) =>
        set({
          role,
          user: DEMO_USERS[role],
          isAuthenticated: true,
          sidebarOpen: false,
        }),
      logout: () => set({ isAuthenticated: false, sidebarOpen: false }),
      setRole: (role) => set({ role, user: DEMO_USERS[role] }),
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
        role: state.role,
        isAuthenticated: state.isAuthenticated,
        user: state.user,
        notifications: state.notifications,
        settings: state.settings,
      }),
    },
  ),
)
