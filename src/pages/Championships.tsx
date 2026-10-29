import { Link } from 'react-router-dom'
import {
  ArrowUpRight,
  CalendarDays,
  ChevronRight,
  Flag,
  MapPin,
  ShieldCheck,
  Timer,
  Trophy,
  Users,
} from 'lucide-react'
import { championship, currentEvent, drivers, events, POINTS_SCALE, teamStandings, teams } from '@/data/seed'
import { getCircuit, getDriver, getEventForCircuit, getTeam } from '@/lib/data'
import { formatDateShort } from '@/lib/utils'
import {
  Badge,
  Button,
  Card,
  CardHeader,
  PageHeader,
  ProgressBar,
  StatCard,
} from '@/components/ui'
import type { RaceEvent } from '@/types'

export function winnerOf(event: RaceEvent) {
  const sessions = [...event.sessions].reverse()
  const race = sessions.find((session) => session.results && session.results.length > 0)
  const winner = race?.results?.[0]
  return winner ? { session: race, winner } : null
}

const statusTone = {
  finished: { label: 'Finalizado', tone: 'green' as const },
  live: { label: 'En vivo', tone: 'red' as const },
  scheduled: { label: 'Programado', tone: 'neutral' as const },
}

export function ChampionshipsPage() {
  const completed = events.filter((event) => event.status === 'finished').length
  const live = events.filter((event) => event.status === 'live').length
  const upcoming = events.filter((event) => event.status === 'scheduled').length
  const totalSessions = events.reduce((sum, event) => sum + event.sessions.length, 0)

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow={
          <Badge tone="accent">
            <Trophy className="h-3 w-3" />
            Temporada {championship.season}
          </Badge>
        }
        title="Campeonatos y eventos"
        description={championship.description}
        actions={
          <>
            <Link to="/clasificacion">
              <Button variant="secondary" size="sm">
                Ver clasificación
              </Button>
            </Link>
            <Link to={`/eventos/${currentEvent.id}`}>
              <Button size="sm">
                Evento en curso
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </>
        }
      />

      <Card className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-grid opacity-40" />
        <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-accent/15 blur-[100px]" />
        <span className="pointer-events-none absolute -bottom-8 right-4 font-display text-[120px] font-bold leading-none tracking-tighter text-white/[0.03]">
          2026
        </span>
        <div className="relative grid gap-5 p-5 sm:p-6 lg:grid-cols-[1.4fr_0.6fr]">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="green" dot>
                {championship.status}
              </Badge>
              <Badge tone="neutral">{championship.categories.join(' · ')}</Badge>
            </div>
            <h2 className="mt-3 font-display text-4xl font-bold uppercase leading-none tracking-tight text-text sm:text-5xl">
              {championship.name}
            </h2>
            <p className="mt-1.5 text-xs text-muted">
              {championship.organizer} · {championship.rounds} rondas · {drivers.length} pilotos · {teams.length} equipos
            </p>
            <p className="mt-4 max-w-2xl text-xs leading-relaxed text-muted">{championship.description}</p>

            <div className="mt-5">
              <div className="mb-1.5 flex items-center justify-between text-[10px] uppercase tracking-widest text-dim">
                <span>Progreso de temporada</span>
                <span className="num font-mono text-muted">
                  {completed + live} / {championship.rounds} rondas
                </span>
              </div>
              <ProgressBar value={completed + live} max={championship.rounds} />
              <div className="mt-3 flex flex-wrap gap-1.5">
                {events.map((event) => (
                  <Link
                    key={event.id}
                    to={`/eventos/${event.id}`}
                    title={event.name}
                    className={
                      event.status === 'live'
                        ? 'flex h-7 w-7 items-center justify-center rounded-md border border-red-400/40 bg-red-400/15 text-[10px] font-bold text-red-400'
                        : event.status === 'finished'
                          ? 'flex h-7 w-7 items-center justify-center rounded-md border border-accent/25 bg-accent/10 text-[10px] font-bold text-accent'
                          : 'flex h-7 w-7 items-center justify-center rounded-md border border-line bg-surface-2 text-[10px] font-bold text-dim'
                    }
                  >
                    R{event.round}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 self-start">
            <div className="rounded-xl border border-line bg-surface-2/70 p-3">
              <p className="label">Completadas</p>
              <p className="num mt-1 font-display text-2xl font-semibold text-accent">{completed}</p>
            </div>
            <div className="rounded-xl border border-line bg-surface-2/70 p-3">
              <p className="label">En curso</p>
              <p className="num mt-1 font-display text-2xl font-semibold text-red">{live}</p>
            </div>
            <div className="rounded-xl border border-line bg-surface-2/70 p-3">
              <p className="label">Programadas</p>
              <p className="num mt-1 font-display text-2xl font-semibold text-text">{upcoming}</p>
            </div>
            <div className="rounded-xl border border-line bg-surface-2/70 p-3">
              <p className="label">Sesiones</p>
              <p className="num mt-1 font-display text-2xl font-semibold text-text">{totalSessions}</p>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Rondas del campeonato" value={championship.rounds} detail={`${completed} finalizadas`} icon={<CalendarDays className="h-4 w-4" />} accent="accent" />
        <StatCard label="Pilotos inscritos" value={drivers.length} detail={`${teams.length} equipos`} icon={<Users className="h-4 w-4" />} accent="sky" />
        <StatCard label="Sesiones totales" value={totalSessions} detail="Prácticas, clasificación y carreras" icon={<Timer className="h-4 w-4" />} accent="purple" />
        <StatCard label="Sistema de puntos" value={`${POINTS_SCALE[0]}-${POINTS_SCALE[POINTS_SCALE.length - 1]}`} detail="+1 pt por vuelta rápida" icon={<Trophy className="h-4 w-4" />} accent="amber" />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="space-y-3 xl:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold uppercase tracking-wide text-text">Calendario</h2>
            <span className="text-[10px] uppercase tracking-widest text-dim">6 rondas · 3 países</span>
          </div>

          {events.map((event) => {
            const circuit = getCircuit(event.circuitId)
            const winner = winnerOf(event)
            const winnerDriver = winner ? getDriver(winner.winner.driverId) : null
            const winnerTeam = winner ? getTeam(winnerDriver!.teamId) : null
            const status = statusTone[event.status]
            return (
              <Link
                key={event.id}
                to={`/eventos/${event.id}`}
                className="panel panel-hover group flex flex-col gap-4 p-4 sm:flex-row sm:items-center"
              >
                <div className="flex w-full shrink-0 items-center gap-4 sm:w-48">
                  <div
                    className={
                      event.status === 'live'
                        ? 'flex h-14 w-14 flex-col items-center justify-center rounded-xl border border-red-400/30 bg-red-400/10'
                        : event.status === 'finished'
                          ? 'flex h-14 w-14 flex-col items-center justify-center rounded-xl border border-accent/20 bg-accent/[0.06]'
                          : 'flex h-14 w-14 flex-col items-center justify-center rounded-xl border border-line bg-surface-2'
                    }
                  >
                    <span className="text-[8px] font-bold uppercase tracking-widest text-dim">
                      {event.dateLabel.split(' ')[1]}
                    </span>
                    <span
                      className={
                        event.status === 'live'
                          ? 'num font-display text-xl font-bold leading-none text-red-400'
                          : event.status === 'finished'
                            ? 'num font-display text-xl font-bold leading-none text-accent'
                            : 'num font-display text-xl font-bold leading-none text-text'
                      }
                    >
                      {event.dateLabel.split(' ')[0]}
                    </span>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-dim">Ronda {event.round}</p>
                    <p className="text-[11px] text-muted">{formatDateShort(event.date)}</p>
                  </div>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-display text-lg font-semibold uppercase leading-none text-text">
                      {event.name}
                    </h3>
                    <Badge tone={status.tone} dot={event.status === 'live'}>
                      {status.label}
                    </Badge>
                  </div>
                  <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-muted">
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {circuit.name}
                    </span>
                    <span>{circuit.flag} {circuit.city}</span>
                    <span className="num font-mono text-dim">{(circuit.lengthM / 1000).toFixed(3)} km</span>
                  </p>
                  <p className="mt-1 text-[10px] text-dim">
                    {event.sessions.length} sesiones · {event.entries.length} inscritos
                    {winnerDriver && winnerTeam ? (
                      <>
                        {' · Ganador: '}
                        <span className="font-medium" style={{ color: winnerTeam.color }}>
                          {winnerDriver.displayName}
                        </span>
                      </>
                    ) : null}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-3">
                  {winnerDriver && winnerTeam ? (
                    <div className="hidden text-right sm:block">
                      <p className="text-[9px] uppercase tracking-wider text-dim">
                        {winner?.session.name ?? 'Ganador'}
                      </p>
                      <div className="mt-0.5 flex items-center justify-end gap-1.5">
                        <span className="h-4 w-[2px] rounded-full" style={{ backgroundColor: winnerTeam.color }} />
                        <span className="text-[11px] font-semibold text-text">{winnerDriver.displayName}</span>
                      </div>
                    </div>
                  ) : null}
                  <ChevronRight className="h-4 w-4 text-dim transition-transform group-hover:translate-x-0.5 group-hover:text-accent" />
                </div>
              </Link>
            )
          })}
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader
              title="Clasificación de equipos"
              subtitle="Después de 4 rondas"
              icon={<ShieldCheck className="h-4 w-4" />}
              action={
                <Link to="/clasificacion" className="text-[11px] font-semibold text-accent hover:underline">
                  Ver
                </Link>
              }
            />
            <ol className="divide-y divide-line/70">
              {teamStandings.slice(0, 6).map((row) => {
                const team = getTeam(row.teamId)
                const teamDrivers = drivers.filter((driver) => driver.teamId === team.id)
                return (
                  <li key={team.id} className="flex items-center gap-3 px-4 py-2.5">
                    <span className="num w-5 font-display text-sm font-semibold text-muted">{row.position}</span>
                    <span className="h-6 w-[3px] rounded-full" style={{ backgroundColor: team.color }} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[11px] font-semibold text-text">{team.name}</p>
                      <p className="truncate text-[9px] text-dim">{teamDrivers.map((driver) => driver.displayName).join(' · ')}</p>
                    </div>
                    <span className="num text-[11px] font-semibold text-text">{row.points}</span>
                  </li>
                )
              })}
            </ol>
          </Card>

          <Card>
            <CardHeader title="Sistema de puntos" subtitle="Escala oficial por carrera" icon={<Trophy className="h-4 w-4" />} />
            <div className="grid grid-cols-2 gap-1.5 p-4">
              {POINTS_SCALE.map((points, index) => (
                <div key={index} className="flex items-center justify-between rounded-md border border-line bg-surface-2 px-2 py-1.5">
                  <span className="text-[10px] text-muted">P{index + 1}</span>
                  <span className="num text-[11px] font-semibold text-text">{points}</span>
                </div>
              ))}
              <div className="col-span-2 mt-1 flex items-center justify-between rounded-md border border-purple/25 bg-purple/10 px-2 py-1.5">
                <span className="text-[10px] text-purple">Vuelta rápida</span>
                <span className="num text-[11px] font-semibold text-purple">+1</span>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader title="Categorías" subtitle="Clases homologadas" icon={<Flag className="h-4 w-4" />} />
            <ul className="divide-y divide-line/70">
              {championship.categories.map((category) => (
                <li key={category} className="flex items-center justify-between px-4 py-2.5">
                  <span className="text-[11px] font-medium text-text">{category}</span>
                  <Badge tone={category === 'GT4' ? 'amber' : 'accent'}>
                    {drivers.filter((driver) => driver.category === category).length} pilotos
                  </Badge>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  )
}

export { getEventForCircuit }
