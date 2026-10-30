import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowUpRight,
  Filter,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  Trophy,
  UserPlus,
  Users,
} from 'lucide-react'
import { getDriver, getTeam, getVehicle } from '@/lib/data'
import { cn } from '@/lib/utils'
import { useCompetition } from '@/store/useCompetition'
import { useSession } from '@/store/useSession'
import { ConfirmDeleteModal } from '@/components/ConfirmDeleteModal'
import { DriverModal } from '@/components/DriverModal'
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Input,
  PageHeader,
  Select,
  StatCard,
} from '@/components/ui'
import type { Driver } from '@/types'

const categories = ['Todas', 'GT3 Pro', 'GT3 Pro-Am', 'GT4'] as const
type CategoryFilter = (typeof categories)[number]

type SortKey = 'position' | 'points' | 'name' | 'number'

export function DriversPage() {
  const pushToast = useSession((state) => state.pushToast)
  const drivers = useCompetition((state) => state.drivers)
  const teams = useCompetition((state) => state.teams)
  const standings = useCompetition((state) => state.standings)
  const deleteDriver = useCompetition((state) => state.deleteDriver)

  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<CategoryFilter>('Todas')
  const [teamFilter, setTeamFilter] = useState('all')
  const [sort, setSort] = useState<SortKey>('position')

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null)
  const [deletingDriver, setDeletingDriver] = useState<Driver | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const ranked = useMemo(() => {
    return drivers.map((driver) => {
      const row =
        standings.find((s) => s.driverId === driver.id) ?? {
          position: 99,
          driverId: driver.id,
          teamId: driver.teamId,
          points: 0,
          diff: 0,
          wins: 0,
          podiums: 0,
          fastestLaps: 0,
          trend: 'equal' as const,
        }
      const team = getTeam(driver.teamId)
      const vehicle = getVehicle(driver.vehicleId)
      return {
        row,
        driver,
        team,
        vehicle,
      }
    })
  }, [drivers, standings])

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

  const handleOpenCreate = () => {
    setEditingDriver(null)
    setIsModalOpen(true)
  }

  const handleOpenEdit = (e: React.MouseEvent, driver: Driver) => {
    e.preventDefault()
    e.stopPropagation()
    setEditingDriver(driver)
    setIsModalOpen(true)
  }

  const handleOpenDelete = (e: React.MouseEvent, driver: Driver) => {
    e.preventDefault()
    e.stopPropagation()
    setDeletingDriver(driver)
  }

  const handleConfirmDelete = async () => {
    if (!deletingDriver) return
    setIsDeleting(true)
    try {
      await deleteDriver(deletingDriver.id)
      pushToast({
        tone: 'success',
        title: 'Piloto eliminado',
        description: `El piloto ${deletingDriver.displayName} ha sido retirado de la parrilla.`,
      })
      setDeletingDriver(null)
    } catch {
      pushToast({
        tone: 'error',
        title: 'Error al eliminar',
        description: 'No se pudo completar la eliminación del piloto.',
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleModalSuccess = (savedDriver: Driver) => {
    pushToast({
      tone: 'success',
      title: editingDriver ? 'Piloto actualizado' : 'Piloto inscrito',
      description: `${savedDriver.displayName} (${savedDriver.category}) guardado exitosamente.`,
    })
  }

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow={
          <Badge tone="accent">
            <Users className="h-3 w-3" />
            Parrilla GT Series 2026
          </Badge>
        }
        title="Pilotos y Corredores"
        description="Fichas deportivas, licencias, equipos y gestión integral de pilotos inscritos en el campeonato."
        actions={
          <Button size="sm" onClick={handleOpenCreate}>
            <UserPlus className="h-3.5 w-3.5" />
            Inscribir Piloto
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Pilotos inscritos" value={drivers.length} icon={<Users className="h-4 w-4" />} accent="accent" />
        <StatCard
          label="Equipos representados"
          value={new Set(drivers.map((d) => d.teamId)).size}
          icon={<ShieldCheck className="h-4 w-4" />}
          accent="sky"
          detail={`${teams.length} estructuras en total`}
        />
        <StatCard
          label="Puntos repartidos"
          value={totalPoints}
          icon={<Trophy className="h-4 w-4" />}
          accent="purple"
          detail="En el campeonato activo"
        />
        <StatCard
          label="Categorías activas"
          value={new Set(drivers.map((d) => d.category)).size}
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
            description="No se encontraron pilotos con los filtros seleccionados."
            action={
              <Button size="sm" onClick={handleOpenCreate}>
                <Plus className="h-4 w-4" />
                Inscribir Nuevo Piloto
              </Button>
            }
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
                <div className="flex items-center gap-2">
                  <span className="text-xl" title={driver.nationality}>
                    {driver.flag}
                  </span>
                  {/* Action buttons */}
                  <div className="flex items-center gap-1 opacity-75 transition-opacity group-hover:opacity-100">
                    <button
                      onClick={(e) => handleOpenEdit(e, driver)}
                      className="rounded-md border border-line bg-surface-2 p-1.5 text-muted transition-colors hover:border-accent/50 hover:bg-surface-3 hover:text-accent"
                      title="Modificar piloto"
                      aria-label="Modificar piloto"
                    >
                      <Pencil className="h-3 w-3" />
                    </button>
                    <button
                      onClick={(e) => handleOpenDelete(e, driver)}
                      className="rounded-md border border-line bg-surface-2 p-1.5 text-muted transition-colors hover:border-red/40 hover:bg-red/10 hover:text-red"
                      title="Eliminar piloto"
                      aria-label="Eliminar piloto"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
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
            <p className="label">Administración de Parrilla</p>
            <p className="mt-1 max-w-3xl text-xs leading-relaxed text-muted">
              Puedes agregar nuevos corredores, actualizar sus datos biométricos, modificar asignaciones
              de equipo o chasis, y eliminar pilotos. Los cambios se sincronizan en memoria, localStorage y en MySQL.
            </p>
          </div>
          <Button size="sm" variant="secondary" onClick={handleOpenCreate}>
            <Plus className="h-3.5 w-3.5" />
            Nuevo Registro
          </Button>
        </div>
      </Card>

      {/* Modal para Insertar / Modificar Piloto */}
      <DriverModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        driver={editingDriver}
        onSuccess={handleModalSuccess}
      />

      {/* Modal de confirmación para Eliminar */}
      <ConfirmDeleteModal
        open={Boolean(deletingDriver)}
        onClose={() => setDeletingDriver(null)}
        onConfirm={handleConfirmDelete}
        title="Retirar Piloto"
        itemName={deletingDriver?.displayName ?? ''}
        itemType="al piloto"
        loading={isDeleting}
      />
    </div>
  )
}
