import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowUpRight,
  Download,
  Flag,
  Gauge,
  Gavel,
  MonitorPlay,
  Radio,
  Search,
  Timer,
  Tv,
  User,
  X,
} from 'lucide-react'
import { currentEvent, currentSession, teams } from '@/data/seed'
import { getCircuit, getDriver, getTeam, getVehicle } from '@/lib/data'
import { can } from '@/lib/permissions'
import { cn, downloadCsv, formatClock, formatGap, formatLap } from '@/lib/utils'
import { useRace } from '@/store/useRace'
import { useSession } from '@/store/useSession'
import { TimingTable } from '@/components/TimingTable'
import { PenaltyDialog } from '@/components/PenaltyDialog'
import { RaceControls, FlagBanner } from '@/components/RaceControls'
import { LiveFeed } from '@/components/LiveFeed'
import {
  Badge,
  Button,
  Card,
  CardHeader,
  Input,
  PageHeader,
  Select,
  StatusPill,
} from '@/components/ui'
import type { LiveEntry } from '@/types'

export function LiveTimingPage() {
  const entries = useRace((state) => state.entries)
  const feed = useRace((state) => state.feed)
  const flag = useRace((state) => state.flag)
  const clockMs = useRace((state) => state.clockMs)
  const currentLap = useRace((state) => state.currentLap)
  const totalLaps = useRace((state) => state.totalLaps)
  const fastestLapMs = useRace((state) => state.fastestLapMs)
  const fastestLapEntryId = useRace((state) => state.fastestLapEntryId)
  const role = useSession((state) => state.role)
  const pushToast = useSession((state) => state.pushToast)
  const showSectors = useSession((state) => state.settings.showSectors)
  const updateSettings = useSession((state) => state.updateSettings)

  const [search, setSearch] = useState('')
  const [teamFilter, setTeamFilter] = useState('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [penaltyOpen, setPenaltyOpen] = useState(false)
  const [tvMode, setTvMode] = useState(false)

  const circuit = getCircuit(currentEvent.circuitId)
  const canPenalize = can(role, 'penalty:write')

  useEffect(() => {
    if (!selectedId && entries.length) setSelectedId(entries[0].id)
  }, [entries, selectedId])

  useEffect(() => {
    if (!tvMode) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setTvMode(false)
    }
    document.addEventListener('keydown', handleKey)
    return () => {
      document.body.style.overflow = previous
      document.removeEventListener('keydown', handleKey)
    }
  }, [tvMode])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return entries.filter((entry) => {
      const driver = getDriver(entry.driverId)
      const team = getTeam(entry.teamId)
      const matchesTeam = teamFilter === 'all' || entry.teamId === teamFilter
      const matchesTerm =
        !term ||
        driver.displayName.toLowerCase().includes(term) ||
        driver.lastName.toLowerCase().includes(term) ||
        String(entry.number).includes(term) ||
        team.name.toLowerCase().includes(term)
      return matchesTeam && matchesTerm
    })
  }, [entries, search, teamFilter])

  const selectedEntry: LiveEntry | undefined =
    entries.find((entry) => entry.id === selectedId) ?? entries[0]
  const selectedDriver = selectedEntry ? getDriver(selectedEntry.driverId) : null
  const selectedTeam = selectedEntry ? getTeam(selectedEntry.teamId) : null
  const selectedVehicle = selectedEntry ? getVehicle(selectedEntry.vehicleId) : null
  const fastestEntry = entries.find((entry) => entry.id === fastestLapEntryId)
  const fastestDriver = fastestEntry ? getDriver(fastestEntry.driverId) : null

  const handleExport = () => {
    const rows: (string | number)[][] = [
      ['Pos', 'N°', 'Piloto', 'Equipo', 'Categoría', 'Vueltas', 'Última', 'Mejor', 'S1', 'S2', 'S3', 'Gap', 'Intervalo', 'Estado'],
      ...entries
        .slice()
        .sort((a, b) => a.position - b.position)
        .map((entry) => {
          const driver = getDriver(entry.driverId)
          return [
            entry.position,
            entry.number,
            driver.displayName,
            getTeam(entry.teamId).name,
            driver.category,
            entry.lapsCompleted,
            formatLap(entry.lastLapMs),
            formatLap(entry.bestLapMs),
            (entry.sectors[0] / 1000).toFixed(3),
            (entry.sectors[1] / 1000).toFixed(3),
            (entry.sectors[2] / 1000).toFixed(3),
            formatGap(entry.gapMs),
            formatGap(entry.intervalMs),
            entry.status,
          ]
        }),
    ]
    downloadCsv('apex-live-timing-carrera2.csv', rows)
    pushToast({
      tone: 'success',
      title: 'Live timing exportado',
      description: 'Archivo CSV generado con todos los datos de la sesión.',
    })
  }

  const openPenalty = () => {
    if (!canPenalize) {
      pushToast({
        tone: 'warning',
        title: 'Permiso insuficiente',
        description: 'Solo comisarios y Dirección de Carrera pueden aplicar sanciones.',
      })
      return
    }
    setPenaltyOpen(true)
  }

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow={
          <>
            <StatusPill tone="red" pulse>
              Live timing
            </StatusPill>
            <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-dim">
              {currentEvent.name} · {currentSession.name}
            </span>
          </>
        }
        title="Cronometraje en vivo"
        description={`${circuit.name} · ${circuit.flag} ${circuit.city} · Vuelta ${currentLap} de ${totalLaps}`}
        actions={
          <>
            <Button variant="secondary" size="sm" onClick={() => setTvMode(true)}>
              <Tv className="h-3.5 w-3.5" />
              Modo TV
            </Button>
            <Button variant="secondary" size="sm" onClick={handleExport}>
              <Download className="h-3.5 w-3.5" />
              Exportar
            </Button>
            <Button size="sm" onClick={openPenalty}>
              <Gavel className="h-3.5 w-3.5" />
              Aplicar sanción
            </Button>
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-4">
        <div className="panel flex items-center gap-3 p-3.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-surface-2 text-dim">
            <Timer className="h-4 w-4" />
          </div>
          <div>
            <p className="label">Reloj oficial</p>
            <p className="num font-mono text-sm font-semibold text-text">{formatClock(clockMs)}</p>
          </div>
        </div>
        <div className="panel flex items-center gap-3 p-3.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-surface-2 text-dim">
            <Flag className="h-4 w-4" />
          </div>
          <div>
            <p className="label">Vuelta actual</p>
            <p className="num font-display text-lg font-semibold leading-none text-text">
              {currentLap}<span className="text-xs text-dim">/{totalLaps}</span>
            </p>
          </div>
        </div>
        <div className="panel flex items-center gap-3 p-3.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-purple/25 bg-purple/10 text-purple">
            <Gauge className="h-4 w-4" />
          </div>
          <div>
            <p className="label">Vuelta rápida</p>
            <p className="num font-mono text-sm font-semibold text-purple">{formatLap(fastestLapMs)}</p>
          </div>
        </div>
        <div className="panel flex items-center gap-3 p-3.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-surface-2 text-dim">
            <Radio className="h-4 w-4" />
          </div>
          <div>
            <p className="label">Autos en pista</p>
            <p className="num font-display text-lg font-semibold leading-none text-text">
              {entries.filter((entry) => entry.status === 'running').length}
              <span className="text-xs text-dim">/{entries.length}</span>
            </p>
          </div>
        </div>
      </div>

      <FlagBanner />

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          <Card className="overflow-hidden">
            <CardHeader
              title="Clasificación de la sesión"
              subtitle={`${filtered.length} de ${entries.length} autos · orden por posición`}
              icon={<Radio className="h-4 w-4" />}
              action={
                <Badge tone={flag === 'red' ? 'red' : flag === 'yellow' || flag === 'safetyCar' ? 'amber' : 'green'} dot>
                  {flag === 'red' ? 'Roja' : flag === 'yellow' ? 'Amarilla' : flag === 'safetyCar' ? 'SC' : flag === 'chequered' ? 'Final' : 'Verde'}
                </Badge>
              }
            />
            <div className="flex flex-col gap-2 border-b border-line px-4 py-3 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-dim" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Buscar piloto, número o equipo…"
                  className="h-9 pl-9 text-xs"
                />
              </div>
              <div className="flex items-center gap-2">
                <Select
                  value={teamFilter}
                  onChange={(event) => setTeamFilter(event.target.value)}
                  className="h-9 w-full text-xs sm:w-44"
                  aria-label="Filtrar por equipo"
                >
                  <option value="all">Todos los equipos</option>
                  {teams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </Select>
                <Button
                  variant={showSectors ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => updateSettings({ showSectors: !showSectors })}
                  className="shrink-0"
                >
                  Sectores
                </Button>
              </div>
            </div>
            <TimingTable
              entries={filtered}
              showSectors={showSectors}
              onSelect={(entry) => setSelectedId(entry.id)}
              selectedId={selectedEntry?.id ?? null}
            />
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-4 py-2.5 text-[10px] text-dim">
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-accent live-dot" />
                Datos oficiales AMB · actualización cada 2 s
              </span>
              <span className="num font-mono">Última sincronización {formatClock(clockMs)}</span>
            </div>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader title="Control de sesión" subtitle="Banderas y estado" icon={<Flag className="h-4 w-4" />} />
              <div className="p-4">
                <RaceControls />
              </div>
            </Card>
            <LiveFeed items={feed.slice(0, 12)} maxHeight="max-h-[340px]" />
          </div>
        </div>

        <div className="space-y-4">
          {selectedEntry && selectedDriver && selectedTeam ? (
            <Card>
              <div className="flex items-start justify-between border-b border-line px-4 py-3.5">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted" />
                  <div>
                    <p className="text-sm font-semibold text-text">Detalle del piloto</p>
                    <p className="text-[10px] text-dim">Selecciona una fila para inspeccionar</p>
                  </div>
                </div>
                <Badge tone="neutral">P{selectedEntry.position}</Badge>
              </div>

              <div className="p-4">
                <div className="flex items-center gap-3">
                  <span
                    className="num flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border font-display text-xl font-bold"
                    style={{
                      color: selectedTeam.color,
                      borderColor: `${selectedTeam.color}55`,
                      backgroundColor: `${selectedTeam.color}14`,
                    }}
                  >
                    {selectedEntry.number}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-display text-xl font-semibold leading-tight text-text">
                      {selectedDriver.displayName}
                    </p>
                    <p className="truncate text-[11px] text-muted">
                      {selectedTeam.name} · {selectedDriver.category}
                    </p>
                  </div>
                  <span className="text-lg">{selectedDriver.flag}</span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <div className="rounded-lg border border-line bg-surface-2 px-2.5 py-2">
                    <p className="label">Posición</p>
                    <p className="num mt-0.5 font-display text-lg font-semibold leading-none text-text">
                      {selectedEntry.position}
                      <span className="text-[10px] text-dim"> / {entries.length}</span>
                    </p>
                  </div>
                  <div className="rounded-lg border border-line bg-surface-2 px-2.5 py-2">
                    <p className="label">Gap líder</p>
                    <p className="num mt-0.5 font-mono text-sm font-semibold leading-none text-text">
                      {selectedEntry.position === 1 ? 'LÍDER' : formatGap(selectedEntry.gapMs)}
                    </p>
                  </div>
                  <div className="rounded-lg border border-line bg-surface-2 px-2.5 py-2">
                    <p className="label">Mejor vuelta</p>
                    <p
                      className={cn(
                        'num mt-0.5 font-mono text-sm font-semibold leading-none',
                        selectedEntry.hasFastestLap ? 'text-purple' : 'text-text',
                      )}
                    >
                      {formatLap(selectedEntry.bestLapMs)}
                    </p>
                  </div>
                  <div className="rounded-lg border border-line bg-surface-2 px-2.5 py-2">
                    <p className="label">Vueltas</p>
                    <p className="num mt-0.5 font-display text-lg font-semibold leading-none text-text">
                      {selectedEntry.lapsCompleted}
                    </p>
                  </div>
                </div>

                <div className="mt-4">
                  <p className="label mb-2">Últimas vueltas</p>
                  <div className="overflow-hidden rounded-lg border border-line">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-line bg-surface-2 text-[9px] uppercase tracking-wider text-dim">
                          <th className="px-2 py-1.5 font-medium">V</th>
                          <th className="px-2 py-1.5 font-medium">Tiempo</th>
                          <th className="px-2 py-1.5 text-center font-medium">S1</th>
                          <th className="px-2 py-1.5 text-center font-medium">S2</th>
                          <th className="px-2 py-1.5 text-center font-medium">S3</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedEntry.recentLaps
                          .slice(-5)
                          .reverse()
                          .map((lap) => (
                            <tr key={lap.lap} className="border-b border-line/60 last:border-0">
                              <td className="num px-2 py-1.5 font-mono text-[10px] text-muted">{lap.lap}</td>
                              <td className="num px-2 py-1.5 font-mono text-[10px] font-medium text-text">
                                {formatLap(lap.timeMs)}
                              </td>
                              {lap.sectors.map((sector, index) => (
                                <td key={index} className="num px-2 py-1.5 text-center font-mono text-[10px] text-muted">
                                  {(sector / 1000).toFixed(3)}
                                </td>
                              ))}
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {selectedEntry.penaltyMs > 0 ? (
                  <div className="mt-3 flex items-center justify-between rounded-lg border border-amber/25 bg-amber/10 px-3 py-2">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-amber">Sanción acumulada</span>
                    <span className="num font-mono text-xs font-semibold text-amber">
                      +{(selectedEntry.penaltyMs / 1000).toFixed(0)} s
                    </span>
                  </div>
                ) : null}

                <div className="mt-4 space-y-2">
                  <p className="label">Vehículo</p>
                  <p className="text-xs text-muted">
                    {selectedVehicle?.make} {selectedVehicle?.model} · #{selectedVehicle?.number}
                  </p>
                  <div className="flex gap-2 pt-1">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="flex-1"
                      onClick={openPenalty}
                      disabled={!canPenalize}
                    >
                      <Gavel className="h-3.5 w-3.5" />
                      Sancionar
                    </Button>
                    <Link to={`/pilotos/${selectedDriver.id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        Perfil
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </Card>
          ) : null}

          <Card className="p-4">
            <div className="flex items-center gap-2">
              <Gauge className="h-4 w-4 text-purple" />
              <p className="text-sm font-semibold text-text">Récord de vuelta</p>
            </div>
            <p className="num mt-3 font-mono text-2xl font-semibold text-purple">{formatLap(fastestLapMs)}</p>
            <p className="mt-1 text-[11px] text-muted">
              {fastestDriver?.displayName ?? '—'} · {fastestDriver ? getTeam(fastestDriver.teamId).name : '—'}
            </p>
            <div className="mt-3 border-t border-line pt-3 text-[10px] text-dim">
              <p className="flex justify-between">
                <span>Récord absoluto del circuito</span>
                <span className="num font-mono text-muted">{circuit.record}</span>
              </p>
              <p className="mt-1 flex justify-between">
                <span>Poseedor</span>
                <span className="text-muted">{circuit.recordHolder}</span>
              </p>
            </div>
          </Card>
        </div>
      </div>

      <PenaltyDialog
        open={penaltyOpen}
        onClose={() => setPenaltyOpen(false)}
        initialEntryId={selectedEntry?.id}
      />

      {tvMode ? (
        <div className="fixed inset-0 z-[90] overflow-y-auto bg-bg p-3 sm:p-6">
          <div className="mx-auto max-w-[1500px]">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-surface px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-accent/25 bg-accent/10">
                  <MonitorPlay className="h-4 w-4 text-accent" />
                </div>
                <div>
                  <p className="font-display text-lg font-semibold uppercase leading-none tracking-wide text-text">
                    {currentEvent.name}
                  </p>
                  <p className="mt-0.5 text-[10px] uppercase tracking-widest text-dim">
                    {currentSession.name} · Modo TV · {circuit.city}
                  </p>
                </div>
                <Badge tone="red" dot>
                  Live
                </Badge>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="num font-mono text-lg font-semibold text-text">{formatClock(clockMs)}</p>
                  <p className="text-[10px] uppercase tracking-wider text-dim">
                    Vuelta {currentLap}/{totalLaps}
                  </p>
                </div>
                <Button variant="secondary" size="sm" onClick={() => setTvMode(false)}>
                  <X className="h-3.5 w-3.5" />
                  Salir
                </Button>
              </div>
            </div>

            <Card className="overflow-hidden">
              <div className="flex items-center justify-between border-b border-line px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-red live-dot" />
                  <span className="font-display text-sm font-semibold uppercase tracking-wider text-text">
                    Clasificación en vivo
                  </span>
                </div>
                <span className="num font-mono text-[10px] text-dim">
                  Vuelta rápida {formatLap(fastestLapMs)} · {fastestDriver?.displayName ?? '—'}
                </span>
              </div>
              <TimingTable entries={entries.slice(0, 10)} showSectors />
            </Card>

            <div className="mt-3">
              <FlagBanner />
            </div>
            <p className="mt-3 text-center text-[10px] uppercase tracking-[0.2em] text-dim">
              Apex Race Control · Señal oficial de cronometraje
            </p>
          </div>
        </div>
      ) : null}
    </div>
  )
}
