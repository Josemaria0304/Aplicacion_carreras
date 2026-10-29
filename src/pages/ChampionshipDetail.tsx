import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
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
import { championship, drivers, events, POINTS_SCALE, standings, teamStandings, teams } from '@/data/seed'
import { getCircuit, getDriver, getTeam } from '@/lib/data'
import { formatDateShort, formatLap } from '@/lib/utils'
import { winnerOf } from '@/pages/Championships'
import {
  Badge,
  Button,
  Card,
  CardHeader,
  EmptyState,
  PageHeader,
  ProgressBar,
  Tabs,
} from '@/components/ui'
import { useState } from 'react'

const statusMeta = {
  finished: { label: 'Finalizada', tone: 'green' as const },
  live: { label: 'En vivo', tone: 'red' as const },
  scheduled: { label: 'Programada', tone: 'neutral' as const },
}

const sessionTypeLabel: Record<string, string> = {
  practice: 'Práctica',
  qualifying: 'Clasificación',
  sprint: 'Sprint',
  race: 'Carrera',
  endurance: 'Resistencia',
}

export function ChampionshipDetailPage() {
  const { championshipId = '' } = useParams()
  const navigate = useNavigate()
  const [tab, setTab] = useState('calendario')

  if (championshipId !== championship.id) {
    return (
      <Card>
        <EmptyState
          title="Campeonato no encontrado"
          description="No existe un campeonato con ese identificador."
          action={
            <Button onClick={() => navigate('/campeonatos')}>
              <ArrowLeft className="h-4 w-4" />
              Volver a campeonatos
            </Button>
          }
        />
      </Card>
    )
  }

  const completed = events.filter((event) => event.status === 'finished').length
  const totalSessions = events.reduce((sum, event) => sum + event.sessions.length, 0)

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2 text-[11px] text-dim">
        <Link to="/campeonatos" className="inline-flex items-center gap-1 hover:text-text">
          <ArrowLeft className="h-3 w-3" />
          Campeonatos
        </Link>
        <span>/</span>
        <span className="text-muted">{championship.name}</span>
      </div>

      <PageHeader
        eyebrow={
          <>
            <Badge tone="green" dot>
              {championship.status}
            </Badge>
            <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-dim">
              {championship.organizer} · Temporada {championship.season}
            </span>
          </>
        }
        title={championship.name}
        description={`${championship.rounds} rondas · ${drivers.length} pilotos · ${teams.length} equipos · ${totalSessions} sesiones programadas.`}
        actions={
          <>
            <Link to="/clasificacion">
              <Button variant="secondary" size="sm">
                <Trophy className="h-3.5 w-3.5" />
                Clasificación
              </Button>
            </Link>
            <Link to={`/eventos/${events[3].id}`}>
              <Button size="sm">
                Ronda en curso
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </>
        }
      />

      <Card className="p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex flex-wrap gap-1.5">
              {championship.categories.map((category) => (
                <Badge key={category} tone="neutral">
                  {category}
                </Badge>
              ))}
            </div>
            <p className="mt-3 max-w-2xl text-xs leading-relaxed text-muted">{championship.description}</p>
          </div>
          <div className="w-full shrink-0 lg:w-72">
            <div className="mb-1.5 flex items-center justify-between text-[10px] uppercase tracking-widest text-dim">
              <span>Progreso</span>
              <span className="num font-mono text-muted">{completed}/{championship.rounds}</span>
            </div>
            <ProgressBar value={completed} max={championship.rounds} />
            <div className="mt-2 flex justify-between text-[10px] text-dim">
              <span>{completed} finalizadas</span>
              <span>{championship.rounds - completed} por disputar</span>
            </div>
          </div>
        </div>
      </Card>

      <Tabs
        value={tab}
        onChange={setTab}
        items={[
          { id: 'calendario', label: 'Calendario', count: events.length },
          { id: 'equipos', label: 'Equipos', count: teams.length },
          { id: 'pilotos', label: 'Pilotos', count: drivers.length },
        ]}
      />

      {tab === 'calendario' ? (
        <div className="grid gap-4 xl:grid-cols-3">
          <div className="space-y-3 xl:col-span-2">
            {events.map((event) => {
              const circuit = getCircuit(event.circuitId)
              const winner = winnerOf(event)
              const winnerDriver = winner ? getDriver(winner.winner.driverId) : null
              const winnerTeam = winner ? getTeam(winnerDriver!.teamId) : null
              return (
                <Card key={event.id} className="overflow-hidden">
                  <div className="flex flex-col gap-3 border-b border-line px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={
                          event.status === 'live'
                            ? 'flex h-12 w-12 flex-col items-center justify-center rounded-xl border border-red-400/30 bg-red-400/10'
                            : event.status === 'finished'
                              ? 'flex h-12 w-12 flex-col items-center justify-center rounded-xl border border-accent/20 bg-accent/[0.06]'
                              : 'flex h-12 w-12 flex-col items-center justify-center rounded-xl border border-line bg-surface-2'
                        }
                      >
                        <span className="text-[8px] font-bold uppercase tracking-widest text-dim">
                          {event.dateLabel.split(' ')[1]}
                        </span>
                        <span className="num font-display text-lg font-bold leading-none text-text">
                          {event.dateLabel.split(' ')[0]}
                        </span>
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-display text-lg font-semibold uppercase leading-none text-text">
                            {event.name}
                          </p>
                          <Badge tone={event.status === 'live' ? 'red' : event.status === 'finished' ? 'green' : 'neutral'} dot={event.status === 'live'}>
                            {event.status === 'live' ? 'En vivo' : event.status === 'finished' ? 'Finalizado' : 'Programado'}
                          </Badge>
                        </div>
                        <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-muted">
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {circuit.name}
                          </span>
                          <span>{circuit.flag} {circuit.city}</span>
                        </p>
                      </div>
                    </div>
                    <Link to={`/eventos/${event.id}`} className="shrink-0">
                      <Button variant="secondary" size="sm">
                        Abrir evento
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  </div>

                  <div className="divide-y divide-line/60">
                    {event.sessions.map((session) => {
                      const status = statusMeta[session.status]
                      const podium = session.results?.slice(0, 3) ?? []
                      return (
                        <div key={session.id} className="flex flex-wrap items-center gap-3 px-4 py-2.5">
                          <div className="flex w-full items-center gap-2 sm:w-64">
                            <Timer className="h-3.5 w-3.5 shrink-0 text-dim" />
                            <div className="min-w-0">
                              <p className="truncate text-[11px] font-semibold text-text">{session.name}</p>
                              <p className="text-[9px] uppercase tracking-wider text-dim">
                                {sessionTypeLabel[session.type]} · {session.time} · {session.duration}
                              </p>
                            </div>
                          </div>
                          <Badge tone={status.tone}>{status.label}</Badge>
                          <div className="ml-auto flex items-center gap-2">
                            {podium.length > 0 ? (
                              podium.map((result, index) => {
                                const driver = getDriver(result.driverId)
                                return (
                                  <span
                                    key={result.driverId}
                                    className="hidden items-center gap-1 text-[10px] text-muted sm:flex"
                                    title={`${result.time} · ${result.points} pts`}
                                  >
                                    <span className={index === 0 ? 'font-bold text-accent' : 'text-dim'}>
                                      {index + 1}.
                                    </span>
                                    {driver.displayName}
                                  </span>
                                )
                              })
                            ) : event.status === 'live' && session.status === 'live' ? (
                              <Link to="/live" className="text-[10px] font-semibold text-red hover:underline">
                                Ver en vivo
                              </Link>
                            ) : (
                              <span className="text-[10px] text-dim">Sin resultados</span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {winnerDriver && winnerTeam ? (
                    <div className="flex items-center justify-between border-t border-line bg-surface-2/40 px-4 py-2">
                      <span className="text-[9px] uppercase tracking-widest text-dim">
                        {winner?.session.name} · Ganador
                      </span>
                      <span className="flex items-center gap-2 text-[11px] font-semibold text-text">
                        <span className="h-4 w-[2px] rounded-full" style={{ backgroundColor: winnerTeam.color }} />
                        {winnerDriver.displayName}
                        <span className="num font-mono text-[10px] text-muted">{winner?.winner.time}</span>
                      </span>
                    </div>
                  ) : null}
                </Card>
              )
            })}
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader title="Datos del campeonato" icon={<Flag className="h-4 w-4" />} />
              <div className="divide-y divide-line/70">
                {[
                  ['Organizador', championship.organizer],
                  ['Temporada', String(championship.season)],
                  ['Rondas', String(championship.rounds)],
                  ['Categorías', championship.categories.join(', ')],
                  ['Pilotos', String(drivers.length)],
                  ['Equipos', String(teams.length)],
                  ['Sesiones', String(totalSessions)],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-start justify-between gap-3 px-4 py-2.5">
                    <span className="text-[11px] text-muted">{label}</span>
                    <span className="max-w-[60%] text-right text-[11px] font-medium text-text">{value}</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <CardHeader title="Escala de puntos" icon={<Trophy className="h-4 w-4" />} />
              <div className="grid grid-cols-2 gap-1.5 p-4">
                {POINTS_SCALE.map((points, index) => (
                  <div key={index} className="flex items-center justify-between rounded-md border border-line bg-surface-2 px-2 py-1.5">
                    <span className="text-[10px] text-muted">P{index + 1}</span>
                    <span className="num text-[11px] font-semibold text-text">{points}</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <CardHeader title="Circuito con récord" subtitle="Mejor vuelta absoluta" icon={<Timer className="h-4 w-4" />} />
              <div className="p-4">
                <p className="num font-mono text-2xl font-semibold text-purple">{formatLap(91882)}</p>
                <p className="mt-1 text-[11px] text-muted">A. Rossi · Aurora Motorsport</p>
                <p className="mt-1 text-[10px] text-dim">Interlagos · Clasificación 2026</p>
              </div>
            </Card>
          </div>
        </div>
      ) : null}

      {tab === 'equipos' ? (
        <Card>
          <CardHeader
            title="Clasificación de equipos"
            subtitle="Suma de puntos de todos sus pilotos"
            icon={<ShieldCheck className="h-4 w-4" />}
          />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] text-left">
              <thead>
                <tr className="border-b border-line text-[9px] uppercase tracking-[0.16em] text-dim">
                  <th className="px-4 py-2 font-semibold">Pos</th>
                  <th className="px-3 py-2 font-semibold">Equipo</th>
                  <th className="px-3 py-2 font-semibold">País</th>
                  <th className="px-3 py-2 font-semibold">Pilotos</th>
                  <th className="px-3 py-2 text-center font-semibold">Victorias</th>
                  <th className="px-3 py-2 text-center font-semibold">Podios</th>
                  <th className="px-4 py-2 text-right font-semibold">Puntos</th>
                </tr>
              </thead>
              <tbody>
                {teamStandings.map((row) => {
                  const team = getTeam(row.teamId)
                  const teamDrivers = drivers.filter((driver) => driver.teamId === team.id)
                  return (
                    <tr key={team.id} className="border-b border-line/60 last:border-0">
                      <td className="num px-4 py-3 font-display text-base font-semibold text-text">{row.position}</td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <span className="h-6 w-[3px] rounded-full" style={{ backgroundColor: team.color }} />
                          <span className="text-xs font-semibold text-text">{team.name}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-[11px] text-muted">{team.country}</td>
                      <td className="px-3 py-3 text-[11px] text-muted">
                        {teamDrivers.map((driver) => driver.displayName).join(' · ')}
                      </td>
                      <td className="num px-3 py-3 text-center text-xs text-text">{row.wins}</td>
                      <td className="num px-3 py-3 text-center text-xs text-text">{row.podiums}</td>
                      <td className="num px-4 py-3 text-right text-xs font-semibold text-text">{row.points}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      ) : null}

      {tab === 'pilotos' ? (
        <Card>
          <CardHeader title="Pilotos inscritos" subtitle="Clasificación general" icon={<Users className="h-4 w-4" />} />
          <div className="grid gap-2 p-4 sm:grid-cols-2 xl:grid-cols-3">
            {standings.map((row) => {
              const driver = getDriver(row.driverId)
              const team = getTeam(row.teamId)
              return (
                <Link
                  key={driver.id}
                  to={`/pilotos/${driver.id}`}
                  className="flex items-center gap-3 rounded-xl border border-line bg-surface-2 p-3 transition-colors hover:border-line-strong hover:bg-surface-3"
                >
                  <span className="num w-5 font-display text-sm font-semibold text-muted">{row.position}</span>
                  <span className="h-7 w-[3px] rounded-full" style={{ backgroundColor: team.color }} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-text">{driver.displayName}</p>
                    <p className="truncate text-[10px] text-dim">{team.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="num text-[11px] font-semibold text-text">{row.points}</p>
                    <p className="text-[9px] uppercase tracking-wider text-dim">pts</p>
                  </div>
                </Link>
              )
            })}
          </div>
        </Card>
      ) : null}

      <div className="flex items-center gap-2 text-[10px] text-dim">
        <CalendarDays className="h-3 w-3" />
        Calendario sujeto a confirmación de la federación · Última actualización {formatDateShort('2026-06-14')}
      </div>
    </div>
  )
}
