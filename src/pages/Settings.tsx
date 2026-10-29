import { useNavigate } from 'react-router-dom'
import {
  Bell,
  Gauge,
  Info,
  LayoutDashboard,
  LogOut,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  UserRound,
} from 'lucide-react'
import { roleMeta, roleOrder } from '@/lib/permissions'
import { cn } from '@/lib/utils'
import { useSession } from '@/store/useSession'
import {
  Badge,
  Button,
  Card,
  CardHeader,
  Field,
  PageHeader,
  Select,
} from '@/components/ui'
import type { AppSettings, Role } from '@/types'

function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean
  onChange: (value: boolean) => void
  label: string
  description: string
}) {
  return (
    <div className="flex items-start justify-between gap-4 px-4 py-3">
      <div className="min-w-0">
        <p className="text-xs font-semibold text-text">{label}</p>
        <p className="mt-0.5 text-[10px] leading-relaxed text-muted">{description}</p>
      </div>
      <button
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative mt-0.5 h-5 w-9 shrink-0 rounded-full border transition-colors',
          checked ? 'border-accent/50 bg-accent/30' : 'border-line-strong bg-surface-3',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 h-3.5 w-3.5 rounded-full transition-all',
            checked ? 'left-[18px] bg-accent' : 'left-0.5 bg-dim',
          )}
        />
      </button>
    </div>
  )
}

export function SettingsPage() {
  const role = useSession((state) => state.role)
  const user = useSession((state) => state.user)
  const setRole = useSession((state) => state.setRole)
  const settings = useSession((state) => state.settings)
  const updateSettings = useSession((state) => state.updateSettings)
  const logout = useSession((state) => state.logout)
  const pushToast = useSession((state) => state.pushToast)
  const navigate = useNavigate()

  const meta = roleMeta[role]

  const handleSetting = <K extends keyof AppSettings>(key: K, value: AppSettings[K], label: string) => {
    updateSettings({ [key]: value } as Partial<AppSettings>)
    pushToast({
      tone: 'info',
      title: label,
      description: 'La preferencia se guardó en este navegador.',
    })
  }

  const handleRole = (next: Role) => {
    setRole(next)
    pushToast({
      tone: 'info',
      title: `Rol activo: ${roleMeta[next].label}`,
      description: roleMeta[next].description,
    })
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleReset = () => {
    updateSettings({
      compact: false,
      showSectors: true,
      autoScroll: true,
      simulationSpeed: 1,
      pushResults: true,
      pushFlags: true,
      pushEntries: true,
    })
    pushToast({ tone: 'success', title: 'Preferencias restauradas', description: 'Se aplicaron los valores por defecto.' })
  }

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow={
          <Badge tone="accent">
            <Sparkles className="h-3 w-3" />
            Personalización
          </Badge>
        }
        title="Ajustes"
        description="Perfil, preferencias de la consola, simulación y notificaciones. Los cambios se guardan localmente en este navegador."
        actions={
          <Button variant="secondary" size="sm" onClick={handleReset}>
            <RotateCcw className="h-3.5 w-3.5" />
            Restaurar
          </Button>
        }
      />

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader title="Perfil activo" subtitle="Sesión de demostración" icon={<UserRound className="h-4 w-4" />} />
          <div className="p-4">
            <div className="flex items-center gap-3">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-xl border font-display text-base font-bold"
                style={{
                  color: meta.accent,
                  borderColor: `${meta.accent}44`,
                  backgroundColor: `${meta.accent}12`,
                }}
              >
                {user.initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-text">{user.name}</p>
                <p className="truncate text-[11px] text-muted">{user.email}</p>
                <Badge tone="neutral" className="mt-1.5">
                  {meta.label}
                </Badge>
              </div>
            </div>

            <div className="mt-4">
              <Field label="Rol activo" hint={meta.description}>
                <Select value={role} onChange={(event) => handleRole(event.target.value as Role)}>
                  {roleOrder.map((item) => (
                    <option key={item} value={item}>
                      {roleMeta[item].label} — {roleMeta[item].permissions.length} permisos
                    </option>
                  ))}
                </Select>
              </Field>
            </div>

            <div className="mt-4 flex flex-wrap gap-1.5">
              {meta.permissions.length ? (
                meta.permissions.map((permission) => (
                  <span
                    key={permission}
                    className="rounded-md border border-line bg-surface-2 px-2 py-0.5 font-mono text-[9px] text-muted"
                  >
                    {permission}
                  </span>
                ))
              ) : (
                <span className="text-[10px] text-dim">Este rol solo tiene acceso de consulta.</span>
              )}
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader title="Apariencia de la consola" subtitle="Ajustes visuales" icon={<LayoutDashboard className="h-4 w-4" />} />
          <div className="divide-y divide-line/70">
            <Toggle
              checked={settings.compact}
              onChange={(value) => handleSetting('compact', value, value ? 'Modo compacto activado' : 'Modo compacto desactivado')}
              label="Modo compacto"
              description="Reduce la altura de las filas en las tablas de cronometraje."
            />
            <Toggle
              checked={settings.showSectors}
              onChange={(value) => handleSetting('showSectors', value, value ? 'Sectores visibles' : 'Sectores ocultos')}
              label="Mostrar sectores"
              description="Muestra S1, S2 y S3 en la tabla de live timing."
            />
            <Toggle
              checked={settings.autoScroll}
              onChange={(value) => handleSetting('autoScroll', value, 'Desplazamiento automático')}
              label="Desplazamiento automático del feed"
              description="Mantiene los eventos más recientes visibles en Race Control."
            />
          </div>
        </Card>

        <Card>
          <CardHeader title="Simulación de carrera" subtitle="Motor local de demostración" icon={<Gauge className="h-4 w-4" />} />
          <div className="p-4">
            <p className="text-[11px] leading-relaxed text-muted">
              La carrera se ejecuta en el navegador. Elige la velocidad del reloj: cada tick representa 6 segundos
              de sesión.
            </p>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {([1, 2, 4] as const).map((speed) => (
                <button
                  key={speed}
                  onClick={() => {
                    updateSettings({ simulationSpeed: speed })
                    pushToast({
                      tone: 'info',
                      title: `Velocidad ${speed}×`,
                      description: 'La simulación se actualizará al nuevo ritmo.',
                    })
                  }}
                  className={cn(
                    'rounded-xl border px-3 py-3 text-center transition-colors',
                    settings.simulationSpeed === speed
                      ? 'border-accent/40 bg-accent/10'
                      : 'border-line bg-surface-2 hover:border-line-strong',
                  )}
                >
                  <p
                    className={cn(
                      'num font-display text-2xl font-semibold',
                      settings.simulationSpeed === speed ? 'text-accent' : 'text-text',
                    )}
                  >
                    {speed}×
                  </p>
                  <p className="mt-0.5 text-[9px] uppercase tracking-wider text-dim">
                    {speed === 1 ? 'Normal' : speed === 2 ? 'Rápida' : 'Máxima'}
                  </p>
                </button>
              ))}
            </div>
            <div className="mt-3 flex items-center justify-between rounded-lg border border-line bg-surface-2 px-3 py-2 text-[10px]">
              <span className="text-dim">Intervalo efectivo</span>
              <span className="num font-mono text-muted">{(2000 / settings.simulationSpeed).toFixed(0)} ms</span>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader title="Notificaciones" subtitle="Solo en esta demostración" icon={<Bell className="h-4 w-4" />} />
          <div className="divide-y divide-line/70">
            <Toggle
              checked={settings.pushResults}
              onChange={(value) => handleSetting('pushResults', value, 'Notificaciones de resultados')}
              label="Resultados oficiales"
              description="Avisar cuando se publiquen resultados de una sesión."
            />
            <Toggle
              checked={settings.pushFlags}
              onChange={(value) => handleSetting('pushFlags', value, 'Notificaciones de banderas')}
              label="Cambios de bandera"
              description="Recibir avisos de amarillas, safety car y bandera roja."
            />
            <Toggle
              checked={settings.pushEntries}
              onChange={(value) => handleSetting('pushEntries', value, 'Notificaciones de inscripciones')}
              label="Inscripciones y verificaciones"
              description="Avisar de altas, bajas y cambios en la lista de inscritos."
            />
          </div>
        </Card>

        <Card>
          <CardHeader title="Seguridad de la sesión" subtitle="Entorno de demostración" icon={<ShieldCheck className="h-4 w-4" />} />
          <div className="p-4">
            <div className="rounded-lg border border-line bg-surface-2 px-3 py-2.5 text-[11px] leading-relaxed text-muted">
              No se envían datos a ningún servidor. La autenticación es simulada y el rol se guarda en
              <span className="font-mono text-text"> localStorage</span>.
            </div>
            <div className="mt-3 space-y-2">
              <Button variant="secondary" className="w-full" onClick={() => navigate('/administracion')}>
                <ShieldCheck className="h-4 w-4" />
                Ir a administración
              </Button>
              <Button variant="danger" className="w-full" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
                Cerrar sesión
              </Button>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader title="Acerca de Apex" subtitle="Información de la aplicación" icon={<Info className="h-4 w-4" />} />
          <div className="divide-y divide-line/70">
            {[
              ['Producto', 'Apex Race Control'],
              ['Versión', '1.0.0 · demo'],
              ['Frontend', 'React 19 + TypeScript'],
              ['Estilos', 'Tailwind CSS 4'],
              ['Estado', 'Zustand 5'],
              ['Gráficas', 'Recharts 3'],
              ['Datos', 'Ficticios · simulación local'],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between px-4 py-2.5">
                <span className="text-[11px] text-muted">{label}</span>
                <span className="text-[11px] font-medium text-text">{value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
