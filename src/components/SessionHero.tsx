import { CloudSun, Droplets, Flag, MapPin, Thermometer, Timer, Wind } from 'lucide-react'
import { currentEvent, currentSession } from '@/data/seed'
import { getCircuit, getDriver, getTeam } from '@/lib/data'
import { cn, formatClock, formatLap } from '@/lib/utils'
import { useRace } from '@/store/useRace'
import { TrackMap } from '@/components/TrackMap'
import { FlagBanner } from '@/components/RaceControls'
import { Badge, Card } from '@/components/ui'

const weather = {
  condition: 'Parcialmente nublado',
  air: 24,
  track: 31,
  humidity: 58,
  wind: '9 km/h NO',
  rainChance: 15,
}

export function SessionHero({ className }: { className?: string }) {
  const entries = useRace((state) => state.entries)
  const flag = useRace((state) => state.flag)
  const status = useRace((state) => state.status)
  const currentLap = useRace((state) => state.currentLap)
  const totalLaps = useRace((state) => state.totalLaps)
  const clockMs = useRace((state) => state.clockMs)
  const fastestLapMs = useRace((state) => state.fastestLapMs)
  const fastestLapEntryId = useRace((state) => state.fastestLapEntryId)

  const circuit = getCircuit(currentEvent.circuitId)
  const leaderEntry = entries.find((entry) => entry.position === 1)
  const leader = leaderEntry ? getDriver(leaderEntry.driverId) : null
  const leaderTeam = leaderEntry ? getTeam(leaderEntry.teamId) : null
  const fastestEntry = entries.find((entry) => entry.id === fastestLapEntryId)
  const fastestDriver = fastestEntry ? getDriver(fastestEntry.driverId) : null
  const progress = Math.min(100, (currentLap / totalLaps) * 100)

  return (
    <Card className={cn('relative overflow-hidden', className)}>
      <div className="pointer-events-none absolute -left-24 -top-24 h-64 w-64 rounded-full bg-accent/10 blur-[90px]" />
      <div className="pointer-events-none absolute -bottom-32 right-1/3 h-64 w-64 rounded-full bg-sky/10 blur-[90px]" />

      <div className="relative grid lg:grid-cols-[1.08fr_0.92fr]">
        <div className="flex flex-col justify-between gap-5 p-5 sm:p-6">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="accent">Ronda {currentEvent.round} de 6</Badge>
              <Badge tone="neutral">
                <span className="h-1.5 w-1.5 rounded-full bg-red live-dot" />
                {status === 'live' ? 'Sesión en curso' : status === 'finished' ? 'Sesión finalizada' : 'Sesión neutralizada'}
              </Badge>
              <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-dim">
                {currentSession.name} · {currentSession.duration}
              </span>
            </div>

            <h2 className="mt-3 font-display text-3xl font-semibold uppercase leading-none tracking-tight text-text sm:text-4xl">
              {currentEvent.name}
            </h2>
            <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {circuit.name}
              </span>
              <span>{circuit.flag} {circuit.city}, {circuit.country}</span>
              <span className="num font-mono text-[11px] text-dim">
                {(circuit.lengthM / 1000).toFixed(3)} km · {circuit.corners} curvas
              </span>
            </p>
          </div>

          <FlagBanner />

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-line bg-surface-2/70 p-3">
              <p className="label flex items-center gap-1">
                <Flag className="h-3 w-3" /> Vuelta
              </p>
              <p className="num mt-1 font-display text-2xl font-semibold leading-none text-text">
                {currentLap}
                <span className="text-sm text-dim">/{totalLaps}</span>
              </p>
            </div>
            <div className="rounded-xl border border-line bg-surface-2/70 p-3">
              <p className="label flex items-center gap-1">
                <Timer className="h-3 w-3" /> Reloj
              </p>
              <p className="num mt-1 font-mono text-lg font-semibold leading-none text-text">
                {formatClock(clockMs)}
              </p>
            </div>
            <div className="col-span-2 rounded-xl border border-line bg-surface-2/70 p-3">
              <p className="label">Líder de la carrera</p>
              <div className="mt-1 flex items-center gap-2">
                {leaderTeam ? (
                  <span
                    className="num flex h-6 min-w-6 items-center justify-center rounded border px-1 font-display text-xs font-bold"
                    style={{
                      color: leaderTeam.color,
                      borderColor: `${leaderTeam.color}55`,
                      backgroundColor: `${leaderTeam.color}14`,
                    }}
                  >
                    {leaderEntry?.number}
                  </span>
                ) : null}
                <p className="truncate font-display text-lg font-semibold leading-none text-text">
                  {leader?.displayName ?? '—'}
                </p>
                {leaderEntry ? (
                  <span className="num ml-auto shrink-0 font-mono text-[10px] text-accent">
                    V{leaderEntry.lapsCompleted}
                  </span>
                ) : null}
              </div>
              <p className="mt-1 truncate text-[10px] text-dim">
                {leaderTeam?.name ?? ''} · {leader?.category ?? ''}
              </p>
            </div>
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between text-[10px] uppercase tracking-widest text-dim">
              <span>Progreso de carrera</span>
              <span className="num font-mono text-muted">{Math.round(progress)}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-surface-3">
              <div className="bar-grow h-full rounded-full bg-accent" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>

        <div className="relative flex flex-col border-t border-line bg-bg-elevated/40 lg:border-l lg:border-t-0">
          <div className="relative flex-1 p-3 sm:p-4">
            <div className="absolute left-4 top-4 z-10 rounded-lg border border-line bg-bg/80 px-2.5 py-1.5 backdrop-blur">
              <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-dim">Mapa en vivo</p>
              <p className="text-[11px] font-semibold text-text">Interlagos · 4.309 km</p>
            </div>
            <TrackMap flag={flag} className="min-h-[190px]" />
          </div>

          <div className="grid grid-cols-2 gap-px border-t border-line bg-line sm:grid-cols-4">
            <div className="bg-bg-elevated px-3 py-2.5">
              <p className="flex items-center gap-1 text-[9px] uppercase tracking-wider text-dim">
                <CloudSun className="h-3 w-3" /> Aire
              </p>
              <p className="num mt-0.5 text-sm font-semibold text-text">{weather.air}°C</p>
            </div>
            <div className="bg-bg-elevated px-3 py-2.5">
              <p className="flex items-center gap-1 text-[9px] uppercase tracking-wider text-dim">
                <Thermometer className="h-3 w-3" /> Pista
              </p>
              <p className="num mt-0.5 text-sm font-semibold text-text">{weather.track}°C</p>
            </div>
            <div className="bg-bg-elevated px-3 py-2.5">
              <p className="flex items-center gap-1 text-[9px] uppercase tracking-wider text-dim">
                <Droplets className="h-3 w-3" /> Humedad
              </p>
              <p className="num mt-0.5 text-sm font-semibold text-text">{weather.humidity}%</p>
            </div>
            <div className="bg-bg-elevated px-3 py-2.5">
              <p className="flex items-center gap-1 text-[9px] uppercase tracking-wider text-dim">
                <Wind className="h-3 w-3" /> Viento
              </p>
              <p className="num mt-0.5 text-sm font-semibold text-text">{weather.wind}</p>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-line px-4 py-2.5">
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-purple" />
              <span className="text-[10px] text-muted">Vuelta rápida</span>
            </div>
            <span className="num font-mono text-xs font-semibold text-purple">{formatLap(fastestLapMs)}</span>
            <span className="text-[10px] text-dim">{fastestDriver?.displayName ?? '—'}</span>
          </div>
        </div>
      </div>
    </Card>
  )
}
