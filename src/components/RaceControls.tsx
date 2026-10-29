import type { ReactNode } from 'react'
import { AlertTriangle, Car, Flag, Pause, Play, RotateCcw, ShieldAlert } from 'lucide-react'
import { can } from '@/lib/permissions'
import { cn, formatClock } from '@/lib/utils'
import { useRace } from '@/store/useRace'
import { useSession } from '@/store/useSession'
import type { Flag as FlagType } from '@/types'
import { Badge, Button } from '@/components/ui'

const flagOptions: {
  id: FlagType
  label: string
  icon: ReactNode
  active: string
  idle: string
}[] = [
  {
    id: 'green',
    label: 'Verde',
    icon: <Flag className="h-4 w-4" />,
    active: 'border-green/50 bg-green/15 text-green',
    idle: 'text-muted hover:text-green hover:border-green/30',
  },
  {
    id: 'yellow',
    label: 'Amarilla',
    icon: <Flag className="h-4 w-4" />,
    active: 'border-amber/50 bg-amber/15 text-amber',
    idle: 'text-muted hover:text-amber hover:border-amber/30',
  },
  {
    id: 'safetyCar',
    label: 'Safety Car',
    icon: <Car className="h-4 w-4" />,
    active: 'border-amber/50 bg-amber/15 text-amber',
    idle: 'text-muted hover:text-amber hover:border-amber/30',
  },
  {
    id: 'red',
    label: 'Roja',
    icon: <ShieldAlert className="h-4 w-4" />,
    active: 'border-red/50 bg-red/15 text-red',
    idle: 'text-muted hover:text-red hover:border-red/30',
  },
  {
    id: 'chequered',
    label: 'A cuadros',
    icon: <CheckeredIcon />,
    active: 'border-text/40 bg-text/10 text-text',
    idle: 'text-muted hover:text-text hover:border-line-strong',
  },
]

function CheckeredIcon() {
  return (
    <span className="grid h-4 w-4 grid-cols-2 grid-rows-2 overflow-hidden rounded-[3px] border border-current">
      <span className="bg-current" />
      <span />
      <span />
      <span className="bg-current" />
    </span>
  )
}

export function RaceControls({ compact = false }: { compact?: boolean }) {
  const role = useSession((state) => state.role)
  const pushToast = useSession((state) => state.pushToast)
  const settings = useSession((state) => state.settings)
  const updateSettings = useSession((state) => state.updateSettings)
  const { flag, status, isRunning, setFlag, toggleRunning, reset } = useRace()
  const clockMs = useRace((state) => state.clockMs)
  const canControl = can(role, 'race:control')

  const handleFlag = (next: FlagType) => {
    if (!canControl) {
      pushToast({
        tone: 'warning',
        title: 'Permiso insuficiente',
        description: 'Solo Dirección de Carrera u Organización pueden cambiar las banderas.',
      })
      return
    }
    setFlag(next)
    pushToast({
      tone: next === 'red' ? 'error' : next === 'chequered' ? 'info' : 'success',
      title: `Bandera ${flagOptions.find((option) => option.id === next)?.label.toLowerCase()} activada`,
      description:
        next === 'red'
          ? 'La sesión queda suspendida y el reloj detenido.'
          : next === 'chequered'
            ? 'Resultados provisionales listos para revisión.'
            : 'El estado se ha difundido al live timing.',
    })
  }

  const handleReset = () => {
    if (!canControl) return
    if (window.confirm('¿Reiniciar la simulación de la Carrera 2 al estado inicial?')) {
      reset()
      pushToast({ tone: 'info', title: 'Sesión reiniciada', description: 'La simulación vuelve a la vuelta 18.' })
    }
  }

  return (
    <div className={cn('space-y-3', compact && 'space-y-2.5')}>
      <div className="flex items-center justify-between">
        <span className="label">Control de carrera</span>
        {!canControl ? <Badge tone="neutral">Solo lectura</Badge> : <Badge tone="accent" dot>Autorizado</Badge>}
      </div>

      <div className="grid grid-cols-2 gap-2">
        {flagOptions.map((option) => (
          <button
            key={option.id}
            onClick={() => handleFlag(option.id)}
            aria-pressed={flag === option.id}
            className={cn(
              'flex h-10 items-center justify-center gap-2 rounded-lg border border-line bg-surface-2 px-2 text-[11px] font-semibold uppercase tracking-wider transition-all',
              flag === option.id ? option.active : option.idle,
              option.id === 'chequered' && 'col-span-2',
              !canControl && 'cursor-not-allowed opacity-60',
            )}
          >
            {option.icon}
            {option.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          className="flex-1"
          onClick={toggleRunning}
          disabled={!canControl || status === 'finished'}
        >
          {isRunning ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
          {isRunning ? 'Pausar' : 'Reanudar'}
        </Button>
        <select
          value={settings.simulationSpeed}
          onChange={(event) =>
            updateSettings({ simulationSpeed: Number(event.target.value) as 1 | 2 | 4 })
          }
          className="h-8 rounded-lg border border-line bg-surface-2 px-2 text-xs text-muted outline-none focus:border-accent/50"
          aria-label="Velocidad de simulación"
        >
          <option value={1}>1×</option>
          <option value={2}>2×</option>
          <option value={4}>4×</option>
        </select>
        <Button variant="ghost" size="icon" onClick={handleReset} disabled={!canControl} aria-label="Reiniciar sesión">
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex items-center justify-between rounded-lg border border-line bg-surface-2/60 px-3 py-2">
        <span className="text-[10px] uppercase tracking-widest text-dim">Reloj oficial</span>
        <span className="num font-mono text-sm font-semibold text-text">{formatClock(clockMs)}</span>
      </div>
    </div>
  )
}

const flagBannerConfig: Record<
  FlagType,
  { label: string; detail: string; className: string; icon: React.ReactNode }
> = {
  green: {
    label: 'Pista libre',
    detail: 'Bandera verde · Sector 1, 2 y 3',
    className: 'border-green/30 bg-green/10 text-green',
    icon: <Flag className="h-5 w-5" />,
  },
  yellow: {
    label: 'Precaución',
    detail: 'Bandera amarilla · Sector 2 · Adelantamientos prohibidos',
    className: 'border-amber/30 bg-amber/10 text-amber',
    icon: <Flag className="h-5 w-5" />,
  },
  safetyCar: {
    label: 'Safety Car',
    detail: 'Pelotón neutralizado · Sin adelantamientos',
    className: 'border-amber/30 bg-amber/10 text-amber',
    icon: <Car className="h-5 w-5" />,
  },
  red: {
    label: 'Sesión suspendida',
    detail: 'Bandera roja · Reloj detenido · Regreso a boxes',
    className: 'border-red/30 bg-red/10 text-red',
    icon: <ShieldAlert className="h-5 w-5" />,
  },
  chequered: {
    label: 'Finalizada',
    detail: 'Bandera a cuadros · Resultados provisionales',
    className: 'border-text/25 bg-text/10 text-text',
    icon: <CheckeredIcon />,
  },
}

export function FlagBanner({ showDetail = true }: { showDetail?: boolean }) {
  const flag = useRace((state) => state.flag)
  const config = flagBannerConfig[flag]
  const isAlert = flag === 'yellow' || flag === 'safetyCar' || flag === 'red'

  return (
    <div className={cn('flex items-center gap-3 rounded-xl border px-3.5 py-2.5', config.className)}>
      {config.icon}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-widest">{config.label}</span>
          {isAlert ? <AlertTriangle className="h-3.5 w-3.5" /> : null}
        </div>
        {showDetail ? <p className="truncate text-[11px] opacity-80">{config.detail}</p> : null}
      </div>
    </div>
  )
}
