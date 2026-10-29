import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  Clock,
  CloudSun,
  Download,
  Flag,
  MapPin,
  Radio,
  ShieldCheck,
  Timer,
  Trophy,
  Users,
} from 'lucide-react'
import { events, teams } from '@/data/seed'
import { getCircuit, getDriver, getTeam } from '@/lib/data'
import { cn, downloadCsv, formatDate } from '@/lib/utils'
import { useSession } from '@/store/useSession'
import { TrackMap } from '@/components/TrackMap'
import { LiveFeed } from '@/components/LiveFeed'
import { useRace } from '@/store/useRace'
import {
  Badge,
  Button,
  Card,
  CardHeader,
  EmptyState,
  PageHeader,
  ProgressBar,
  StatusPill,
} from '@/components/ui'

const sessionTypeLabel: Record<string, string> = {
  practice: 'Práctica libre',
  qualifying: 'Clasificación',
  sprint: 'Sprint',
  race: 'Carrera',
  endurance: 'Resistencia',
}

const sessionTone = {
  finished: { label: 'Finalizada', tone: 'green' as const },
  live: { label: 'En vivo', tone: 'red' as const },
  scheduled: { label: 'Programada', tone: 'neutral' as const },
}

const officials = [
  { role: 'Dirección de Carrera', name: 'Ricardo Sosa', initials: 'RS' },
  { role: 'Comisario deportivo', name: 'Marta Vega', initials: 'MV' },
  { role: 'Cronometraje oficial', name: 'Diego Ferrer', initials: 'DF' },
  { role: 'Organización', name: 'Julia Lima', initials: 'JL' },
]

export function EventDetailPage() {
  const { eventId = '' } = useParams()
  const navigate = useNavigate()
  const pushToast = useSession((state) => state.pushToast)
  const feed = useRace((state) => state.feed)
  const liveEntries = useRace((state) => state.entries)

  const event = events.find((item) => item.id === eventId)

  if (!event) {
    return (
      <Card>
        <EmptyState
          title="Evento no encontrado"
          description="No existe un evento con ese identificador en el calendario."
          action={
            <Button onClick={() => navigate('/campeonatos')}>
              <ArrowLeft className="h-4 w-4" />
              Volver al calendario
            </Button>
          }
        />
      </Card>
    )
  }

  const circuit = getCircuit(event.circuitId)
  const entries = event.entries.map((id) => getDriver(id))
  const finishedSessions = event.sessions.filter((session) => session.status === 'finished').length
  const progress = Math.round((finishedSessions / event.sessions.length) * 100)
  const isLive = event.status === 'live'
  const liveSession = event.sessions.find((session) => session.status === 'live')

  const handleExport = () => {
    const rows: (string | number)[][] = [
      ['Sesión', 'Tipo', 'Fecha', 'Hora', 'Duración', 'Estado'],
      ...event.sessions.map((session) => [
        session.name,
        sessionTypeLabel[session.type],
        session.date,
        session.time,
        session.duration,
        session.status,
      ]),
    ]
    downloadCsv(`apex-programa-${event.id}.csv`, rows)
    pushToast({
      tone: 'success',
      title: 'Programa exportado',
      description: `Se descargó el horario oficial de ${event.name}.`,
    })
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2 text-[11px] text-dim">
        <Link to="/campeonatos" className="inline-flex items-center gap-1 hover:text-text">
          <ArrowLeft className="h-3 w-3" />
          Calendario
        </Link>
        <span>/</span>
        <span className="text-muted">Ronda {event.round}</span>
        <span>/</span>
        <span className="text-muted">{event.name}</span>
      </div>

      <PageHeader
        eyebrow={
          <>
            <StatusPill tone={isLive ? 'red' : event.status === 'finished' ? 'green' : 'neutral'} pulse={isLive}>
              {isLive ? 'En vivo' : event.status === 'finished' ? 'Finalizado' : 'Programado'}
            </StatusPill>
            <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-dim">
              Ronda {event.round} de 6 · {formatDate(event.date)}
            </span>
          </>
        }
        title={event.name}
        description={`${circuit.name} · ${circuit.flag} ${circuit.city}, ${circuit.country} · ${event.sessions.length} sesiones · ${entries.length} pilotos inscritos.`}
        actions={
          <>
            <Button variant="secondary" size="sm" onClick={handleExport}>
              <Download className="h-3.5 w-3.5" />
              Exportar programa
            </Button>
            {isLive ? (
              <Link to="/live">
                <Button size="sm">
                  <Radio className="h-3.5 w-3.5" />
                  Live timing
                </Button>
              </Link>
            ) : (
              <Link to="/clasificacion">
                <Button size="sm">
                  <Trophy className="h-3.5 w-3.5" />
                  Clasificación
                </Button>
              </Link>
            )}
          </>
        }
      />

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          <Card className="overflow-hidden">
            <div className="grid lg:grid-cols-[1.15fr_0.85fr]">
              <div className="relative p-4">
                <div className="absolute left-4 top-4 z-10">
                  <Badge tone="accent">Mapa del circuito</Badge>
                </div>
                <TrackMap flag={isLive ? 'green' : 'chequered'} />
              </div>
              <div className="border-t border-line lg:border-l lg:border-t-0">
                <div className="grid grid-cols-2 gap-px bg-line">
                  {[
                    { label: 'Longitud', value: `${(circuit.lengthM / 1000).toFixed(3)} km` },
                    { label: 'Curvas', value: circuit.corners },
                    { label: 'Sentido', value: circuit.direction },
                    { label: 'Récord', value: circuit.record },
                  ].map((item) => (
                    <div key={item.label} className="bg-surface px-4 py-3">
                      <p className="text-[9px] uppercase tracking-wider text-dim">{item.label}</p>
                      <p className="num mt-0.5 text-sm font-semibold text-text">{item.value}</p>
                    </div>
                  ))}
                </div>
                <div className="border-t border-line px-4 py-3">
                  <p className="text-[9px] uppercase tracking-wider text-dim">Poseedor del récord</p>
                  <p className="mt-0.5 text-[11px] font-medium text-text">{circuit.recordHolder}</p>
                </div>
                <div className="border-t border-line px-4 py-3">
                  <div className="flex items-center justify-between text-[10px] text-dim">
                    <span>Sesiones completadas</span>
                    <span className="num font-mono text-muted">
                      {finishedSessions}/{event.sessions.length}
                    </span>
                  </div>
                  <ProgressBar value={finishedSessions} max={event.sessions.length} className="mt-1.5" />
                </div>
                <div className="flex flex-wrap items-center gap-3 border-t border-line px-4 py-3 text-[10px] text-muted">
                  <span className="inline-flex items-center gap-1">
                    <CloudSun className="h-3 w-3" /> 24°C aire
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Flag className="h-3 w-3" /> 15% lluvia
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Users className="h-3 w-3" /> {entries.length} inscritos
                  </span>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-2 border-t border-line bg-surface-2/40 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[11px] leading-relaxed text-muted">{event.notes}</p>
              <span className="text-[10px] text-dim">{progress}% del evento completado</span>
            </div>
          </Card>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-semibold uppercase tracking-wide text-text">Sesiones</h2>
              <span className="text-[10px] uppercase tracking-widest text-dim">
                {event.sessions.length} programadas
              </span>
            </div>

            {event.sessions.map((session) => {
              const tone = sessionTone[session.status]
              return (
                <Card key={session.id} className="overflow-hidden">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          'flex h-10 w-10 items-center justify-center rounded-xl border',
                          session.status === 'live'
                            ? 'border-red/30 bg-red/10 text-red'
                            : session.status === 'finished'
                              ? 'border-accent/25 bg-accent/10 text-accent'
                              : 'border-line bg-surface-2 text-dim',
                        )}
                      >
                        <Timer className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-display text-base font-semibold uppercase leading-none text-text">
                            {session.name}
                          </p>
                          <Badge tone={tone.tone} dot={session.status === 'live'}>
                            {tone.label}
                          </Badge>
                        </div>
                        <p className="mt-1 text-[10px] uppercase tracking-wider text-dim">
                          {sessionTypeLabel[session.type]} · {formatDate(session.date)} · {session.time} · {session.duration}
                          {session.laps ? ` · ${session.laps} vueltas` : ''}
                        </p>
                      </div>
                    </div>
                    {session.status === 'live' ? (
                      <Link to="/live">
                        <Button size="sm" variant="secondary">
                          <Radio className="h-3.5 w-3.5" />
                          Ver en vivo
                        </Button>
                      </Link>
                    ) : null}
                  </div>

                  {session.results && session.results.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[520px] text-left">
                        <thead>
                          <tr className="border-b border-line text-[9px] uppercase tracking-[0.16em] text-dim">
                            <th className="px-4 py-2 font-semibold">Pos</th>
                            <th className="px-3 py-2 font-semibold">Piloto</th>
                            <th className="px-3 py-2 font-semibold">Equipo</th>
                            <th className="px-3 py-2 text-right font-semibold">Tiempo</th>
                            <th className="px-3 py-2 text-center font-semibold">Pts</th>
                            <th className="px-4 py-2 text-right font-semibold">Vuelta rápida</th>
                          </tr>
                        </thead>
                        <tbody>
                          {session.results.map((result) => {
                            const driver = getDriver(result.driverId)
                            const team = getTeam(driver.teamId)
                            return (
                              <tr key={`${session.id}-${result.driverId}`} className="border-b border-line/60 last:border-0">
                                <td className="num px-4 py-2.5 font-display text-sm font-semibold text-text">
                                  {result.position}
                                </td>
                                <td className="px-3 py-2.5">
                                  <Link
                                    to={`/pilotos/${driver.id}`}
                                    className="flex items-center gap-2 text-xs font-medium text-text hover:text-accent"
                                  >
                                    <span className="h-4 w-[2px] rounded-full" style={{ backgroundColor: team.color }} />
                                    {driver.displayName}
                                  </Link>
                                </td>
                                <td className="px-3 py-2.5 text-[11px] text-muted">{team.name}</td>
                                <td className="num px-3 py-2.5 text-right font-mono text-[11px] text-text">{result.time}</td>
                                <td className="num px-3 py-2.5 text-center text-[11px] text-muted">{result.points || '—'}</td>
                                <td className="px-4 py-2.5 text-right">
                                  {result.fastestLap ? <Badge tone="purple">VL</Badge> : <span className="text-[10px] text-dim">—</span>}
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : session.status === 'live' ? (
                    <div className="px-4 py-3">
                      <div className="flex items-center justify-between rounded-lg border border-red/25 bg-red/10 px-3 py-2.5">
                        <span className="flex items-center gap-2 text-[11px] font-medium text-red">
                          <span className="h-1.5 w-1.5 rounded-full bg-red live-dot" />
                          Sesión en curso · {liveEntries.filter((entry) => entry.status === 'running').length} autos en pista
                        </span>
                        <Link to="/live" className="text-[10px] font-semibold text-red hover:underline">
                          Abrir cronometraje
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between px-4 py-3 text-[11px] text-dim">
                      <span className="inline-flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" />
                        Aún no disputada
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Inscripción confirmada
                      </span>
                    </div>
                  )}
                </Card>
              )
            })}
          </div>

          <Card>
            <CardHeader
              title="Pilotos inscritos"
              subtitle={`${entries.length} participantes · ${new Set(entries.map((driver) => driver.teamId)).size} equipos`}
              icon={<Users className="h-4 w-4" />}
            />
            <div className="grid gap-2 p-4 sm:grid-cols-2">
              {entries.map((driver) => {
                const team = getTeam(driver.teamId)
                return (
                  <Link
                    key={driver.id}
                    to={`/pilotos/${driver.id}`}
                    className="flex items-center gap-3 rounded-xl border border-line bg-surface-2 p-2.5 transition-colors hover:border-line-strong hover:bg-surface-3"
                  >
                    <span
                      className="num flex h-8 min-w-8 items-center justify-center rounded-md border px-1 font-display text-xs font-bold"
                      style={{
                        color: team.color,
                        borderColor: `${team.color}55`,
                        backgroundColor: `${team.color}14`,
                      }}
                    >
                      {driver.number}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-text">{driver.displayName}</p>
                      <p className="truncate text-[10px] text-dim">{team.name}</p>
                    </div>
                    <span className="text-sm">{driver.flag}</span>
                  </Link>
                )
              })}
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader title="Información del evento" icon={<CalendarDays className="h-4 w-4" />} />
            <div className="divide-y divide-line/70">
              {[
                { label: 'Ronda', value: `${event.round} de 6` },
                { label: 'Fecha', value: formatDate(event.date) },
                { label: 'Circuito', value: circuit.name },
                { label: 'Ubicación', value: `${circuit.city}, ${circuit.country}` },
                { label: 'Zona horaria', value: circuit.timezone },
                { label: 'Inscritos', value: `${entries.length} pilotos · ${teams.length} equipos` },
                { label: 'Sesiones', value: String(event.sessions.length) },
              ].map((row) => (
                <div key={row.label} className="flex items-start justify-between gap-3 px-4 py-2.5">
                  <span className="text-[11px] text-muted">{row.label}</span>
                  <span className="max-w-[62%] text-right text-[11px] font-medium text-text">{row.value}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader title="Oficiales del evento" subtitle="Equipo de dirección" icon={<ShieldCheck className="h-4 w-4" />} />
            <ul className="divide-y divide-line/70">
              {officials.map((official) => (
                <li key={official.role} className="flex items-center gap-3 px-4 py-2.5">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-line bg-surface-2 font-display text-[10px] font-bold text-muted">
                    {official.initials}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[11px] font-semibold text-text">{official.name}</p>
                    <p className="truncate text-[9px] uppercase tracking-wider text-dim">{official.role}</p>
                  </div>
                </li>
              ))}
            </ul>
          </Card>

          {isLive ? <LiveFeed items={feed.slice(0, 8)} maxHeight="max-h-[300px]" /> : null}

          <Card className="p-4">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted" />
              <p className="text-xs font-semibold text-text">Ubicación del circuito</p>
            </div>
            <div className="mt-3 flex h-28 items-center justify-center rounded-xl border border-line bg-grid">
              <div className="text-center">
                <p className="font-display text-lg font-semibold uppercase text-text">{circuit.city}</p>
                <p className="text-[10px] uppercase tracking-widest text-dim">{circuit.country} · {circuit.flag}</p>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between text-[10px] text-dim">
              <span>Lat. -23.7015</span>
              <span>Lon. -46.6969</span>
            </div>
          </Card>

          <Card className="p-4">
            <p className="label">Accesos rápidos</p>
            <div className="mt-2 space-y-1.5">
              <Link
                to="/clasificacion"
                className="flex items-center justify-between rounded-lg border border-line bg-surface-2 px-3 py-2 text-[11px] text-muted transition-colors hover:text-text"
              >
                Clasificación del campeonato
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
              <Link
                to="/garaje"
                className="flex items-center justify-between rounded-lg border border-line bg-surface-2 px-3 py-2 text-[11px] text-muted transition-colors hover:text-text"
              >
                Verificación técnica
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
              <Link
                to="/pilotos"
                className="flex items-center justify-between rounded-lg border border-line bg-surface-2 px-3 py-2 text-[11px] text-muted transition-colors hover:text-text"
              >
                Parrilla de pilotos
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
