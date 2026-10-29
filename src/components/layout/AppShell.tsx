import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  Bell,
  CalendarDays,
  Car,
  ChevronRight,
  Gauge,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  ShieldCheck,
  Timer,
  Trophy,
  Users,
  X,
  type LucideIcon,
} from 'lucide-react'
import { useRace } from '@/store/useRace'
import { useSession } from '@/store/useSession'
import { can, roleMeta, roleOrder } from '@/lib/permissions'
import { cn, formatClock } from '@/lib/utils'
import { currentEvent, currentSession } from '@/data/seed'
import { Badge, StatusPill, ToastViewport } from '@/components/ui'
import type { Role } from '@/types'

type NavItem = {
  to: string
  label: string
  icon: LucideIcon
  end?: boolean
  admin?: boolean
}

type NavGroup = {
  label: string
  items: NavItem[]
}

const navGroups: NavGroup[] = [
  {
    label: 'Operación',
    items: [
      { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
      { to: '/live', label: 'Live Timing', icon: Timer },
      { to: '/campeonatos', label: 'Eventos', icon: CalendarDays },
      { to: '/clasificacion', label: 'Clasificación', icon: Trophy },
    ],
  },
  {
    label: 'Deporte',
    items: [
      { to: '/pilotos', label: 'Pilotos', icon: Users },
      { to: '/garaje', label: 'Garaje', icon: Car },
    ],
  },
  {
    label: 'Sistema',
    items: [
      { to: '/administracion', label: 'Administración', icon: ShieldCheck, admin: true },
      { to: '/ajustes', label: 'Ajustes', icon: Settings },
    ],
  },
]

function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-accent/25 bg-accent/10">
        <svg viewBox="0 0 32 32" className="h-5 w-5" aria-hidden="true">
          <path d="M8 24 16 7l8 17h-4.2L16 15.4 12.2 24H8Z" fill="#C9F73A" />
          <rect x="6" y="26" width="20" height="2.4" rx="1.2" fill="#C9F73A" opacity="0.7" />
        </svg>
      </div>
      <div className="leading-none">
        <p className="font-display text-lg font-bold tracking-[0.18em] text-text">APEX</p>
        <p className="mt-0.5 text-[8px] font-semibold uppercase tracking-[0.32em] text-dim">Race Control</p>
      </div>
    </div>
  )
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const role = useSession((state) => state.role)
  const user = useSession((state) => state.user)
  const logout = useSession((state) => state.logout)
  const currentLap = useRace((state) => state.currentLap)
  const totalLaps = useRace((state) => state.totalLaps)
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center border-b border-line px-5">
        <Logo />
      </div>

      <div className="border-b border-line px-3 py-3">
        <NavLink
          to={`/eventos/${currentEvent.id}`}
          onClick={onNavigate}
          className="block rounded-xl border border-line bg-surface-2/70 p-3 transition-colors hover:border-line-strong hover:bg-surface-3"
        >
          <div className="flex items-center justify-between">
            <span className="label">Ronda {currentEvent.round} / 6</span>
            <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest text-red">
              <span className="h-1.5 w-1.5 rounded-full bg-red live-dot" />
              Live
            </span>
          </div>
          <p className="mt-1 truncate font-display text-base font-semibold leading-tight text-text">
            {currentEvent.name}
          </p>
          <p className="mt-0.5 text-[10px] text-muted">
            {currentSession.name} · Vuelta {currentLap}/{totalLaps}
          </p>
          <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-surface-3">
            <div
              className="h-full rounded-full bg-accent transition-all duration-500"
              style={{ width: `${Math.min(100, (currentLap / totalLaps) * 100)}%` }}
            />
          </div>
        </NavLink>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {navGroups.map((group) => {
          const items = group.items.filter((item) => !item.admin || can(role, 'admin:users'))
          if (!items.length) return null
          return (
            <div key={group.label} className="mb-5">
              <p className="label mb-2 px-3">{group.label}</p>
              <div className="space-y-0.5">
                {items.map((item) => {
                  const Icon = item.icon
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.end}
                      onClick={onNavigate}
                      className={({ isActive }) =>
                        cn(
                          'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-colors',
                          isActive
                            ? 'bg-surface-2 text-text'
                            : 'text-muted hover:bg-surface-2/60 hover:text-text',
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          {isActive ? (
                            <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-accent" />
                          ) : null}
                          <Icon className={cn('h-4 w-4', isActive ? 'text-accent' : 'text-dim group-hover:text-muted')} />
                          <span className="flex-1">{item.label}</span>
                          {item.to === '/live' ? (
                            <span className="rounded bg-red/15 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-red">
                              Live
                            </span>
                          ) : null}
                        </>
                      )}
                    </NavLink>
                  )
                })}
              </div>
            </div>
          )
        })}
      </nav>

      <div className="border-t border-line p-3">
        <div className="flex items-center gap-3 rounded-xl px-2 py-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-accent/20 bg-accent/10 font-display text-xs font-bold text-accent">
            {user.initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-text">{user.name}</p>
            <p className="truncate text-[10px] text-muted">{roleMeta[role].label}</p>
          </div>
          <button
            onClick={handleLogout}
            className="rounded-lg p-1.5 text-dim transition-colors hover:bg-surface-2 hover:text-red"
            aria-label="Cerrar sesión"
            title="Cerrar sesión"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

function NotificationBell() {
  const [open, setOpen] = useState(false)
  const notifications = useSession((state) => state.notifications)
  const markAllRead = useSession((state) => state.markAllRead)
  const unread = notifications.filter((notification) => !notification.read).length

  const toneClasses = {
    info: 'border-sky/25 bg-sky/10 text-sky',
    warning: 'border-amber/25 bg-amber/10 text-amber',
    success: 'border-green/25 bg-green/10 text-green',
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((value) => !value)}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-surface-2 text-muted transition-colors hover:text-text"
        aria-label="Notificaciones"
      >
        <Bell className="h-4 w-4" />
        {unread > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red px-1 text-[9px] font-bold text-white">
            {unread}
          </span>
        ) : null}
      </button>

      {open ? (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden="true" />
          <div className="absolute right-0 top-11 z-50 w-80 overflow-hidden rounded-xl border border-line bg-surface shadow-2xl">
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted">Notificaciones</p>
              <button onClick={markAllRead} className="text-[10px] font-semibold text-accent hover:underline">
                Marcar leídas
              </button>
            </div>
            <div className="max-h-80 divide-y divide-line/70 overflow-y-auto">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn('flex gap-3 px-4 py-3', !notification.read && 'bg-surface-2/50')}
                >
                  <span className={cn('mt-0.5 h-2 w-2 shrink-0 rounded-full border', toneClasses[notification.tone])} />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-text">{notification.title}</p>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-muted">{notification.description}</p>
                    <p className="mt-1 text-[10px] text-dim">{notification.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : null}
    </div>
  )
}

function Topbar() {
  const role = useSession((state) => state.role)
  const setRole = useSession((state) => state.setRole)
  const user = useSession((state) => state.user)
  const pushToast = useSession((state) => state.pushToast)
  const toggleSidebar = useSession((state) => state.toggleSidebar)
  const location = useLocation()
  const clockMs = useRace((state) => state.clockMs)
  const currentLap = useRace((state) => state.currentLap)
  const totalLaps = useRace((state) => state.totalLaps)

  const path = location.pathname
  const breadcrumb = (() => {
    if (path === '/') return ['Race Control', 'Dashboard']
    if (path.startsWith('/live')) return ['Race Control', 'Live Timing']
    if (path.startsWith('/pilotos/')) return ['Deporte', 'Pilotos', 'Ficha']
    if (path.startsWith('/pilotos')) return ['Deporte', 'Pilotos']
    if (path.startsWith('/garaje/')) return ['Deporte', 'Garaje', 'Vehículo']
    if (path.startsWith('/garaje')) return ['Deporte', 'Garaje']
    if (path.startsWith('/eventos/')) return ['Eventos', 'Ronda 4']
    if (path.startsWith('/campeonatos/')) return ['Eventos', 'Campeonato']
    if (path.startsWith('/campeonatos')) return ['Eventos', 'Campeonatos']
    if (path.startsWith('/clasificacion')) return ['Deporte', 'Clasificación']
    if (path.startsWith('/administracion')) return ['Sistema', 'Administración']
    if (path.startsWith('/ajustes')) return ['Sistema', 'Ajustes']
    return ['Race Control']
  })()

  const handleRole = (next: Role) => {
    setRole(next)
    pushToast({
      tone: 'info',
      title: `Rol activo: ${roleMeta[next].label}`,
      description: roleMeta[next].description,
    })
  }

  return (
    <header className="fixed left-0 right-0 top-0 z-30 h-16 border-b border-line bg-bg/90 backdrop-blur lg:left-[248px]">
      <div className="flex h-full items-center justify-between gap-3 px-4 lg:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <button
            onClick={toggleSidebar}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-surface-2 text-muted lg:hidden"
            aria-label="Abrir menú"
          >
            <Menu className="h-4 w-4" />
          </button>
          <nav className="hidden items-center gap-1.5 text-[11px] text-dim sm:flex" aria-label="Breadcrumb">
            {breadcrumb.map((crumb, index) => (
              <span key={`${crumb}-${index}`} className="flex items-center gap-1.5">
                {index > 0 ? <ChevronRight className="h-3 w-3 text-dim/60" /> : null}
                <span className={index === breadcrumb.length - 1 ? 'font-medium text-muted' : ''}>{crumb}</span>
              </span>
            ))}
          </nav>
          <div className="sm:hidden">
            <Logo />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <NavLink
            to="/live"
            className="hidden items-center gap-2 rounded-lg border border-red/25 bg-red/10 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-red transition-colors hover:bg-red/15 sm:flex"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-red live-dot" />
            En vivo
          </NavLink>
          <div className="hidden items-center gap-2 rounded-lg border border-line bg-surface-2 px-2.5 py-1.5 md:flex">
            <Timer className="h-3.5 w-3.5 text-dim" />
            <span className="num font-mono text-xs font-medium text-text">{formatClock(clockMs)}</span>
            <span className="text-[10px] text-dim">
              V{currentLap}/{totalLaps}
            </span>
          </div>

          <NotificationBell />

          <div className="hidden items-center gap-2 sm:flex">
            <select
              value={role}
              onChange={(event) => handleRole(event.target.value as Role)}
              className="h-9 max-w-[150px] rounded-lg border border-line bg-surface-2 px-2 text-[11px] font-medium text-text outline-none focus:border-accent/50"
              aria-label="Cambiar rol de demostración"
            >
              {roleOrder.map((item) => (
                <option key={item} value={item}>
                  {roleMeta[item].label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 rounded-lg border border-line bg-surface-2 px-1.5 py-1">
            <div className="flex h-7 w-7 items-center justify-center rounded-md border border-accent/20 bg-accent/10 font-display text-[10px] font-bold text-accent">
              {user.initials}
            </div>
            <span className="hidden max-w-[90px] truncate text-[11px] font-medium text-muted lg:block">
              {user.name}
            </span>
          </div>
        </div>
      </div>
    </header>
  )
}

function MobileNav() {
  const location = useLocation()
  const toggleSidebar = useSession((state) => state.toggleSidebar)
  const items = [
    { to: '/', label: 'Inicio', icon: LayoutDashboard },
    { to: '/live', label: 'Live', icon: Timer },
    { to: '/clasificacion', label: 'Tabla', icon: Trophy },
    { to: '/pilotos', label: 'Pilotos', icon: Users },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 flex h-16 items-stretch border-t border-line bg-bg/95 backdrop-blur lg:hidden">
      {items.map((item) => {
        const Icon = item.icon
        const active = item.to === '/' ? location.pathname === '/' : location.pathname.startsWith(item.to)
        return (
          <NavLink
            key={item.to}
            to={item.to}
            className={cn(
              'flex flex-1 flex-col items-center justify-center gap-1 text-[9px] font-semibold uppercase tracking-wider',
              active ? 'text-accent' : 'text-dim',
            )}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </NavLink>
        )
      })}
      <button
        onClick={toggleSidebar}
        className="flex flex-1 flex-col items-center justify-center gap-1 text-[9px] font-semibold uppercase tracking-wider text-dim"
      >
        <Menu className="h-4 w-4" />
        Menú
      </button>
    </nav>
  )
}

export function AppShell() {
  const location = useLocation()
  const sidebarOpen = useSession((state) => state.sidebarOpen)
  const closeSidebar = useSession((state) => state.closeSidebar)
  const speed = useSession((state) => state.settings.simulationSpeed)

  useEffect(() => {
    closeSidebar()
  }, [location.pathname, closeSidebar])

  useEffect(() => {
    const interval = window.setInterval(() => {
      useRace.getState().tick()
    }, 2000 / speed)
    return () => window.clearInterval(interval)
  }, [speed])

  return (
    <div className="min-h-screen bg-bg">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[248px] border-r border-line bg-bg-elevated lg:block">
        <SidebarContent />
      </aside>

      {sidebarOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={closeSidebar} aria-hidden="true" />
          <aside className="relative h-full w-[280px] border-r border-line bg-bg-elevated slide-in-right">
            <button
              onClick={closeSidebar}
              className="absolute right-3 top-4 z-10 rounded-lg p-1.5 text-muted hover:bg-surface-2 hover:text-text"
              aria-label="Cerrar menú"
            >
              <X className="h-4 w-4" />
            </button>
            <SidebarContent onNavigate={closeSidebar} />
          </aside>
        </div>
      ) : null}

      <Topbar />

      <main className="min-h-screen pb-20 pt-16 lg:ml-[248px] lg:pb-8">
        <div className="mx-auto w-full max-w-[1600px] px-4 py-5 lg:px-6 lg:py-6">
          <Outlet />
        </div>
      </main>

      <MobileNav />
      <ToastViewport />
    </div>
  )
}

export function RoleBadge({ role }: { role: Role }) {
  return (
    <Badge tone="neutral">
      <ShieldCheck className="h-3 w-3" />
      {roleMeta[role].label}
    </Badge>
  )
}

export function LiveStatusInline() {
  return (
    <StatusPill tone="green" pulse>
      En vivo
    </StatusPill>
  )
}
