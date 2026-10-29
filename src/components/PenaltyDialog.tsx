import { useEffect, useState } from 'react'
import { AlertTriangle, Gavel } from 'lucide-react'
import { getDriver, getTeam } from '@/lib/data'
import { useRace } from '@/store/useRace'
import { useSession } from '@/store/useSession'
import { formatLap } from '@/lib/utils'
import { Button, Field, Modal, Select, Textarea } from '@/components/ui'

type PenaltyType = 'time' | 'driveThrough' | 'stopGo' | 'reprimand' | 'dsq'

const penaltyTypes: { id: PenaltyType; label: string; defaultSeconds: number }[] = [
  { id: 'time', label: 'Penalización de tiempo', defaultSeconds: 5 },
  { id: 'driveThrough', label: 'Drive-through', defaultSeconds: 20 },
  { id: 'stopGo', label: 'Stop & Go (10 s)', defaultSeconds: 30 },
  { id: 'reprimand', label: 'Reprimenda oficial', defaultSeconds: 0 },
  { id: 'dsq', label: 'Descalificación', defaultSeconds: 0 },
]

const reasons = [
  'Track limits',
  'Exceso de velocidad en pit lane',
  'Adelantamiento bajo bandera amarilla',
  'Contacto evitable',
  'Ignorar bandera azul',
  'Salida de boxes insegura',
]

export function PenaltyDialog({
  open,
  onClose,
  initialEntryId,
}: {
  open: boolean
  onClose: () => void
  initialEntryId?: string | null
}) {
  const entries = useRace((state) => state.entries)
  const applyPenalty = useRace((state) => state.applyPenalty)
  const pushToast = useSession((state) => state.pushToast)

  const [entryId, setEntryId] = useState(initialEntryId ?? entries[0]?.id ?? '')
  const [type, setType] = useState<PenaltyType>('time')
  const [seconds, setSeconds] = useState(5)
  const [reason, setReason] = useState(reasons[0])

  useEffect(() => {
    if (!open) return
    const currentEntries = useRace.getState().entries
    setEntryId(initialEntryId ?? currentEntries[0]?.id ?? '')
    setType('time')
    setSeconds(5)
    setReason(reasons[0])
  }, [open, initialEntryId])

  const selected = entries.find((entry) => entry.id === entryId)
  const driver = selected ? getDriver(selected.driverId) : null
  const team = selected ? getTeam(selected.teamId) : null

  const handleType = (next: PenaltyType) => {
    setType(next)
    const preset = penaltyTypes.find((item) => item.id === next)
    if (preset && next !== 'time') setSeconds(preset.defaultSeconds)
    if (next === 'time') setSeconds(5)
  }

  const handleSubmit = () => {
    if (!selected) return
    const effectiveSeconds =
      type === 'driveThrough' ? 20 : type === 'stopGo' ? 30 : type === 'time' ? seconds : 0
    applyPenalty(selected.id, effectiveSeconds, reason, type)
    pushToast({
      tone: type === 'dsq' ? 'error' : 'warning',
      title:
        type === 'dsq'
          ? `Descalificación aplicada a ${getDriver(selected.driverId).displayName}`
          : `Sanción aplicada a ${getDriver(selected.driverId).displayName}`,
      description:
        type === 'reprimand'
          ? `${reason} · Queda registrada en el acta de comisarios.`
          : `${reason} · +${effectiveSeconds} s en la clasificación en vivo.`,
    })
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Aplicar sanción"
      description="La sanción se aplica de inmediato a la clasificación en vivo y se registra en el feed de Dirección de Carrera."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant={type === 'dsq' ? 'danger' : 'primary'} onClick={handleSubmit} disabled={!reason.trim()}>
            <Gavel className="h-4 w-4" />
            Aplicar sanción
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Piloto sancionado">
          <Select value={entryId} onChange={(event) => setEntryId(event.target.value)}>
            {entries.map((entry) => (
              <option key={entry.id} value={entry.id}>
                P{entry.position} · #{entry.number} {getDriver(entry.driverId).displayName} —
                {' '}
                {getTeam(entry.teamId).name}
              </option>
            ))}
          </Select>
        </Field>

        {selected && driver && team ? (
          <div className="flex items-center justify-between rounded-xl border border-line bg-surface-2 px-3.5 py-3">
            <div>
              <p className="text-sm font-semibold text-text">
                #{selected.number} {driver.displayName}
              </p>
              <p className="text-[11px] text-muted">
                {team.name} · Mejor vuelta {formatLap(selected.bestLapMs)}
              </p>
            </div>
            <div className="text-right">
              <p className="label">Sanción acumulada</p>
              <p className="num font-mono text-sm text-amber">+{(selected.penaltyMs / 1000).toFixed(0)} s</p>
            </div>
          </div>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Tipo de sanción">
            <Select value={type} onChange={(event) => handleType(event.target.value as PenaltyType)}>
              {penaltyTypes.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Tiempo añadido" hint={type === 'reprimand' || type === 'dsq' ? 'Sin efecto en el tiempo.' : 'Se suma al tiempo total.'}>
            <Select
              value={seconds}
              onChange={(event) => setSeconds(Number(event.target.value))}
              disabled={type !== 'time'}
            >
              {[5, 10, 15, 25, 30].map((value) => (
                <option key={value} value={value}>
                  +{value} segundos
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <Field label="Motivo / artículo">
          <Select value={reason} onChange={(event) => setReason(event.target.value)}>
            {reasons.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Nota para el acta" hint="Visible para comisarios y Dirección de Carrera.">
          <Textarea rows={3} placeholder="Describe la evidencia o el artículo reglamentario aplicado…" />
        </Field>

        {type === 'dsq' ? (
          <div className="flex items-start gap-2 rounded-xl border border-red/25 bg-red/10 px-3 py-2.5 text-xs text-red">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>La descalificación retira al piloto de la clasificación. La acción no se puede deshacer sin reiniciar la sesión.</p>
          </div>
        ) : null}
      </div>
    </Modal>
  )
}
