import { Link, useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowUpRight,
  CalendarClock,
  Car,
  CheckCircle2,
  ClipboardCheck,
  Download,
  Gauge,
  Radio,
  Trophy,
  Users,
} from 'lucide-react'
import { championship, currentEvent, events, standings, teams, vehicles } from '@/data/seed'
import { getDriver, getTeam } from '@/lib/data'
import { downloadCsv, formatDateShort, formatGap, formatLap } from '@/lib/utils'
import { useRace } from '@/store/useRace'
import { useSession } from '@/store/useSession'
import { SessionHero } from '@/components/SessionHero'
import { RaceControls } from '@/components/RaceControls'
import { LiveFeed } from '@/components/LiveFeed'
import { TimingTable } from '@/components/TimingTable'
import {
  Badge,
  Button,
  Card,
  CardHeader,
  PageHeader,
  ProgressBar,
  StatCard,
} from '@/components/ui'

const checklistItems = [
  {
    title: 'Revisión técnica BMW M4 #44',
    detail: 'Alerón 4 mm fuera de tolerancia · Box 12',
    time: '17:15',
    tone: 'amber' as const,
    icon: AlertTriangle,
  },
  {
    title: 'Pesaje final Mercedes-AMG #3',
    detail: 'Pendiente de báscula y verificación de extintor',
    time: '17:40',
    tone: 'amber' as const,
    icon: ClipboardCheck,
  },
  {
    title: 'Acta de comisarios · Sprint',
    detail: 'Revisión de track limits de 4 pilotos',
    time: '18:10',
    tone: 'red' as const,
    icon: AlertTriangle,
  },
  {
    title: 'Documentación Audi R8 #74',
    detail: 'Arnés y caducidad de extintor por validar',
    time: '18:25',
    tone: 'sky' as const,
    icon: ClipboardCheck,
  },
]

const upcomingSessions = events
  .flatMap((event) =>
    event.sessions.map((session) => ({
      ...session,
      eventId: event.id,
      eventName: event.name,
      round: event.round,
      dateLabel: event.dateLabel,
    })),
  )
  .filter((session) => session.status !== 'finished')
  .slice(0, 5)

export function DashboardPage() {
  const entries = useRace((state) => state.entries)
  const feed = useRace((state) => state.feed)
  const fastestLapMs = useRace((state) => state.fastestLapMs)
  const fastestLapEntryId = useRace((state) => state.fastestLapEntryId)
  const pushToast = useSession((state) => state.pushToast)
  const navigate = useNavigate()

  const leaderRow = standings[0]
  const leader = getDriver(leaderRow.driverId)
  const leaderTeam = getTeam(leaderRow.teamId)
  const approved = vehicles.filter((vehicle) => vehicle.status === 'approved').length
  const pending = vehicles.length - approved
  const fastestEntry = entries.find((entry) => entry.id === fastestLapEntryId)
  const fastestDriver = fastestEntry ? getDriver(fastestEntry.driverId) : leader
  const activeDrivers = entries.filter((entry) => entry.status === 'running' || entry.status === 'pit').length

  const handleExport = () => {
    const rows: (string | number)[][] = [
      ['Pos', 'N°', 'Piloto', 'Equipo', 'Vueltas', 'Última vuelta', 'Mejor vuelta', 'Gap'],
      ...entries
        .slice()
        .sort((a, b) => a.position - b.position)
        .map((entry) => [
          entry.position,
          entry.number,
          getDriver(entry.driverId).displayName,
          getTeam(entry.teamId).name,
          entry.lapsCompleted,
          formatLap(entry.lastLapMs),
          formatLap(entry.bestLapMs),
          formatGap(entry.gapMs),
        ]),
    ]
    downloadCsv('apex-carrera2-interlagos.csv', rows)
    pushToast({
      tone: 'success',
      title: 'Clasificación exportada',
      description: 'Se descargó el CSV con el estado actual de la Carrera 2.',
    })
  }

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow={
          <>
            <Badge tone="red" dot>
              Live
            </Badge>
            <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-dim">
              {championship.name} {championship.season} · Ronda {currentEvent.round}
            </span>
          </>
        }
        title="Centro de control"
        description="Estado operativo del fin de semana: sesión en pista, cronometraje oficial, incidencias y verificación técnica."
        actions={
          <>
            <Button variant="secondary" size="sm" onClick={handleExport}>
              <Download className="h-3.5 w-3.5" />
              Exportar CSV
            </Button>
            <Button size="sm" onClick={() => navigate('/live')}>
              <Radio className="h-3.5 w-3.5" />
              Abrir live timing
            </Button>
          </>
        }
      />

      <SessionHero />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Líder del campeonato"
          value={leader.displayName}
          detail={`${leaderRow.points} pts · ${leaderRow.wins} victorias · ${leaderRow.podiums} podios`}
          icon={<Trophy className="h-4 w-4" />}
          accent="accent"
          onClick={() => navigate(`/pilotos/${leader.id}`)}
        />
        <StatCard
          label="Pilotos inscritos"
          value={entries.length}
          detail={`${teams.length} equipos · ${activeDrivers} en pista`}
          icon={<Users className="h-4 w-4" />}
          accent="sky"
          onClick={() => navigate('/pilotos')}
        />
        <StatCard
          label="Vehículos aprobados"
          value={`${approved}/${vehicles.length}`}
          detail={`${pending} pendientes de verificación técnica`}
          icon={<Car className="h-4 w-4" />}
          accent="amber"
          onClick={() => navigate('/garaje')}
        />
        <StatCard
          label="Vuelta rápida en vivo"
          value={formatLap(fastestLapMs)}
          detail={`${fastestDriver.displayName} · ${getTeam(fastestDriver.teamId).shortName}`}
          icon={<Gauge className="h-4 w-4" />}
          accent="purple"
          onClick={() => navigate(`/pilotos/${fastestDriver.id}`)}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          <Card>
            <CardHeader
              title="Clasificación en vivo"
              subtitle="Carrera 2 · 40 vueltas · Interlagos"
              icon={<Radio className="h-4 w-4" />}
              action={
                <Link
                  to="/live"
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-accent hover:underline"
                >
                  Ver completa
                  <ArrowUpRight className="h-3 w-3" />
                </Link>
              }
            />
            <TimingTable
              entries={entries}
              showSectors={false}
              compact
              maxRows={8}
              onSelect={(entry) => navigate(`/pilotos/${entry.driverId}`)}
            />
            <div className="flex items-center justify-between border-t border-line px-4 py-2.5 text-[10px] text-dim">
              <span>Actualización automática cada 2 s</span>
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-accent live-dot" />
                {entries.length} autos clasificados
              </span>
            </div>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader
                title="Próximas sesiones"
                subtitle="Calendario oficial del evento"
                icon={<CalendarClock className="h-4 w-4" />}
              />
              <ol className="divide-y divide-line/70">
                {upcomingSessions.map((session) => (
                  <li key={session.id}>
                    <Link
                      to={`/eventos/${session.eventId}`}
                      className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-surface-2"
                    >
                      <div className="flex h-9 w-11 shrink-0 flex-col items-center justify-center rounded-lg border border-line bg-surface-2">
                        <span className="text-[8px] font-semibold uppercase tracking-wider text-dim">
                          {session.dateLabel.split(' ')[1]}
                        </span>
                        <span className="num font-display text-sm font-bold leading-none text-text">
                          {session.dateLabel.split(' ')[0]}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold text-text">
                          {session.eventName} · {session.name}
                        </p>
                        <p className="text-[10px] text-dim">
                          {session.time} · {session.duration} · Ronda {session.round}
                        </p>
                      </div>
                      {session.status === 'live' ? (
                        <Badge tone="red" dot>
                          En vivo
                        </Badge>
                      ) : (
                        <Badge tone="neutral">{session.type === 'race' ? 'Carrera' : session.type === 'qualifying' ? 'Clasificación' : session.type === 'endurance' ? 'Resistencia' : 'Práctica'}</Badge>
                      )}
                    </Link>
                  </li>
                ))}
              </ol>
            </Card>

            <Card>
              <CardHeader
                title="Top 5 del campeonato"
                subtitle={`${championship.name} · después de R3`}
                icon={<Trophy className="h-4 w-4" />}
                action={
                  <Link to="/clasificacion" className="text-[11px] font-semibold text-accent hover:underline">
                    Tabla completa
                  </Link>
                }
              />
              <ol className="divide-y divide-line/70">
                {standings.slice(0, 5).map((row) => {
                  const driver = getDriver(row.driverId)
                  const team = getTeam(row.teamId)
                  const delta = row.previousPosition - row.position
                  return (
                    <li key={row.driverId}>
                      <Link
                        to={`/pilotos/${driver.id}`}
                        className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-surface-2"
                      >
                        <span className="num w-5 font-display text-base font-semibold text-text">
                          {row.position}
                        </span>
                        <span className="h-7 w-[3px] rounded-full" style={{ backgroundColor: team.color }} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-semibold text-text">{driver.displayName}</p>
                          <p className="truncate text-[10px] text-dim">{team.name}</p>
                        </div>
                        <div className="text-right">
                          <p className="num text-xs font-semibold text-text">{row.points} pts</p>
                          <p
                            className={
                              delta > 0
                                ? 'text-[9px] text-green'
                                : delta < 0
                                  ? 'text-[9px] text-red'
                                  : 'text-[9px] text-dim'
                            }
                          >
                            {delta > 0 ? `▲ ${delta}` : delta < 0 ? `▼ ${Math.abs(delta)}` : '='}
                          </p>
                        </div>
                      </Link>
                    </li>
                  )
                })}
              </ol>
            </Card>
          </div>
        </div>

        <div className="space-y-4">
          <Card className="p-4">
            <RaceControls />
          </Card>

          <LiveFeed items={feed.slice(0, 9)} maxHeight="max-h-[340px]" />

          <Card>
            <CardHeader
              title="Pendientes de control"
              subtitle="Checklist operativo del evento"
              icon={<ClipboardCheck className="h-4 w-4" />}
              action={<Badge tone="amber">{checklistItems.length}</Badge>}
            />
            <ul className="divide-y divide-line/70">
              {checklistItems.map((item) => {
                const Icon = item.icon
                const toneClasses = {
                  amber: 'border-amber/25 bg-amber/10 text-amber',
                  red: 'border-red/25 bg-red/10 text-red',
                  sky: 'border-sky/25 bg-sky/10 text-sky',
                }
                return (
                  <li key={item.title} className="flex items-start gap-3 px-4 py-3">
                    <span
                      className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border ${toneClasses[item.tone]}`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold leading-snug text-text">{item.title}</p>
                      <p className="mt-0.5 text-[10px] leading-relaxed text-muted">{item.detail}</p>
                    </div>
                    <span className="num shrink-0 font-mono text-[10px] text-dim">{item.time}</span>
                  </li>
                )
              })}
            </ul>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="label">Estado del campeonato</p>
                <p className="mt-0.5 text-xs font-semibold text-text">3 de 6 rondas completadas</p>
              </div>
              <CheckCircle2 className="h-4 w-4 text-green" />
            </div>
            <ProgressBar value={3} max={6} className="mt-3" />
            <div className="mt-3 grid grid-cols-2 gap-2 text-[10px]">
              <div className="rounded-lg border border-line bg-surface-2 px-2.5 py-2">
                <p className="text-dim">Próxima ronda</p>
                <p className="mt-0.5 font-semibold text-text">Nürburgring · 19 JUL</p>
              </div>
              <div className="rounded-lg border border-line bg-surface-2 px-2.5 py-2">
                <p className="text-dim">Final de temporada</p>
                <p className="mt-0.5 font-semibold text-text">Barcelona · 06 SEP</p>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between rounded-lg border border-line bg-surface-2 px-2.5 py-2 text-[10px]">
              <span className="text-dim">Líder</span>
              <span className="font-semibold" style={{ color: leaderTeam.color }}>
                {leaderTeam.name} · {leaderRow.points} pts
              </span>
            </div>
          </Card>
        </div>
      </div>

      <p className="pb-2 text-center text-[10px] text-dim">
        Datos de demostración · {formatDateShort('2026-06-14')} · Apex Race Control v1.0
      </p>
    </div>
  )
}
