import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowUpRight,
  Car,
  CheckCircle2,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  Wrench,
} from 'lucide-react'
import { getDriversByVehicle, getTeam } from '@/lib/data'
import { cn } from '@/lib/utils'
import { useCompetition } from '@/store/useCompetition'
import { useSession } from '@/store/useSession'
import { CarSilhouette } from '@/components/CarSilhouette'
import { ConfirmDeleteModal } from '@/components/ConfirmDeleteModal'
import { VehicleModal } from '@/components/VehicleModal'
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
import type { Vehicle } from '@/types'

const statusMeta = {
  approved: { label: 'Aprobado', tone: 'green' as const },
  pending: { label: 'Pendiente', tone: 'amber' as const },
  observed: { label: 'Observado', tone: 'red' as const },
  rejected: { label: 'Rechazado', tone: 'red' as const },
}

type StatusFilter = 'all' | 'approved' | 'pending' | 'observed' | 'rejected'

export function VehiclesPage() {
  const pushToast = useSession((state) => state.pushToast)
  const vehicles = useCompetition((state) => state.vehicles)
  const teams = useCompetition((state) => state.teams)
  const drivers = useCompetition((state) => state.drivers)
  const deleteVehicle = useCompetition((state) => state.deleteVehicle)

  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [teamFilter, setTeamFilter] = useState('all')

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null)
  const [deletingVehicle, setDeletingVehicle] = useState<Vehicle | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return vehicles.filter((vehicle) => {
      const team = getTeam(vehicle.teamId)
      const matchesStatus = status === 'all' || vehicle.status === status
      const matchesTeam = teamFilter === 'all' || vehicle.teamId === teamFilter
      const matchesTerm =
        !term ||
        vehicle.make.toLowerCase().includes(term) ||
        vehicle.model.toLowerCase().includes(term) ||
        String(vehicle.number).includes(term) ||
        team.name.toLowerCase().includes(term) ||
        vehicle.vin.toLowerCase().includes(term)
      return matchesStatus && matchesTeam && matchesTerm
    })
  }, [vehicles, search, status, teamFilter])

  const approved = vehicles.filter((vehicle) => vehicle.status === 'approved').length
  const pending = vehicles.filter((vehicle) => vehicle.status === 'pending').length
  const observed = vehicles.filter((vehicle) => vehicle.status === 'observed').length
  const totalPower = vehicles.reduce((sum, vehicle) => sum + (Number(vehicle.powerHp) || 0), 0)

  const handleOpenCreate = () => {
    setEditingVehicle(null)
    setIsModalOpen(true)
  }

  const handleOpenEdit = (e: React.MouseEvent, vehicle: Vehicle) => {
    e.preventDefault()
    e.stopPropagation()
    setEditingVehicle(vehicle)
    setIsModalOpen(true)
  }

  const handleOpenDelete = (e: React.MouseEvent, vehicle: Vehicle) => {
    e.preventDefault()
    e.stopPropagation()
    setDeletingVehicle(vehicle)
  }

  const handleConfirmDelete = async () => {
    if (!deletingVehicle) return
    setIsDeleting(true)
    try {
      await deleteVehicle(deletingVehicle.id)
      pushToast({
        tone: 'success',
        title: 'Vehículo eliminado',
        description: `El chasis #${deletingVehicle.number} (${deletingVehicle.make} ${deletingVehicle.model}) ha sido retirado del parque cerrado.`,
      })
      setDeletingVehicle(null)
    } catch {
      pushToast({
        tone: 'error',
        title: 'Error al eliminar',
        description: 'No se pudo retirar el vehículo del parque cerrado.',
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleModalSuccess = (savedVehicle: Vehicle) => {
    pushToast({
      tone: 'success',
      title: editingVehicle ? 'Vehículo modificado' : 'Vehículo registrado',
      description: `#${savedVehicle.number} ${savedVehicle.make} ${savedVehicle.model} guardado correctamente.`,
    })
  }

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow={
          <Badge tone="accent">
            <Car className="h-3 w-3" />
            Parque cerrado · Interlagos
          </Badge>
        }
        title="Garaje y Autos"
        description="Verificación técnica, documentación, homologación y control integral de la flota de competición."
        actions={
          <Button size="sm" onClick={handleOpenCreate}>
            <Plus className="h-3.5 w-3.5" />
            Registrar Vehículo
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Vehículos en flota" value={vehicles.length} detail={`${teams.length} equipos`} icon={<Car className="h-4 w-4" />} accent="accent" />
        <StatCard label="Aprobados" value={approved} detail="Listos para pista" icon={<CheckCircle2 className="h-4 w-4" />} accent="green" />
        <StatCard label="Pendientes / observados" value={`${pending} / ${observed}`} detail="Requieren acción de comisarios" icon={<Wrench className="h-4 w-4" />} accent="amber" />
        <StatCard label="Potencia total en parrilla" value={`${totalPower} hp`} detail={`Suma de ${vehicles.length} motores`} icon={<ShieldCheck className="h-4 w-4" />} accent="purple" />
      </div>

      <Card className="p-3.5">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-dim" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por marca, modelo, número, VIN o equipo…"
              className="pl-9"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {(
              [
                { id: 'all', label: 'Todos' },
                { id: 'approved', label: 'Aprobados' },
                { id: 'pending', label: 'Pendientes' },
                { id: 'observed', label: 'Observados' },
              ] as { id: StatusFilter; label: string }[]
            ).map((item) => (
              <button
                key={item.id}
                onClick={() => setStatus(item.id)}
                className={cn(
                  'h-10 rounded-lg border px-3 text-xs font-medium transition-colors',
                  status === item.id
                    ? 'border-accent/40 bg-accent/10 text-accent'
                    : 'border-line bg-surface-2 text-muted hover:text-text',
                )}
              >
                {item.label}
              </button>
            ))}
            <Select
              value={teamFilter}
              onChange={(event) => setTeamFilter(event.target.value)}
              className="w-44 text-xs"
              aria-label="Filtrar por equipo"
            >
              <option value="all">Todos los equipos</option>
              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </Card>

      {filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Search className="h-5 w-5" />}
            title="Sin vehículos que coincidan"
            description="Ajusta los filtros o registra un nuevo vehículo."
            action={
              <Button size="sm" onClick={handleOpenCreate}>
                <Plus className="h-4 w-4" />
                Registrar Nuevo Vehículo
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((vehicle) => {
            const team = getTeam(vehicle.teamId)
            const vehicleDrivers = getDriversByVehicle(vehicle.id)
            const driver = vehicleDrivers[0] ?? drivers[0]
            const meta = statusMeta[vehicle.status] ?? statusMeta.approved
            return (
              <Link
                key={vehicle.id}
                to={`/garaje/${vehicle.id}`}
                className="panel panel-hover group overflow-hidden"
              >
                <div className="relative h-36 border-b border-line bg-gradient-to-b from-surface-2 to-surface">
                  <span
                    className="pointer-events-none absolute -right-6 top-2 h-24 w-24 rounded-full opacity-20 blur-3xl"
                    style={{ backgroundColor: team.color }}
                  />
                  <div className="absolute left-4 top-3 z-10 flex items-center gap-2">
                    <Badge tone={meta.tone}>{meta.label}</Badge>
                  </div>

                  {/* Actions toolbar */}
                  <div className="absolute right-16 top-3 z-20 flex items-center gap-1 opacity-80 transition-opacity group-hover:opacity-100">
                    <button
                      onClick={(e) => handleOpenEdit(e, vehicle)}
                      className="rounded-md border border-line bg-surface/80 p-1.5 text-muted backdrop-blur-sm transition-colors hover:border-accent/50 hover:bg-surface-2 hover:text-accent"
                      title="Editar vehículo"
                      aria-label="Editar vehículo"
                    >
                      <Pencil className="h-3 w-3" />
                    </button>
                    <button
                      onClick={(e) => handleOpenDelete(e, vehicle)}
                      className="rounded-md border border-line bg-surface/80 p-1.5 text-muted backdrop-blur-sm transition-colors hover:border-red/40 hover:bg-red/10 hover:text-red"
                      title="Eliminar vehículo"
                      aria-label="Eliminar vehículo"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>

                  <span
                    className="num absolute right-4 top-3 z-10 font-display text-3xl font-bold"
                    style={{ color: team.color }}
                  >
                    {String(vehicle.number).padStart(2, '0')}
                  </span>
                  <div className="absolute inset-x-3 bottom-1 h-28">
                    <CarSilhouette color={vehicle.color || team.color} />
                  </div>
                </div>

                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-display text-xl font-semibold uppercase leading-none text-text">
                        {vehicle.make} <span className="text-muted">{vehicle.model}</span>
                      </p>
                      <p className="mt-1 truncate text-[11px] text-muted">
                        {team.name} · {driver ? driver.displayName : 'Sin piloto asignado'}
                      </p>
                    </div>
                    <ArrowUpRight className="mt-1 h-3.5 w-3.5 shrink-0 text-dim transition-colors group-hover:text-accent" />
                  </div>

                  <div className="mt-3 grid grid-cols-3 gap-2 border-t border-line/70 pt-3">
                    <div>
                      <p className="text-[9px] uppercase tracking-wider text-dim">Potencia</p>
                      <p className="num text-xs font-semibold text-text">{vehicle.powerHp} hp</p>
                    </div>
                    <div>
                      <p className="text-[9px] uppercase tracking-wider text-dim">Peso</p>
                      <p className="num text-xs font-semibold text-text">{vehicle.weightKg} kg</p>
                    </div>
                    <div>
                      <p className="text-[9px] uppercase tracking-wider text-dim">Cilindrada</p>
                      <p className="num text-xs font-semibold text-text">{vehicle.displacement}</p>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between text-[10px]">
                    <span className="truncate text-dim">{vehicle.tire}</span>
                    <span className="num shrink-0 font-mono text-dim">{vehicle.transponder}</span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {/* Modal para Insertar / Modificar Vehículo */}
      <VehicleModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        vehicle={editingVehicle}
        onSuccess={handleModalSuccess}
      />

      {/* Modal de confirmación para Eliminar */}
      <ConfirmDeleteModal
        open={Boolean(deletingVehicle)}
        onClose={() => setDeletingVehicle(null)}
        onConfirm={handleConfirmDelete}
        title="Retirar Vehículo"
        itemName={`#${deletingVehicle?.number} ${deletingVehicle?.make} ${deletingVehicle?.model}`}
        itemType="el vehículo"
        loading={isDeleting}
      />
    </div>
  )
}
