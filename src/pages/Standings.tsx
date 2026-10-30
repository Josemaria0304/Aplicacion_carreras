import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Download, Search, ShieldCheck, Trophy, Users } from 'lucide-react'
import { getDriver, getTeam, pointsByRound } from '@/lib/data'
import { can } from '@/lib/permissions'
import { cn, downloadCsv, formatGap } from '@/lib/utils'
import { useCompetition } from '@/store/useCompetition'
import { useSession } from '@/store/useSession'
import {
  Badge,
  Button,
  Card,
  CardHeader,
  EmptyState,
  Input,
  PageHeader,
  ProgressBar,
  StatCard,
  Tabs,
} from '@/components/ui'
import type { RaceResult } from '@/types'

const roundLabels = ['R1', 'R2', 'R3', 'R4']

function ResultChip({ result }: { result: RaceResult }) {
  const numeric = typeof result === 'number'
  return (
    <span
      className={cn(
        'num inline-flex h-6 min-w-7 items-center justify-center rounded border px-1 text-[10px] font-bold',
        !numeric
          ? 'border-red/30 bg-red/10 text-red'
          : result === 1
            ? 'border-accent/40 bg-accent/15 text-accent'
            : result <= 3
              ? 'border-sky/30 bg-sky/10 text-sky'
              : 'border-line bg-surface-2 text-muted',
      )}
    >
      {numeric ? `P${result}` : result}
    </span>
  )
}

export function StandingsPage() {
  const role = useSession((state) => state.role)
  const pushToast = useSession((state) => state.pushToast)
  const standings = useCompetition((state) => state.standings)
  const teamStandings = useCompetition((state) => state.teamStandings)
  const championships = useCompetition((state) => state.championships)
  const championship = championships[0]
  const [tab, setTab] = useState('drivers')
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return standings
    return standings.filter((row) => {
      const driver = getDriver(row.driverId)
      const team = getTeam(row.teamId)
      return (
        driver.displayName.toLowerCase().includes(term) ||
        driver.firstName.toLowerCase().includes(term) ||
        driver.lastName.toLowerCase().includes(term) ||
        team.name.toLowerCase().includes(term) ||
        driver.nationality.toLowerCase().includes(term)
      )
    })
  }, [search])

  const leader = standings[0]
  const chartData = standings.slice(0, 10).map((row) => {
    const driver = getDriver(row.driverId)
    const team = getTeam(row.teamId)
    return {
      name: driver.displayName,
      short: driver.displayName.split(' ')[1] ?? driver.displayName,
      points: row.points,
      color: team.color,
    }
  })

  const handleExport = () => {
    const rows: (string | number)[][] = [
      ['Pos', 'Piloto', 'Equipo', 'Categoría', 'Victorias', 'Podios', 'Poles', 'Vueltas rápidas', 'Puntos', 'R1', 'R2', 'R3', 'R4'],
      ...standings.map((row) => {
        const driver = getDriver(row.driverId)
        const team = getTeam(row.teamId)
        return [
          row.position,
          driver.displayName,
          team.name,
          driver.category,
          row.wins,
          row.podiums,
          row.poles,
          row.fastestLaps,
          row.points,
          ...row.results.map((result) => String(result)),
        ]
      }),
    ]
    downloadCsv('apex-clasificacion-gt-series-2026.csv', rows)
    pushToast({
      tone: 'success',
      title: 'Clasificación exportada',
      description: 'El CSV incluye pilotos, equipos y resultados por ronda.',
    })
  }

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow={
          <Badge tone="accent">
            <Trophy className="h-3 w-3" />
            {championship.name} · {championship.season}
          </Badge>
        }
        title="Clasificación"
        description="Puntos oficiales tras cuatro rondas disputadas. La vuelta rápida suma un punto adicional cuando el piloto termina entre los diez primeros."
        actions={
          <>
            <Button variant="secondary" size="sm" onClick={handleExport}>
              <Download className="h-3.5 w-3.5" />
              Exportar
            </Button>
            <Link to="/campeonatos">
              <Button size="sm">Ver calendario</Button>
            </Link>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Líder del campeonato"
          value={getDriver(leader.driverId).displayName}
          detail={`${leader.points} pts · ${leader.wins} victorias`}
          icon={<Trophy className="h-4 w-4" />}
          accent="accent"
        />
        <StatCard
          label="Ventaja del líder"
          value={`${leader.points - standings[1].points} pts`}
          detail={`Sobre ${getDriver(standings[1].driverId).displayName}`}
          icon={<Trophy className="h-4 w-4" />}
          accent="sky"
        />
        <StatCard
          label="Pilotos con puntos"
          value={standings.filter((row) => row.points > 0).length}
          detail={`De ${drivers.length} inscritos`}
          icon={<Users className="h-4 w-4" />}
          accent="purple"
        />
        <StatCard
          label="Equipos en lucha"
          value={teams.length}
          detail={`${teamStandings[0].points} pts el primero`}
          icon={<ShieldCheck className="h-4 w-4" />}
          accent="amber"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {standings.slice(0, 3).map((row, index) => {
          const driver = getDriver(row.driverId)
          const team = getTeam(row.teamId)
          return (
            <Link
              key={row.driverId}
              to={`/pilotos/${driver.id}`}
              className={cn(
                'panel panel-hover relative overflow-hidden p-4',
                index === 0 && 'border-accent/25 glow-accent',
              )}
            >
              <span
                className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-[0.12] blur-2xl"
                style={{ backgroundColor: team.color }}
              />
              <div className="flex items-center justify-between">
                <Badge tone={index === 0 ? 'accent' : index === 1 ? 'sky' : 'amber'}>
                  {index === 0 ? 'Líder' : `P${index + 1}`}
                </Badge>
                <span className="text-xl">{driver.flag}</span>
              </div>
              <p className="mt-3 font-display text-2xl font-semibold uppercase leading-none text-text">
                {driver.displayName}
              </p>
              <p className="mt-1 truncate text-[11px] text-muted">{team.name}</p>
              <div className="mt-3 flex items-end justify-between border-t border-line/70 pt-3">
                <div>
                  <p className="num font-display text-3xl font-bold leading-none text-text">{row.points}</p>
                  <p className="text-[9px] uppercase tracking-widest text-dim">puntos</p>
                </div>
                <div className="text-right text-[10px] text-muted">
                  <p>{row.wins} victorias</p>
                  <p>{row.podiums} podios</p>
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      <Tabs
        value={tab}
        onChange={setTab}
        items={[
          { id: 'drivers', label: 'Pilotos', count: standings.length },
          { id: 'teams', label: 'Equipos', count: teamStandings.length },
        ]}
      />

      {tab === 'drivers' ? (
        <div className="space-y-4">
          <Card>
            <CardHeader
              title="Puntos por piloto"
              subtitle="Top 10 de la clasificación general"
              icon={<Trophy className="h-4 w-4" />}
              action={<Badge tone="neutral">R1 – R4</Badge>}
            />
            <div className="h-[260px] px-2 py-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 8, right: 16, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 6" stroke="#252C36" vertical={false} />
                  <XAxis
                    dataKey="short"
                    tick={{ fill: '#6B7585', fontSize: 10 }}
                    axisLine={{ stroke: '#252C36' }}
                    tickLine={false}
                    interval={0}
                    angle={-18}
                    height={48}
                    textAnchor="end"
                  />
                  <YAxis tick={{ fill: '#6B7585', fontSize: 10 }} axisLine={false} tickLine={false} width={40} />
                  <Tooltip
                    cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                    contentStyle={{
                      background: '#0F1217',
                      border: '1px solid #252C36',
                      borderRadius: 12,
                      fontSize: 12,
                    }}
                    formatter={(value) => [`${value} pts`, 'Puntos']}
                  />
                  <Bar dataKey="points" radius={[4, 4, 0, 0]}>
                    {chartData.map((item) => (
                      <Cell key={item.name} fill={item.color} fillOpacity={0.85} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card>
            <CardHeader
              title="Clasificación de pilotos"
              subtitle={`${filtered.length} pilotos · después de la ronda 4`}
              icon={<Users className="h-4 w-4" />}
              action={
                <div className="relative w-44 sm:w-60">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-dim" />
                  <Input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Buscar piloto…"
                    className="h-8 pl-8 text-xs"
                  />
                </div>
              }
            />
            {filtered.length === 0 ? (
              <EmptyState title="Sin resultados" description="Prueba con otro nombre o equipo." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] text-left">
                  <thead>
                    <tr className="border-b border-line text-[9px] uppercase tracking-[0.16em] text-dim">
                      <th className="w-14 px-4 py-2 font-semibold">Pos</th>
                      <th className="px-3 py-2 font-semibold">Piloto</th>
                      <th className="px-3 py-2 font-semibold">Equipo</th>
                      <th className="w-14 px-2 py-2 text-center font-semibold">Vic</th>
                      <th className="w-14 px-2 py-2 text-center font-semibold">Pod</th>
                      <th className="w-14 px-2 py-2 text-center font-semibold">Pole</th>
                      <th className="w-14 px-2 py-2 text-center font-semibold">VL</th>
                      <th className="px-3 py-2 text-center font-semibold">Rondas</th>
                      <th className="w-20 px-3 py-2 text-right font-semibold">Gap</th>
                      <th className="w-20 px-4 py-2 text-right font-semibold">Puntos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((row) => {
                      const driver = getDriver(row.driverId)
                      const team = getTeam(row.teamId)
                      const delta = row.previousPosition - row.position
                      const gap = leader.points - row.points
                      return (
                        <tr key={row.driverId} className="border-b border-line/60 transition-colors last:border-0 hover:bg-surface-2/50">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5">
                              <span className="num font-display text-base font-semibold text-text">{row.position}</span>
                              <span
                                className={cn(
                                  'text-[9px]',
                                  delta > 0 ? 'text-green' : delta < 0 ? 'text-red' : 'text-dim',
                                )}
                              >
                                {delta > 0 ? `▲${delta}` : delta < 0 ? `▼${Math.abs(delta)}` : '='}
                              </span>
                            </div>
                          </td>
                          <td className="px-3 py-3">
                            <Link to={`/pilotos/${driver.id}`} className="group flex items-center gap-2.5">
                              <span className="h-7 w-[3px] rounded-full" style={{ backgroundColor: team.color }} />
                              <div className="min-w-0">
                                <p className="truncate text-xs font-semibold text-text group-hover:text-accent">
                                  {driver.displayName}
                                </p>
                                <p className="text-[10px] text-dim">
                                  {driver.flag} {driver.category}
                                </p>
                              </div>
                            </Link>
                          </td>
                          <td className="px-3 py-3 text-[11px] text-muted">{team.name}</td>
                          <td className="num px-2 py-3 text-center text-xs text-text">{row.wins}</td>
                          <td className="num px-2 py-3 text-center text-xs text-text">{row.podiums}</td>
                          <td className="num px-2 py-3 text-center text-xs text-muted">{row.poles}</td>
                          <td className="num px-2 py-3 text-center text-xs text-purple">{row.fastestLaps}</td>
                          <td className="px-3 py-3">
                            <div className="flex items-center justify-center gap-1">
                              {row.results.map((result, index) => (
                                <span key={index} title={`${roundLabels[index]} · ${result} · ${pointsByRound(driver)[index]} pts`}>
                                  <ResultChip result={result} />
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="num px-3 py-3 text-right font-mono text-[11px] text-muted">
                            {row.position === 1 ? '—' : formatGap(-gap * 1000).replace('−', '-')}
                          </td>
                          <td className="num px-4 py-3 text-right">
                            <span className="font-display text-base font-semibold text-text">{row.points}</span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-4 py-2.5 text-[10px] text-dim">
              <span>Desempate: victorias, podios y poles.</span>
              <span className="flex items-center gap-3">
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-accent" /> Victoria</span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-red" /> DNF</span>
              </span>
            </div>
          </Card>
        </div>
      ) : null}

      {tab === 'teams' ? (
        <div className="grid gap-4 xl:grid-cols-3">
          <Card className="xl:col-span-2">
            <CardHeader
              title="Clasificación de equipos"
              subtitle="Suma de los puntos de sus pilotos"
              icon={<ShieldCheck className="h-4 w-4" />}
            />
            <div className="divide-y divide-line/70">
              {teamStandings.map((row) => {
                const team = getTeam(row.teamId)
                const teamDrivers = drivers.filter((driver) => driver.teamId === team.id)
                const max = teamStandings[0].points
                return (
                  <div key={team.id} className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="num w-6 font-display text-lg font-semibold text-text">{row.position}</span>
                      <span className="h-8 w-[3px] rounded-full" style={{ backgroundColor: team.color }} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold text-text">{team.name}</p>
                        <p className="truncate text-[10px] text-dim">
                          {teamDrivers.map((driver) => driver.displayName).join(' · ')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="num font-display text-lg font-semibold text-text">{row.points}</p>
                        <p className="text-[9px] uppercase tracking-wider text-dim">puntos</p>
                      </div>
                    </div>
                    <div className="mt-2 ml-9">
                      <ProgressBar value={row.points} max={max} />
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>

          <div className="space-y-4">
            <Card>
              <CardHeader title="Resumen de equipos" icon={<Users className="h-4 w-4" />} />
              <div className="divide-y divide-line/70">
                <div className="flex items-center justify-between px-4 py-2.5">
                  <span className="text-[11px] text-muted">Equipos inscritos</span>
                  <span className="num text-xs font-semibold text-text">{teams.length}</span>
                </div>
                <div className="flex items-center justify-between px-4 py-2.5">
                  <span className="text-[11px] text-muted">Pilotos por equipo</span>
                  <span className="num text-xs font-semibold text-text">2</span>
                </div>
                <div className="flex items-center justify-between px-4 py-2.5">
                  <span className="text-[11px] text-muted">Mayor puntuación</span>
                  <span className="text-xs font-semibold" style={{ color: getTeam(teamStandings[0].teamId).color }}>
                    {getTeam(teamStandings[0].teamId).name}
                  </span>
                </div>
                <div className="flex items-center justify-between px-4 py-2.5">
                  <span className="text-[11px] text-muted">Ventaja</span>
                  <span className="num text-xs font-semibold text-text">
                    {teamStandings[0].points - teamStandings[1].points} pts
                  </span>
                </div>
              </div>
            </Card>

            <Card>
              <CardHeader title="Permisos de publicación" icon={<ShieldCheck className="h-4 w-4" />} />
              <div className="p-4">
                <p className="text-[11px] leading-relaxed text-muted">
                  {can(role, 'results:publish')
                    ? 'Tu rol puede publicar resultados oficiales al finalizar cada sesión.'
                    : 'Solo organización y dirección pueden publicar resultados oficiales. Esta vista es de consulta.'}
                </p>
                <Badge tone={can(role, 'results:publish') ? 'green' : 'neutral'} className="mt-3">
                  {can(role, 'results:publish') ? 'Publicación habilitada' : 'Solo lectura'}
                </Badge>
              </div>
            </Card>

            <Card className="p-4">
              <p className="label">Leyenda</p>
              <ul className="mt-2 space-y-1.5 text-[10px] text-muted">
                <li className="flex items-center gap-2"><ResultChip result={1} /> Victoria</li>
                <li className="flex items-center gap-2"><ResultChip result={3} /> Podio</li>
                <li className="flex items-center gap-2"><ResultChip result={9} /> Zona de puntos</li>
                <li className="flex items-center gap-2"><ResultChip result="DNF" /> Abandono</li>
              </ul>
            </Card>
          </div>
        </div>
      ) : null}
    </div>
  )
}
