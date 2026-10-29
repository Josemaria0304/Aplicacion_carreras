import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, Filter, Search, ShieldCheck, Trophy, Users } from 'lucide-react'
import { standings, teams } from '@/data/seed'
import { getDriver, getTeam, getVehicle } from '@/lib/data'
import { cn } from '@/lib/utils'
import { useSession } from '@/store/useSession'
import {
  Badge,
  Card,
  EmptyState,
  Input,
  PageHeader,
  Select,
  StatCard,
} from '@/components/ui'

const categories = ['Todas', 'GT3 Pro', 'GT3 Pro-Am', 'GT4'] as const
type CategoryFilter = (typeof categories)[number]

type SortKey = 'position' | 'points' | 'name' | 'number'

export function DriversPage() {
  const pushToast = useSession((state) => state.pushToast)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<CategoryFilter>('Todas')
  const [teamFilter, setTeamFilter] = useState('all')
  const [sort, setSort] = useState<SortKey>('position')

  const ranked = useMemo(
    () =>
      standings.map((row) => ({
        row,
        driver: getDriver(row.driverId),
        team: getTeam(row.teamId),
        vehicle: getVehicle(getDriver(row.driverId).vehicleId),
      })),
    [],
  )

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    const list = ranked.filter(({ driver, team }) => {
      const matchesCategory = category === 'Todas' || driver.category === category
      const matchesTeam = teamFilter === 'all' || driver.teamId === teamFilter
      const matchesTerm =
        !term ||
        driver.displayName.toLowerCase().includes(term) ||
        driver.firstName.toLowerCase().includes(term) ||
        driver.lastName.toLowerCase().includes(term) ||
        String(driver.number).includes(term) ||
        driver.nationality.toLowerCase().includes(term) ||
        team.name.toLowerCase().includes(term)
      return matchesCategory && matchesTeam && matchesTerm
    })

    return list.sort((a, b) => {
      if (sort === 'points') return b.row.points - a.row.points
      if (sort === 'name') return a.driver.lastName.localeCompare(b.driver.lastName)
      if (sort === 'number') return a.driver.number - b.driver.number
      return a.row.position - b.row.position
    })
  }, [ranked, search, category, teamFilter, sort])

  const totalPoints = ranked.reduce((sum, item) => sum + item.row.points, 0)

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow={
          <Badge tone="accent">
            <Users className="h-3 w-3" />
            Parrilla GT Series 2026
          </Badge>
        }
        title="Pilotos"
        description="Fichas deportivas, licencias, equipos y resultados de los 14 pilotos inscritos en el campeonato."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Pilotos inscritos" value={ranked.length} icon={<Users className="h-4 w-4" />} accent="accent" />
        <StatCard
          label="Equipos representados"
          value={new Set(ranked.map((item) => item.driver.teamId)).size}
          icon={<ShieldCheck className="h-4 w-4" />}
          accent="sky"
          detail={`${teams.length} estructuras en total`}
        />
        <StatCard
          label="Puntos repartidos"
          value={totalPoints}
          icon={<Trophy className="h-4 w-4" />}
          accent="purple"
          detail="Después de 4 rondas"
        />
        <StatCard
          label="Categorías activas"
          value={3}
          icon={<Filter className="h-4 w-4" />}
          accent="amber"
          detail="GT3 Pro · Pro-Am · GT4"
        />
      </div>

      <Card className="p-3.5">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-dim" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por nombre, número, nacionalidad o equipo…"
              className="pl-9"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map((item) => (
              <button
                key={item}
                onClick={() => setCategory(item)}
                className={cn(
                  'h-10 rounded-lg border px-3 text-xs font-medium transition-colors',
                  category === item
                    ? 'border-accent/40 bg-accent/10 text-accent'
                    : 'border-line bg-surface-2 text-muted hover:text-text',
                )}
              >
                {item}
              </button>
            ))}
            <Select
              value={teamFilter}
              onChange={(event) => setTeamFilter(event.target.value)}
              className="w-40 text-xs"
              aria-label="Filtrar por equipo"
            >
              <option value="all">Todos los equipos</option>
              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </Select>
            <Select
              value={sort}
              onChange={(event) => setSort(event.target.value as SortKey)}
              className="w-36 text-xs"
              aria-label="Ordenar pilotos"
            >
              <option value="position">Por posición</option>
              <option value="points">Por puntos</option>
              <option value="name">Por apellido</option>
              <option value="number">Por número</option>
            </Select>
          </div>
        </div>
      </Card>

      {filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Search className="h-5 w-5" />}
            title="Sin pilotos que coincidan"
            description="Prueba con otro nombre, categoría o equipo."
          />
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {filtered.map(({ row, driver, team, vehicle }) => (
            <Link
              key={driver.id}
              to={`/pilotos/${driver.id}`}
              className="panel panel-hover group relative overflow-hidden p-4"
            >
              <span
                className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-[0.07] blur-2xl"
                style={{ backgroundColor: team.color }}
              />
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className="num flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-surface-2 font-display text-sm font-bold text-muted">
                    {row.position}
                  </span>
                  <Badge tone="neutral">{driver.category}</Badge>
                </div>
                <span className="text-xl" title={driver.nationality}>
                  {driver.flag}
                </span>
              </div>

              <div className="mt-3 flex items-end justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-display text-xl font-semibold uppercase leading-none tracking-tight text-text">
                    {driver.firstName} <span className="text-accent">{driver.lastName}</span>
                  </p>
                  <p className="mt-1 truncate text-[11px] text-muted">{team.name}</p>
                </div>
                <span
                  className="num shrink-0 font-display text-3xl font-bold leading-none"
                  style={{ color: team.color }}
                >
                  {String(driver.number).padStart(2, '0')}
                </span>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2 border-t border-line/70 pt-3">
                <div>
                  <p className="text-[9px] uppercase tracking-wider text-dim">Puntos</p>
                  <p className="num font-display text-base font-semibold text-text">{row.points}</p>
                </div>
                <div>
                  <p className="text-[9px] uppercase tracking-wider text-dim">Victorias</p>
                  <p className="num font-display text-base font-semibold text-text">{row.wins}</p>
                </div>
                <div>
                  <p className="text-[9px] uppercase tracking-wider text-dim">Podios</p>
                  <p className="num font-display text-base font-semibold text-text">{row.podiums}</p>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between gap-2">
                <p className="truncate text-[10px] text-dim">
                  {vehicle.make} {vehicle.model} · #{vehicle.number}
                </p>
                <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-dim transition-colors group-hover:text-accent" />
              </div>
            </Link>
          ))}
        </div>
      )}

      <Card className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="label">Nota del comisario técnico</p>
            <p className="mt-1 max-w-3xl text-xs leading-relaxed text-muted">
              Las fichas de piloto son públicas para organización, prensa y equipos. Los datos médicos
              y de contacto de emergencia solo son visibles para roles con permiso de asistencia.
            </p>
          </div>
          <button
            onClick={() =>
              pushToast({
                tone: 'info',
                title: 'Vista de prensa',
                description: 'Los datos médicos permanecen ocultos para este perfil.',
              })
            }
            className="text-[11px] font-semibold text-accent hover:underline"
          >
            Ver política de datos
          </button>
        </div>
      </Card>
    </div>
  )
}
