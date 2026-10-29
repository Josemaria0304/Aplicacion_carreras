import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, Car, CheckCircle2, Search, ShieldCheck, Wrench } from 'lucide-react'
import { drivers, teams, vehicles } from '@/data/seed'
import { getDriversByVehicle, getTeam } from '@/lib/data'
import { cn } from '@/lib/utils'
import { CarSilhouette } from '@/components/CarSilhouette'
import {
  Badge,
  Card,
  EmptyState,
  Input,
  PageHeader,
  Select,
  StatCard,
} from '@/components/ui'

const statusMeta = {
  approved: { label: 'Aprobado', tone: 'green' as const },
  pending: { label: 'Pendiente', tone: 'amber' as const },
  observed: { label: 'Observado', tone: 'red' as const },
  rejected: { label: 'Rechazado', tone: 'red' as const },
}

type StatusFilter = 'all' | 'approved' | 'pending' | 'observed' | 'rejected'

export function VehiclesPage() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [teamFilter, setTeamFilter] = useState('all')

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
  }, [search, status, teamFilter])

  const approved = vehicles.filter((vehicle) => vehicle.status === 'approved').length
  const pending = vehicles.filter((vehicle) => vehicle.status === 'pending').length
  const observed = vehicles.filter((vehicle) => vehicle.status === 'observed').length
  const totalPower = vehicles.reduce((sum, vehicle) => sum + vehicle.powerHp, 0)

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow={
          <Badge tone="accent">
            <Car className="h-3 w-3" />
            Parque cerrado · Interlagos
          </Badge>
        }
        title="Garaje"
        description="Verificación técnica, documentación y especificaciones de los 14 GT3 inscritos en la ronda 4."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Vehículos inscritos" value={vehicles.length} detail={`${teams.length} equipos`} icon={<Car className="h-4 w-4" />} accent="accent" />
        <StatCard label="Aprobados" value={approved} detail="Listos para pista" icon={<CheckCircle2 className="h-4 w-4" />} accent="green" />
        <StatCard label="Pendientes / observados" value={`${pending} / ${observed}`} detail="Requieren acción de comisarios" icon={<Wrench className="h-4 w-4" />} accent="amber" />
        <StatCard label="Potencia total en parrilla" value={`${totalPower} hp`} detail="Suma de los 14 motores" icon={<ShieldCheck className="h-4 w-4" />} accent="purple" />
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
            description="Ajusta los filtros o el término de búsqueda."
          />
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((vehicle) => {
            const team = getTeam(vehicle.teamId)
            const vehicleDrivers = getDriversByVehicle(vehicle.id)
            const driver = vehicleDrivers[0] ?? drivers[0]
            const meta = statusMeta[vehicle.status]
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
                  <span className="absolute left-4 top-3 z-10">
                    <Badge tone={meta.tone}>{meta.label}</Badge>
                  </span>
                  <span
                    className="num absolute right-4 top-3 z-10 font-display text-3xl font-bold"
                    style={{ color: team.color }}
                  >
                    {String(vehicle.number).padStart(2, '0')}
                  </span>
                  <div className="absolute inset-x-3 bottom-1 h-28">
                    <CarSilhouette color={team.color} />
                  </div>
                </div>

                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-display text-xl font-semibold uppercase leading-none text-text">
                        {vehicle.make} <span className="text-muted">{vehicle.model}</span>
                      </p>
                      <p className="mt-1 truncate text-[11px] text-muted">
                        {team.name} · {driver.displayName}
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
    </div>
  )
}
