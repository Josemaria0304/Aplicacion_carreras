import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowUpRight,
  CalendarDays,
  Check,
  Download,
  FileText,
  Fuel,
  Gauge,
  Pencil,
  Settings2,
  ShieldCheck,
  Trash2,
  Wrench,
  X,
} from 'lucide-react'
import { getDriversByVehicle, getTeam, getVehicle } from '@/lib/data'
import { cn, downloadJson } from '@/lib/utils'
import { useCompetition } from '@/store/useCompetition'
import { useSession } from '@/store/useSession'
import { CarSilhouette } from '@/components/CarSilhouette'
import { ConfirmDeleteModal } from '@/components/ConfirmDeleteModal'
import { VehicleModal } from '@/components/VehicleModal'
import {
  Badge,
  Button,
  Card,
  CardHeader,
  EmptyState,
  PageHeader,
  ProgressBar,
} from '@/components/ui'

const statusMeta = {
  approved: { label: 'Aprobado', tone: 'green' as const, description: 'Verificación técnica completada sin observaciones.' },
  pending: { label: 'Pendiente', tone: 'amber' as const, description: 'Pendiente de pesaje final y revisión documental.' },
  observed: { label: 'Observado', tone: 'red' as const, description: 'Existe una no conformidad que requiere corrección.' },
  rejected: { label: 'Rechazado', tone: 'red' as const, description: 'No autorizado para participar en la sesión.' },
}

const documentTone = {
  valid: { label: 'Vigente', tone: 'green' as const },
  expiring: { label: 'Por vencer', tone: 'amber' as const },
  expired: { label: 'Vencido', tone: 'red' as const },
}

export function VehicleDetailPage() {
  const { vehicleId = '' } = useParams()
  const navigate = useNavigate()
  const pushToast = useSession((state) => state.pushToast)
  const deleteVehicle = useCompetition((state) => state.deleteVehicle)

  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const vehicle = getVehicle(vehicleId)

  if (!vehicle || vehicle.id !== vehicleId) {
    return (
      <Card>
        <EmptyState
          title="Vehículo no encontrado"
          description="El identificador no corresponde a ningún vehículo del parque cerrado."
          action={
            <Button onClick={() => navigate('/garaje')}>
              <ArrowLeft className="h-4 w-4" />
              Volver al garaje
            </Button>
          }
        />
      </Card>
    )
  }

  const team = getTeam(vehicle.teamId)
  const vehicleDrivers = getDriversByVehicle(vehicle.id)
  const driver = vehicleDrivers[0]
  const meta = statusMeta[vehicle.status]
  const checklistOk = vehicle.checklist.filter((item) => item.ok).length
  const checklistPercent = Math.round((checklistOk / vehicle.checklist.length) * 100)

  const handleExport = () => {
    downloadJson(`apex-vehiculo-${vehicle.number}.json`, { vehiculo: vehicle, equipo: team, piloto: driver ?? null })
    pushToast({
      tone: 'success',
      title: 'Ficha técnica exportada',
      description: `Se descargó el expediente del chasis #${vehicle.number}.`,
    })
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2 text-[11px] text-dim">
        <Link to="/garaje" className="inline-flex items-center gap-1 hover:text-text">
          <ArrowLeft className="h-3 w-3" />
          Garaje
        </Link>
        <span>/</span>
        <span className="text-muted">
          #{vehicle.number} {vehicle.make} {vehicle.model}
        </span>
      </div>

      <PageHeader
        eyebrow={
          <>
            <Badge tone={meta.tone} dot>
              {meta.label}
            </Badge>
            <Badge tone="neutral">{vehicle.category}</Badge>
            <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-dim">
              {team.name} · {vehicle.year}
            </span>
          </>
        }
        title={
          <span className="flex flex-wrap items-baseline gap-3">
            {vehicle.make} <span className="text-accent">{vehicle.model}</span>
            <span className="text-2xl text-dim">#{vehicle.number}</span>
          </span>
        }
        description={`${meta.description} Homologación ${vehicle.homologation} · Inspección ${vehicle.inspectionDate} por ${vehicle.inspector}.`}
        actions={
          <>
            <Button variant="secondary" size="sm" onClick={() => setIsEditOpen(true)}>
              <Pencil className="h-3.5 w-3.5" />
              Editar vehículo
            </Button>
            <Button variant="danger" size="sm" onClick={() => setIsDeleteOpen(true)}>
              <Trash2 className="h-3.5 w-3.5" />
              Eliminar
            </Button>
            <Button variant="secondary" size="sm" onClick={handleExport}>
              <Download className="h-3.5 w-3.5" />
              Exportar
            </Button>
            {driver ? (
              <Link to={`/pilotos/${driver.id}`}>
                <Button size="sm">
                  Ver piloto
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            ) : null}
          </>
        }
      />

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          <Card className="relative overflow-hidden">
            <div className="pointer-events-none absolute inset-0 bg-grid opacity-40" />
            <div
              className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full opacity-20 blur-3xl"
              style={{ backgroundColor: team.color }}
            />
            <div className="relative flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
              <div className="h-40 flex-1">
                <CarSilhouette color={team.color} />
              </div>
              <div className="w-full shrink-0 space-y-2 sm:w-52">
                <div className="rounded-xl border border-line bg-surface-2/80 p-3">
                  <p className="label">Estado técnico</p>
                  <div className="mt-1.5 flex items-center gap-2">
                    <Badge tone={meta.tone}>{meta.label}</Badge>
                    <span className="num text-[10px] text-dim">{checklistOk}/{vehicle.checklist.length} ítems</span>
                  </div>
                  <ProgressBar
                    value={checklistOk}
                    max={vehicle.checklist.length}
                    color={vehicle.status === 'approved' ? 'green' : 'amber'}
                    className="mt-2"
                  />
                </div>
                <div className="rounded-xl border border-line bg-surface-2/80 p-3">
                  <p className="label">Transponder</p>
                  <p className="num mt-1 font-mono text-sm font-semibold text-text">{vehicle.transponder}</p>
                  <p className="mt-1 text-[10px] text-dim">Señal verificada · 12 Hz</p>
                </div>
              </div>
            </div>
            <div className="relative grid grid-cols-2 gap-px border-t border-line bg-line sm:grid-cols-4">
              <div className="bg-surface px-4 py-3">
                <p className="text-[9px] uppercase tracking-wider text-dim">Potencia</p>
                <p className="num mt-0.5 font-display text-lg font-semibold text-text">{vehicle.powerHp} hp</p>
              </div>
              <div className="bg-surface px-4 py-3">
                <p className="text-[9px] uppercase tracking-wider text-dim">Par motor</p>
                <p className="num mt-0.5 font-display text-lg font-semibold text-text">{vehicle.torqueNm} Nm</p>
              </div>
              <div className="bg-surface px-4 py-3">
                <p className="text-[9px] uppercase tracking-wider text-dim">Peso</p>
                <p className="num mt-0.5 font-display text-lg font-semibold text-text">{vehicle.weightKg} kg</p>
              </div>
              <div className="bg-surface px-4 py-3">
                <p className="text-[9px] uppercase tracking-wider text-dim">Peso mínimo</p>
                <p className="num mt-0.5 font-display text-lg font-semibold text-text">{vehicle.minWeightKg} kg</p>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader
              title="Especificaciones técnicas"
              subtitle={`${vehicle.engine} · ${vehicle.displacement}`}
              icon={<Settings2 className="h-4 w-4" />}
            />
            <div className="grid gap-x-6 gap-y-0 px-4 py-2 sm:grid-cols-2">
              {[
                { label: 'Marca', value: vehicle.make, icon: Gauge },
                { label: 'Modelo', value: vehicle.model, icon: Gauge },
                { label: 'Año', value: String(vehicle.year), icon: CalendarDays },
                { label: 'Categoría', value: vehicle.category, icon: ShieldCheck },
                { label: 'Motor', value: vehicle.engine, icon: Settings2 },
                { label: 'Cilindrada', value: vehicle.displacement, icon: Settings2 },
                { label: 'Tracción', value: vehicle.drivetrain, icon: Settings2 },
                { label: 'Transmisión', value: vehicle.transmission, icon: Settings2 },
                { label: 'Combustible', value: vehicle.fuel, icon: Fuel },
                { label: 'Capacidad', value: `${vehicle.fuelCapacity} L`, icon: Fuel },
                { label: 'Neumático', value: vehicle.tire, icon: Wrench },
                { label: 'Homologación', value: vehicle.homologation, icon: FileText },
                { label: 'VIN', value: vehicle.vin, icon: FileText },
                { label: 'Transponder', value: vehicle.transponder, icon: Gauge },
              ].map((row) => {
                const Icon = row.icon
                return (
                  <div key={row.label} className="flex items-start gap-3 border-b border-line/60 py-2.5 last:border-0">
                    <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-dim" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[9px] uppercase tracking-wider text-dim">{row.label}</p>
                      <p className="truncate text-xs font-medium text-text">{row.value}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>

          <Card>
            <CardHeader
              title="Notas de verificación"
              subtitle={`Inspector: ${vehicle.inspector} · ${vehicle.inspectionDate}`}
              icon={<Wrench className="h-4 w-4" />}
            />
            <div className="p-4">
              <p className="text-xs leading-relaxed text-muted">{vehicle.notes}</p>
              {vehicle.status !== 'approved' ? (
                <div
                  className={cn(
                    'mt-3 rounded-lg border px-3 py-2.5 text-[11px] leading-relaxed',
                    vehicle.status === 'pending'
                      ? 'border-amber/25 bg-amber/10 text-amber'
                      : 'border-red/25 bg-red/10 text-red',
                  )}
                >
                  {vehicle.status === 'pending'
                    ? 'El vehículo no podrá tomar parte en la sesión hasta completar el pesaje y la revisión documental.'
                    : 'No conforme: se requiere corrección y nueva inspección antes de la próxima sesión.'}
                </div>
              ) : null}
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader title="Equipo y piloto" subtitle="Asignación deportiva" icon={<ShieldCheck className="h-4 w-4" />} />
            <div className="p-4">
              <div className="flex items-center gap-3">
                <span
                  className="num flex h-11 w-11 items-center justify-center rounded-xl border font-display text-lg font-bold"
                  style={{
                    color: team.color,
                    borderColor: `${team.color}55`,
                    backgroundColor: `${team.color}14`,
                  }}
                >
                  {vehicle.number}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-text">{team.name}</p>
                  <p className="truncate text-[11px] text-muted">{team.country} · {team.principal}</p>
                </div>
              </div>

              {driver ? (
                <Link
                  to={`/pilotos/${driver.id}`}
                  className="mt-3 flex items-center gap-3 rounded-xl border border-line bg-surface-2 p-3 transition-colors hover:border-line-strong hover:bg-surface-3"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-surface-3 font-display text-xs font-bold text-muted">
                    {driver.number}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-text">{driver.displayName}</p>
                    <p className="truncate text-[10px] text-muted">{driver.flag} {driver.nationality} · {driver.category}</p>
                  </div>
                  <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-dim" />
                </Link>
              ) : (
                <p className="mt-3 text-[11px] text-dim">Sin piloto asignado.</p>
              )}
            </div>
          </Card>

          <Card>
            <CardHeader
              title="Documentación"
              subtitle="Vigencia administrativa"
              icon={<FileText className="h-4 w-4" />}
              action={<Badge tone={vehicle.documents.every((doc) => doc.status === 'valid') ? 'green' : 'amber'}>
                {vehicle.documents.filter((doc) => doc.status === 'valid').length}/{vehicle.documents.length}
              </Badge>}
            />
            <ul className="divide-y divide-line/70">
              {vehicle.documents.map((document) => {
                const tone = documentTone[document.status]
                return (
                  <li key={document.name} className="flex items-center justify-between gap-3 px-4 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-[11px] font-medium text-text">{document.name}</p>
                      <p className="num text-[10px] text-dim">Vence {document.expires}</p>
                    </div>
                    <Badge tone={tone.tone}>{tone.label}</Badge>
                  </li>
                )
              })}
            </ul>
          </Card>

          <Card>
            <CardHeader
              title="Checklist técnico"
              subtitle={`${checklistPercent}% completado`}
              icon={<Wrench className="h-4 w-4" />}
              action={<Badge tone={checklistPercent === 100 ? 'green' : 'amber'}>{checklistOk}/{vehicle.checklist.length}</Badge>}
            />
            <ul className="divide-y divide-line/70">
              {vehicle.checklist.map((item) => (
                <li key={item.label} className="flex items-center justify-between gap-3 px-4 py-2">
                  <span className="flex items-center gap-2 text-[11px] text-muted">
                    <span
                      className={cn(
                        'flex h-4 w-4 items-center justify-center rounded border',
                        item.ok ? 'border-green/30 bg-green/10 text-green' : 'border-red/30 bg-red/10 text-red',
                      )}
                    >
                      {item.ok ? <Check className="h-2.5 w-2.5" /> : <X className="h-2.5 w-2.5" />}
                    </span>
                    {item.label}
                  </span>
                  <span className={cn('text-[9px] font-bold uppercase tracking-wider', item.ok ? 'text-green' : 'text-red')}>
                    {item.ok ? 'OK' : 'Falla'}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>

      <VehicleModal
        open={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        vehicle={vehicle}
        onSuccess={(updated) => {
          pushToast({
            tone: 'success',
            title: 'Vehículo actualizado',
            description: `Los datos del chasis #${updated.number} se modificaron con éxito.`,
          })
        }}
      />

      <ConfirmDeleteModal
        open={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={async () => {
          setIsDeleting(true)
          try {
            await deleteVehicle(vehicle.id)
            pushToast({
              tone: 'success',
              title: 'Vehículo eliminado',
              description: `El chasis #${vehicle.number} ha sido retirado del parque cerrado.`,
            })
            navigate('/garaje')
          } catch {
            pushToast({
              tone: 'error',
              title: 'Error al eliminar',
              description: 'No se pudo retirar el vehículo.',
            })
          } finally {
            setIsDeleting(false)
          }
        }}
        title="Retirar Vehículo"
        itemName={`#${vehicle.number} ${vehicle.make} ${vehicle.model}`}
        itemType="el vehículo"
        loading={isDeleting}
      />
    </div>
  )
}
