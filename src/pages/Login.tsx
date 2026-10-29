import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Gauge, LockKeyhole, ShieldCheck, Users } from 'lucide-react'
import { DEMO_USERS, useSession } from '@/store/useSession'
import { roleMeta, roleOrder } from '@/lib/permissions'
import { cn } from '@/lib/utils'
import { TrackMap } from '@/components/TrackMap'
import { Badge } from '@/components/ui'
import type { Role } from '@/types'

export function LoginPage() {
  const login = useSession((state) => state.login)
  const isAuthenticated = useSession((state) => state.isAuthenticated)
  const role = useSession((state) => state.role)
  const pushToast = useSession((state) => state.pushToast)
  const navigate = useNavigate()

  const handleLogin = (next: Role) => {
    login(next)
    pushToast({
      tone: 'success',
      title: `Bienvenido, ${DEMO_USERS[next].name}`,
      description: `Sesión iniciada como ${roleMeta[next].label}.`,
    })
    navigate('/')
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-bg">
      <div className="absolute inset-0 bg-grid opacity-60" />
      <div className="pointer-events-none absolute -left-40 top-0 h-[600px] w-[600px] rounded-full bg-accent/10 blur-[140px]" />
      <div className="pointer-events-none absolute -right-20 bottom-0 h-[500px] w-[500px] rounded-full bg-sky/10 blur-[140px]" />

      <div className="relative mx-auto grid min-h-screen max-w-[1500px] lg:grid-cols-[1.1fr_0.9fr]">
        <div className="flex flex-col justify-between px-6 py-8 lg:px-14 lg:py-12">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-accent/25 bg-accent/10">
                <svg viewBox="0 0 32 32" className="h-5 w-5" aria-hidden="true">
                  <path d="M8 24 16 7l8 17h-4.2L16 15.4 12.2 24H8Z" fill="#C9F73A" />
                  <rect x="6" y="26" width="20" height="2.4" rx="1.2" fill="#C9F73A" opacity="0.7" />
                </svg>
              </div>
              <div className="leading-none">
                <p className="font-display text-xl font-bold tracking-[0.18em] text-text">APEX</p>
                <p className="mt-0.5 text-[8px] font-semibold uppercase tracking-[0.32em] text-dim">Race Control</p>
              </div>
            </div>
            <Badge tone="accent">Demo interactiva</Badge>
          </div>

          <div className="my-12 max-w-xl">
            <p className="label mb-4 text-accent">Plataforma modular de gestión de carreras</p>
            <h1 className="font-display text-6xl font-bold uppercase leading-[0.9] tracking-tight text-text sm:text-7xl lg:text-8xl">
              Cada
              <br />
              décima
              <br />
              <span className="text-accent">cuenta.</span>
            </h1>
            <p className="mt-6 max-w-md text-sm leading-relaxed text-muted">
              Planifica eventos, administra pilotos y vehículos, registra tiempos y publica
              resultados en tiempo real. Todo el fin de semana de carrera, en una sola consola.
            </p>

            <div className="mt-8 grid max-w-md grid-cols-3 gap-3">
              {[
                { value: '14', label: 'GT3 en pista', icon: Users },
                { value: '180 ms', label: 'Latencia live', icon: Gauge },
                { value: '7', label: 'Roles y permisos', icon: ShieldCheck },
              ].map((stat) => {
                const Icon = stat.icon
                return (
                  <div key={stat.label} className="rounded-xl border border-line bg-surface/70 p-3">
                    <Icon className="h-4 w-4 text-accent" />
                    <p className="num mt-2 font-display text-xl font-semibold text-text">{stat.value}</p>
                    <p className="text-[9px] uppercase tracking-wider text-dim">{stat.label}</p>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="hidden lg:block">
            <div className="relative h-44 w-full max-w-xl opacity-90">
              <TrackMap />
            </div>
            <p className="mt-2 text-[10px] uppercase tracking-[0.2em] text-dim">
              Autódromo José Carlos Pace · São Paulo · 4.309 km
            </p>
          </div>
        </div>

        <div className="flex items-center justify-center border-t border-line bg-bg-elevated/80 px-6 py-10 backdrop-blur lg:border-l lg:border-t-0 lg:px-10">
          <div className="w-full max-w-md">
            <div className="mb-6">
              <p className="label mb-1">Acceso de demostración</p>
              <h2 className="font-display text-3xl font-semibold uppercase text-text">Elige un rol</h2>
              <p className="mt-1 text-xs leading-relaxed text-muted">
                Cada perfil aplica permisos reales: cambia de rol para ver cómo se adapta la consola.
              </p>
            </div>

            <div className="space-y-2">
              {roleOrder.map((item) => {
                const meta = roleMeta[item]
                const user = DEMO_USERS[item]
                return (
                  <button
                    key={item}
                    onClick={() => handleLogin(item)}
                    className="group flex w-full items-center gap-3 rounded-xl border border-line bg-surface p-3 text-left transition-all hover:border-line-strong hover:bg-surface-2"
                  >
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border font-display text-[10px] font-bold"
                      style={{
                        color: meta.accent,
                        borderColor: `${meta.accent}44`,
                        backgroundColor: `${meta.accent}12`,
                      }}
                    >
                      {user.initials}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-text">{meta.label}</span>
                        <span className="text-[10px] text-dim">· {user.name}</span>
                      </span>
                      <span className="mt-0.5 block text-[11px] leading-snug text-muted">
                        {meta.description}
                      </span>
                    </span>
                    <ArrowRight className="h-4 w-4 shrink-0 text-dim transition-transform group-hover:translate-x-0.5 group-hover:text-accent" />
                  </button>
                )
              })}
            </div>

            <div className="mt-5 flex items-center justify-between text-[10px] text-dim">
              <span className="inline-flex items-center gap-1.5">
                <LockKeyhole className="h-3 w-3" />
                Entorno de demostración · sin contraseña
              </span>
              {isAuthenticated ? (
                <Link to="/" className="font-semibold text-accent hover:underline">
                  Continuar como {roleMeta[role].label}
                </Link>
              ) : null}
            </div>

            <div className={cn('mt-6 rounded-xl border border-line bg-surface/50 p-3')}>
              <p className="text-[10px] leading-relaxed text-muted">
                <span className="font-semibold text-text">Nota:</span> los datos son ficticios y la
                carrera se simula en el navegador. El live timing se actualiza cada 2 segundos y las
                sanciones modifican la clasificación al instante.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
