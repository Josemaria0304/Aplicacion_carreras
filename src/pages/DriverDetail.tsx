import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  Activity,
  ArrowLeft,
  ArrowUpRight,
  CalendarDays,
  Download,
  Droplets,
  FileText,
  Gauge,
  HeartPulse,
  IdCard,
  Mail,
  MapPin,
  Pencil,
  Phone,
  ShieldCheck,
  Trash2,
  Trophy,
  UserRound,
  Weight,
} from 'lucide-react'
import { currentEvent, events, standings } from '@/data/seed'
import {
  cumulativePoints,
  getDriver,
  getStanding,
  getTeam,
  getVehicle,
  pointsByRound,
} from '@/lib/data'
import { can } from '@/lib/permissions'
import { cn, downloadJson, formatDate, formatLap } from '@/lib/utils'
import { useCompetition } from '@/store/useCompetition'
import { useSession } from '@/store/useSession'
import { CarSilhouette } from '@/components/CarSilhouette'
import { ConfirmDeleteModal } from '@/components/ConfirmDeleteModal'
import { DriverModal } from '@/components/DriverModal'
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardHeader,
  EmptyState,
  PageHeader,
  StatCard,
} from '@/components/ui'
import type { RaceResult } from '@/types'

const roundLabels = ['R1', 'R2', 'R3', 'R4']

function resultLabel(result: RaceResult): string {
  return typeof result === 'number' ? `P${result}` : result
}

export function DriverDetailPage() {
  const { driverId = '' } = useParams()
  const navigate = useNavigate()
  const role = useSession((state) => state.role)
  const pushToast = useSession((state) => state.pushToast)
  const deleteDriver = useCompetition((state) => state.deleteDriver)

  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const driver = getDriver(driverId)
  const team = getTeam(driver.teamId)
  const vehicle = getVehicle(driver.vehicleId)
  const standing = getStanding(driver.id)
  const canViewMedical = can(role, 'medical:view')

  if (!driver.id || driver.id !== driverId) {
    return (
      <Card>
        <EmptyState
          title="Piloto no encontrado"
          description="El identificador no corresponde a ningún piloto inscrito."
          action={
            <Button onClick={() => navigate('/pilotos')}>
              <ArrowLeft className="h-4 w-4" />
              Volver a pilotos
            </Button>
          }
        />
      </Card>
    )
  }

  const cumulative = cumulativePoints(driver)
  const perRound = pointsByRound(driver)
  const chartData = cumulative.map((value, index) => ({
    round: roundLabels[index] ?? `R${index + 1}`,
    puntos: value,
    ronda: perRound[index],
  }))

  const roundEvents = events.filter((event) => event.status === 'finished' || event.status === 'live').slice(0, driver.results.length)

  const handleExport = () => {
    downloadJson(`apex-piloto-${driver.lastName.toLowerCase()}.json`, {
      piloto: driver,
      equipo: team,
      vehiculo: vehicle,
      clasificacion: standing,
      puntosAcumulados: cumulative,
    })
    pushToast({
      tone: 'success',
      title: 'Ficha exportada',
      description: `Se descargó el expediente de ${driver.displayName} en JSON.`,
    })
  }

  const handleContact = () => {
    pushToast({
      tone: 'info',
      title: 'Contacto interno',
      description: `Se abrió el canal de mensajería con ${team.principal} (${team.name}).`,
    })
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2 text-[11px] text-dim">
        <Link to="/pilotos" className="inline-flex items-center gap-1 hover:text-text">
          <ArrowLeft className="h-3 w-3" />
          Pilotos
        </Link>
        <span>/</span>
        <span className="text-muted">{driver.displayName}</span>
      </div>

      <PageHeader
        eyebrow={
          <>
            <Badge tone="neutral">P{standing.position} del campeonato</Badge>
            <Badge tone="accent">{driver.category}</Badge>
            <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-dim">
              Licencia {driver.licenseClass} · {driver.license}
            </span>
          </>
        }
        title={
          <span className="flex flex-wrap items-baseline gap-3">
            {driver.firstName} <span className="text-accent">{driver.lastName}</span>
            <span className="text-2xl text-dim">#{driver.number}</span>
            <span>{driver.flag}</span>
          </span>
        }
        description={`${team.name} · ${driver.city}, ${driver.nationality} · ${vehicle.make} ${vehicle.model}`}
        actions={
          <>
            <Button variant="secondary" size="sm" onClick={() => setIsEditOpen(true)}>
              <Pencil className="h-3.5 w-3.5" />
              Editar piloto
            </Button>
            <Button variant="danger" size="sm" onClick={() => setIsDeleteOpen(true)}>
              <Trash2 className="h-3.5 w-3.5" />
              Eliminar
            </Button>
            <Button variant="secondary" size="sm" onClick={handleExport}>
              <Download className="h-3.5 w-3.5" />
              Exportar
            </Button>
            <Button size="sm" onClick={handleContact}>
              <Mail className="h-3.5 w-3.5" />
              Contactar
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Posición" value={`P${standing.position}`} detail={`Previa: P${standing.previousPosition}`} icon={<Trophy className="h-4 w-4" />} accent="accent" />
        <StatCard label="Puntos" value={standing.points} detail={`${perRound.reduce((a, b) => a + b, 0)} en 4 rondas`} icon={<Activity className="h-4 w-4" />} accent="purple" />
        <StatCard label="Victorias / podios" value={`${standing.wins} / ${standing.podiums}`} detail={`${standing.poles} poles · ${standing.fastestLaps} vueltas rápidas`} icon={<Gauge className="h-4 w-4" />} accent="sky" />
        <StatCard label="Inicio de temporada" value={`${driver.results.length}`} detail={`Debut: ${formatDate(driver.dob)}`} icon={<CalendarDays className="h-4 w-4" />} accent="amber" />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="space-y-4">
          <Card className="overflow-hidden">
            <div className="relative border-b border-line bg-gradient-to-b from-surface-2 to-surface p-5">
              <span
                className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-20 blur-3xl"
                style={{ backgroundColor: team.color }}
              />
              <div className="flex items-start gap-4">
                <Avatar name={`${driver.firstName} ${driver.lastName}`} color={team.color} size="xl" />
                <div className="min-w-0 flex-1">
                  <p className="font-display text-2xl font-semibold uppercase leading-none text-text">
                    {driver.firstName} <span style={{ color: team.color }}>{driver.lastName}</span>
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    {team.name} · {driver.category}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <Badge tone="green" dot>
                      Licencia vigente
                    </Badge>
                    <Badge tone="neutral">{driver.licenseClass}</Badge>
                  </div>
                </div>
              </div>
              <p className="mt-4 text-xs leading-relaxed text-muted">{driver.bio}</p>
              <div className="mt-4 flex items-center gap-3 border-t border-line pt-3">
                <div className="flex items-center gap-1.5">
                  <span className="h-6 w-1 rounded-full" style={{ backgroundColor: team.color }} />
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-text">{team.shortName}</span>
                </div>
                <span className="text-[10px] text-dim">Jefe de equipo: {team.principal}</span>
              </div>
            </div>

            <div className="divide-y divide-line/70">
              {[
                { label: 'Fecha de nacimiento', value: formatDate(driver.dob), icon: CalendarDays },
                { label: 'Lugar de nacimiento', value: `${driver.city}, ${driver.nationality}`, icon: MapPin },
                { label: 'Altura', value: `${driver.heightCm} cm`, icon: UserRound },
                { label: 'Peso', value: `${driver.weightKg} kg`, icon: Weight },
                { label: 'Casco', value: driver.helmet, icon: ShieldCheck },
              ].map((row) => {
                const Icon = row.icon
                return (
                  <div key={row.label} className="flex items-start gap-3 px-4 py-2.5">
                    <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-dim" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[9px] uppercase tracking-wider text-dim">{row.label}</p>
                      <p className="text-xs font-medium text-text">{row.value}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>

          <Card>
            <CardHeader title="Patrocinadores" subtitle="Acuerdos activos de la temporada" icon={<FileText className="h-4 w-4" />} />
            <div className="flex flex-wrap gap-1.5 p-4">
              {driver.sponsors.map((sponsor) => (
                <span
                  key={sponsor}
                  className="rounded-md border border-line bg-surface-2 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted"
                >
                  {sponsor}
                </span>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-4 xl:col-span-2">
          <Card>
            <CardHeader
              title="Progresión de puntos"
              subtitle="Puntos acumulados por ronda · incluye bonus de vuelta rápida"
              icon={<Activity className="h-4 w-4" />}
              action={<Badge tone="accent">{standing.points} pts</Badge>}
            />
            <div className="h-[240px] px-2 py-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 8, right: 16, left: -16, bottom: 0 }}>
                  <defs>
                    <linearGradient id="driverArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#C9F73A" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#C9F73A" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 6" stroke="#252C36" vertical={false} />
                  <XAxis
                    dataKey="round"
                    tick={{ fill: '#6B7585', fontSize: 11 }}
                    axisLine={{ stroke: '#252C36' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: '#6B7585', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={40}
                  />
                  <Tooltip
                    contentStyle={{
                      background: '#0F1217',
                      border: '1px solid #252C36',
                      borderRadius: 12,
                      fontSize: 12,
                    }}
                    labelStyle={{ color: '#98A2B3', fontSize: 11 }}
                    itemStyle={{ color: '#C9F73A' }}
                    formatter={(value) => [`${value} pts`, 'Acumulado']}
                  />
                  <Area
                    type="monotone"
                    dataKey="puntos"
                    stroke="#C9F73A"
                    strokeWidth={2}
                    fill="url(#driverArea)"
                    dot={{ r: 3, fill: '#0F1217', stroke: '#C9F73A', strokeWidth: 2 }}
                    activeDot={{ r: 5 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-4 gap-px border-t border-line bg-line">
              {perRound.map((points, index) => (
                <div key={index} className="bg-surface px-3 py-2 text-center">
                  <p className="text-[9px] uppercase tracking-wider text-dim">R{index + 1}</p>
                  <p className="num font-display text-base font-semibold text-text">+{points}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader
              title="Resultados de la temporada"
              subtitle="GT Series International 2026"
              icon={<Trophy className="h-4 w-4" />}
              action={
                <Link to="/clasificacion" className="text-[11px] font-semibold text-accent hover:underline">
                  Ver clasificación
                </Link>
              }
            />
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-left">
                <thead>
                  <tr className="border-b border-line text-[9px] uppercase tracking-[0.16em] text-dim">
                    <th className="px-4 py-2 font-semibold">Ronda</th>
                    <th className="px-3 py-2 font-semibold">Evento</th>
                    <th className="px-3 py-2 font-semibold">Circuito</th>
                    <th className="px-3 py-2 text-center font-semibold">Pos</th>
                    <th className="px-3 py-2 text-center font-semibold">Pts</th>
                    <th className="px-4 py-2 text-right font-semibold">Bonus</th>
                  </tr>
                </thead>
                <tbody>
                  {driver.results.map((result, index) => {
                    const event = roundEvents[index]
                    const points = perRound[index] ?? 0
                    const fastest = driver.fastestLapRounds.includes(index + 1)
                    return (
                      <tr key={index} className="border-b border-line/60 last:border-0">
                        <td className="px-4 py-2.5">
                          <span className="num font-display text-sm font-semibold text-muted">R{index + 1}</span>
                        </td>
                        <td className="px-3 py-2.5">
                          <p className="truncate text-xs font-medium text-text">{event?.name ?? 'Evento'}</p>
                          <p className="text-[10px] text-dim">{event?.dateLabel ?? ''}</p>
                        </td>
                        <td className="px-3 py-2.5 text-[11px] text-muted">
                          {event ? event.name.split(' ').slice(-1)[0] : '—'}
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <span
                            className={cn(
                              'inline-flex min-w-8 items-center justify-center rounded border px-1.5 py-0.5 text-[10px] font-bold',
                              typeof result === 'number' && result <= 3
                                ? 'border-accent/30 bg-accent/10 text-accent'
                                : typeof result === 'number'
                                  ? 'border-line bg-surface-2 text-muted'
                                  : 'border-red/30 bg-red/10 text-red',
                            )}
                          >
                            {resultLabel(result)}
                          </span>
                        </td>
                        <td className="num px-3 py-2.5 text-center text-xs font-semibold text-text">{points}</td>
                        <td className="px-4 py-2.5 text-right">
                          {fastest ? (
                            <Badge tone="purple">+1 VL</Badge>
                          ) : (
                            <span className="text-[10px] text-dim">—</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="overflow-hidden">
              <CardHeader
                title="Vehículo asignado"
                subtitle={`${vehicle.make} ${vehicle.model} · #${vehicle.number}`}
                icon={<Gauge className="h-4 w-4" />}
                action={
                  <Link to={`/garaje/${vehicle.id}`} className="text-[11px] font-semibold text-accent hover:underline">
                    Ficha técnica
                  </Link>
                }
              />
              <div className="h-32 px-3 py-2">
                <CarSilhouette color={team.color} />
              </div>
              <div className="grid grid-cols-3 gap-px border-t border-line bg-line">
                <div className="bg-surface px-3 py-2">
                  <p className="text-[9px] uppercase tracking-wider text-dim">Potencia</p>
                  <p className="num text-xs font-semibold text-text">{vehicle.powerHp} hp</p>
                </div>
                <div className="bg-surface px-3 py-2">
                  <p className="text-[9px] uppercase tracking-wider text-dim">Peso</p>
                  <p className="num text-xs font-semibold text-text">{vehicle.weightKg} kg</p>
                </div>
                <div className="bg-surface px-3 py-2">
                  <p className="text-[9px] uppercase tracking-wider text-dim">Estado</p>
                  <p className="mt-0.5">
                    <Badge tone={vehicle.status === 'approved' ? 'green' : vehicle.status === 'pending' ? 'amber' : 'red'}>
                      {vehicle.status === 'approved' ? 'Aprobado' : vehicle.status === 'pending' ? 'Pendiente' : 'Observado'}
                    </Badge>
                  </p>
                </div>
              </div>
            </Card>

            <Card>
              <CardHeader
                title="Licencias y documentación"
                subtitle="Control federativo del piloto"
                icon={<IdCard className="h-4 w-4" />}
                action={canViewMedical ? <Badge tone="green">Acceso médico</Badge> : <Badge tone="neutral">Restringido</Badge>}
              />
              <div className="divide-y divide-line/70">
                <div className="flex items-center justify-between px-4 py-2.5">
                  <span className="text-[11px] text-muted">Licencia deportiva</span>
                  <span className="num font-mono text-[11px] text-text">{driver.license}</span>
                </div>
                <div className="flex items-center justify-between px-4 py-2.5">
                  <span className="text-[11px] text-muted">Clase</span>
                  <Badge tone="accent">{driver.licenseClass}</Badge>
                </div>
                <div className="flex items-center justify-between px-4 py-2.5">
                  <span className="text-[11px] text-muted">Caducidad licencia</span>
                  <span className="text-[11px] font-medium text-text">{driver.licenseExpiry}</span>
                </div>
                <div className="flex items-center justify-between px-4 py-2.5">
                  <span className="text-[11px] text-muted">Certificado médico</span>
                  <span className="text-[11px] font-medium text-text">
                    {canViewMedical ? driver.medicalExpiry : '••• protegido'}
                  </span>
                </div>
                <div className="flex items-center justify-between px-4 py-2.5">
                  <span className="flex items-center gap-1.5 text-[11px] text-muted">
                    <Droplets className="h-3 w-3" /> Grupo sanguíneo
                  </span>
                  <span className="text-[11px] font-medium text-text">
                    {canViewMedical ? driver.bloodType : '•••'}
                  </span>
                </div>
                <div className="flex items-start justify-between gap-3 px-4 py-2.5">
                  <span className="flex items-center gap-1.5 text-[11px] text-muted">
                    <Phone className="h-3 w-3" /> Emergencia
                  </span>
                  <span className="max-w-[60%] text-right text-[11px] font-medium text-text">
                    {canViewMedical ? driver.emergencyContact : 'Solo Dirección de Carrera'}
                  </span>
                </div>
              </div>
              {!canViewMedical ? (
                <div className="flex items-center gap-2 border-t border-line bg-surface-2/50 px-4 py-2.5 text-[10px] text-dim">
                  <HeartPulse className="h-3.5 w-3.5" />
                  Cambia a un rol con permiso médico para ver los datos completos.
                </div>
              ) : null}
            </Card>
          </div>
        </div>
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-surface-2 text-muted">
              <ArrowUpRight className="h-4 w-4" />
            </span>
            <div>
              <p className="text-xs font-semibold text-text">Siguiente sesión del piloto</p>
              <p className="text-[10px] text-dim">
                {currentEvent.name} · {currentEvent.sessions[currentEvent.sessions.length - 1].name} · {currentEvent.dateLabel}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link to="/live">
              <Button variant="secondary" size="sm">
                Ver live timing
              </Button>
            </Link>
            <Link to={`/eventos/${currentEvent.id}`}>
              <Button size="sm">Ir al evento</Button>
            </Link>
          </div>
        </div>
      </Card>

      <DriverModal
        open={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        driver={driver}
        onSuccess={(updated) => {
          pushToast({
            tone: 'success',
            title: 'Piloto actualizado',
            description: `Los datos de ${updated.displayName} han sido modificados con éxito.`,
          })
        }}
      />

      <ConfirmDeleteModal
        open={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={async () => {
          setIsDeleting(true)
          try {
            await deleteDriver(driver.id)
            pushToast({
              tone: 'success',
              title: 'Piloto eliminado',
              description: `${driver.displayName} fue retirado de la competición.`,
            })
            navigate('/pilotos')
          } catch {
            pushToast({
              tone: 'error',
              title: 'Error al eliminar',
              description: 'No se pudo eliminar el piloto.',
            })
          } finally {
            setIsDeleting(false)
          }
        }}
        title="Eliminar Piloto"
        itemName={driver.displayName}
        itemType="al piloto"
        loading={isDeleting}
      />
    </div>
  )
}
