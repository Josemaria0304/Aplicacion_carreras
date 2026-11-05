import { useState, type FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ArrowRight, Gauge, LockKeyhole, ShieldCheck, Users } from 'lucide-react'
import { useCompetition } from '@/store/useCompetition'
import { useSession } from '@/store/useSession'
import { TrackMap } from '@/components/TrackMap'
import { Badge } from '@/components/ui'

export function LoginPage() {
  const login = useSession((state) => state.login)
  const register = useSession((state) => state.register)
  const pushToast = useSession((state) => state.pushToast)
  const navigate = useNavigate()
  const location = useLocation()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      if (mode === 'register') {
        await register(name, email, password)
      } else {
        await login(email, password)
      }
      await useCompetition.getState().init()
      const user = useSession.getState().user
      pushToast({
        tone: 'success',
        title: `Bienvenido, ${user.name}`,
        description: mode === 'register' ? 'Tu cuenta ya está lista.' : 'Sesión iniciada correctamente.',
      })
      const from = (location.state as { from?: string } | null)?.from || '/'
      navigate(from, { replace: true })
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'No se pudo completar el acceso.')
    } finally {
      setSubmitting(false)
    }
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
            <Badge tone="accent">Acceso seguro</Badge>
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
              <p className="label mb-1">Cuenta Apex</p>
              <h2 className="font-display text-3xl font-semibold uppercase text-text">
                {mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-muted">
                {mode === 'login' ? 'Ingresa tus credenciales para continuar.' : 'Regístrate para acceder a la plataforma.'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'register' ? (
                <label className="block space-y-1.5">
                  <span className="text-[11px] font-semibold text-muted">Nombre</span>
                  <input
                    autoComplete="name"
                    required
                    maxLength={100}
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    className="h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm text-text outline-none transition focus:border-accent"
                    placeholder="Tu nombre"
                  />
                </label>
              ) : null}
              <label className="block space-y-1.5">
                <span className="text-[11px] font-semibold text-muted">Correo electrónico</span>
                <input
                  type="email"
                  autoComplete="email"
                  required
                  maxLength={254}
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm text-text outline-none transition focus:border-accent"
                  placeholder="nombre@correo.com"
                />
              </label>
              <label className="block space-y-1.5">
                <span className="text-[11px] font-semibold text-muted">Contraseña</span>
                <input
                  type="password"
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  required
                  minLength={8}
                  maxLength={128}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm text-text outline-none transition focus:border-accent"
                  placeholder="Mínimo 8 caracteres"
                />
              </label>

              {error ? (
                <p role="alert" className="rounded-lg border border-red/30 bg-red/10 px-3 py-2 text-xs text-red">
                  {error}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={submitting}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 text-sm font-bold text-bg transition hover:brightness-110 disabled:cursor-wait disabled:opacity-60"
              >
                {submitting ? 'Procesando...' : mode === 'login' ? 'Entrar' : 'Crear cuenta'}
                {!submitting ? <ArrowRight className="h-4 w-4" /> : null}
              </button>
            </form>

            <div className="mt-5 flex items-center justify-between text-[11px] text-dim">
              <span className="inline-flex items-center gap-1.5">
                <LockKeyhole className="h-3 w-3" />
                Sesión protegida
              </span>
              <button
                type="button"
                onClick={() => {
                  setMode(mode === 'login' ? 'register' : 'login')
                  setError('')
                }}
                className="font-semibold text-accent hover:underline"
              >
                {mode === 'login' ? 'Crear cuenta' : 'Ya tengo cuenta'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
