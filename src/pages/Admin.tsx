import { useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import {
  Check,
  Clock,
  KeyRound,
  Plus,
  Search,
  ShieldAlert,
  ShieldCheck,
  UserPlus,
  Users,
  X,
} from 'lucide-react'
import { auditLog, users as seedUsers } from '@/data/seed'
import { can, roleMeta, roleOrder } from '@/lib/permissions'
import { cn } from '@/lib/utils'
import { useSession } from '@/store/useSession'
import { DatabaseManager } from '@/components/DatabaseManager'
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardHeader,
  EmptyState,
  Field,
  Input,
  Modal,
  PageHeader,
  Select,
  StatCard,
  Tabs,
} from '@/components/ui'
import type { Permission, Role, UserAccount } from '@/types'

const permissionLabels: Record<Permission, string> = {
  'event:manage': 'Gestionar eventos',
  'race:control': 'Control de carrera',
  'timing:write': 'Editar cronometraje',
  'penalty:write': 'Aplicar sanciones',
  'results:publish': 'Publicar resultados',
  'admin:users': 'Administrar usuarios',
  'medical:view': 'Ver datos médicos',
  'entry:own': 'Gestionar inscripción propia',
}

const allPermissions = Object.keys(permissionLabels) as Permission[]

const statusMeta = {
  active: { label: 'Activo', tone: 'green' as const },
  invited: { label: 'Invitado', tone: 'sky' as const },
  suspended: { label: 'Suspendido', tone: 'red' as const },
}

export function AdminPage() {
  const role = useSession((state) => state.role)
  const pushToast = useSession((state) => state.pushToast)
  const [tab, setTab] = useState('users')
  const [search, setSearch] = useState('')
  const [users, setUsers] = useState<UserAccount[]>(seedUsers)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', role: 'steward' as Role })

  const authorized = can(role, 'admin:users')

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return users
    return users.filter(
      (user) =>
        user.name.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term) ||
        roleMeta[user.role].label.toLowerCase().includes(term),
    )
  }, [users, search])

  if (!authorized) {
    return (
      <div className="space-y-5">
        <PageHeader
          eyebrow={<Badge tone="red">Acceso restringido</Badge>}
          title="Administración"
          description="La gestión de usuarios, roles y auditoría está reservada al rol Organizador."
        />
        <Card>
          <EmptyState
            icon={<ShieldAlert className="h-5 w-5" />}
            title="No tienes permiso para ver esta sección"
            description="Cambia tu rol activo a Organizador desde el selector superior para administrar la plataforma."
            action={
              <Link to="/">
                <Button variant="secondary">Volver al dashboard</Button>
              </Link>
            }
          />
        </Card>
      </div>
    )
  }

  const activeUsers = users.filter((user) => user.status === 'active').length
  const invited = users.filter((user) => user.status === 'invited').length
  const suspended = users.filter((user) => user.status === 'suspended').length

  const handleInvite = (event: FormEvent) => {
    event.preventDefault()
    if (!form.name.trim() || !form.email.trim()) {
      pushToast({ tone: 'error', title: 'Datos incompletos', description: 'Nombre y correo son obligatorios.' })
      return
    }
    const newUser: UserAccount = {
      id: `u-${Date.now()}`,
      name: form.name.trim(),
      email: form.email.trim(),
      role: form.role,
      status: 'invited',
      lastActive: '—',
    }
    setUsers((current) => [newUser, ...current])
    setInviteOpen(false)
    setForm({ name: '', email: '', role: 'steward' })
    pushToast({
      tone: 'success',
      title: 'Invitación enviada',
      description: `${newUser.name} recibirá acceso como ${roleMeta[newUser.role].label}.`,
    })
  }

  const toggleStatus = (user: UserAccount) => {
    const nextStatus: UserAccount['status'] =
      user.status === 'active' ? 'suspended' : user.status === 'suspended' ? 'active' : 'active'
    setUsers((current) =>
      current.map((item) =>
        item.id === user.id
          ? { ...item, status: nextStatus, lastActive: nextStatus === 'active' ? 'Ahora' : item.lastActive }
          : item,
      ),
    )
    pushToast({
      tone: nextStatus === 'active' ? 'success' : 'warning',
      title: nextStatus === 'active' ? 'Cuenta reactivada' : 'Cuenta suspendida',
      description:
        nextStatus === 'active'
          ? `${user.name} recupera el acceso a la plataforma.`
          : `${user.name} ya no puede iniciar sesión.`,
    })
  }

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow={
          <Badge tone="accent">
            <ShieldCheck className="h-3 w-3" />
            Organización
          </Badge>
        }
        title="Administración"
        description="Usuarios, datos de competición, roles, permisos y auditoría de la plataforma."
        actions={
          <Button size="sm" onClick={() => setInviteOpen(true)}>
            <UserPlus className="h-3.5 w-3.5" />
            Invitar usuario
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Usuarios totales" value={users.length} icon={<Users className="h-4 w-4" />} accent="accent" />
        <StatCard label="Cuentas activas" value={activeUsers} icon={<Check className="h-4 w-4" />} accent="green" />
        <StatCard label="Invitaciones pendientes" value={invited} icon={<Clock className="h-4 w-4" />} accent="sky" />
        <StatCard label="Cuentas suspendidas" value={suspended} icon={<ShieldAlert className="h-4 w-4" />} accent="red" />
      </div>

      <Tabs
        value={tab}
        onChange={setTab}
        items={[
          { id: 'users', label: 'Usuarios', count: users.length },
          { id: 'database', label: 'Base de datos' },
          { id: 'roles', label: 'Roles y permisos', count: roleOrder.length },
          { id: 'audit', label: 'Auditoría', count: auditLog.length },
        ]}
      />

      {tab === 'users' ? (
        <Card>
          <CardHeader
            title="Cuentas de la plataforma"
            subtitle={`${filtered.length} resultados`}
            icon={<Users className="h-4 w-4" />}
            action={
              <div className="relative w-44 sm:w-60">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-dim" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Buscar usuario o rol…"
                  className="h-8 pl-8 text-xs"
                />
              </div>
            }
          />
          {filtered.length === 0 ? (
            <EmptyState title="Sin usuarios" description="No hay cuentas que coincidan con la búsqueda." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left">
                <thead>
                  <tr className="border-b border-line text-[9px] uppercase tracking-[0.16em] text-dim">
                    <th className="px-4 py-2 font-semibold">Usuario</th>
                    <th className="px-3 py-2 font-semibold">Rol</th>
                    <th className="px-3 py-2 font-semibold">Estado</th>
                    <th className="px-3 py-2 font-semibold">Última actividad</th>
                    <th className="px-4 py-2 text-right font-semibold">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((user) => {
                    const status = statusMeta[user.status]
                    const meta = roleMeta[user.role]
                    return (
                      <tr key={user.id} className="border-b border-line/60 last:border-0">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar name={user.name} color={meta.accent} size="sm" />
                            <div className="min-w-0">
                              <p className="truncate text-xs font-semibold text-text">{user.name}</p>
                              <p className="truncate text-[10px] text-dim">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <span
                            className="inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold"
                            style={{
                              color: meta.accent,
                              borderColor: `${meta.accent}44`,
                              backgroundColor: `${meta.accent}12`,
                            }}
                          >
                            {meta.label}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <Badge tone={status.tone}>{status.label}</Badge>
                        </td>
                        <td className="px-3 py-3 text-[11px] text-muted">{user.lastActive}</td>
                        <td className="px-4 py-3 text-right">
                          <Button variant="ghost" size="sm" onClick={() => toggleStatus(user)}>
                            {user.status === 'suspended' ? 'Reactivar' : user.status === 'invited' ? 'Reenviar' : 'Suspender'}
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      ) : null}

      {tab === 'roles' ? (
        <div className="space-y-4">
          <Card>
            <CardHeader
              title="Matriz de permisos"
              subtitle="Lo que cada rol puede hacer en la plataforma"
              icon={<KeyRound className="h-4 w-4" />}
            />
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left">
                <thead>
                  <tr className="border-b border-line text-[9px] uppercase tracking-[0.14em] text-dim">
                    <th className="px-4 py-2 font-semibold">Permiso</th>
                    {roleOrder.map((item) => (
                      <th key={item} className="px-2 py-2 text-center font-semibold">
                        {roleMeta[item].short}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {allPermissions.map((permission) => (
                    <tr key={permission} className="border-b border-line/60 last:border-0">
                      <td className="px-4 py-2.5 text-[11px] font-medium text-text">{permissionLabels[permission]}</td>
                      {roleOrder.map((item) => {
                        const allowed = can(item, permission)
                        return (
                          <td key={item} className="px-2 py-2.5 text-center">
                            <span
                              className={cn(
                                'inline-flex h-5 w-5 items-center justify-center rounded border',
                                allowed
                                  ? 'border-green/30 bg-green/10 text-green'
                                  : 'border-line bg-surface-2 text-dim/50',
                              )}
                            >
                              {allowed ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                            </span>
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-line px-4 py-2.5 text-[9px] uppercase tracking-wider text-dim">
              {roleOrder.map((item) => (
                <span key={item} className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: roleMeta[item].accent }} />
                  {roleMeta[item].short} · {roleMeta[item].label}
                </span>
              ))}
            </div>
          </Card>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {roleOrder.map((item) => {
              const meta = roleMeta[item]
              return (
                <Card key={item} className="p-4">
                  <div className="flex items-center justify-between">
                    <span
                      className="flex h-9 w-9 items-center justify-center rounded-lg border font-display text-[10px] font-bold"
                      style={{
                        color: meta.accent,
                        borderColor: `${meta.accent}44`,
                        backgroundColor: `${meta.accent}12`,
                      }}
                    >
                      {meta.short}
                    </span>
                    <span className="num text-[10px] text-dim">{meta.permissions.length} permisos</span>
                  </div>
                  <p className="mt-3 text-xs font-semibold text-text">{meta.label}</p>
                  <p className="mt-1 text-[10px] leading-relaxed text-muted">{meta.description}</p>
                </Card>
              )
            })}
          </div>
        </div>
      ) : null}

      {tab === 'audit' ? (
        <Card>
          <CardHeader
            title="Registro de auditoría"
            subtitle="Acciones sensibles de las últimas 24 horas"
            icon={<Clock className="h-4 w-4" />}
            action={<Badge tone="neutral">{auditLog.length} eventos</Badge>}
          />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left">
              <thead>
                <tr className="border-b border-line text-[9px] uppercase tracking-[0.16em] text-dim">
                  <th className="px-4 py-2 font-semibold">Hora</th>
                  <th className="px-3 py-2 font-semibold">Actor</th>
                  <th className="px-3 py-2 font-semibold">Acción</th>
                  <th className="px-3 py-2 font-semibold">Entidad</th>
                  <th className="px-4 py-2 text-right font-semibold">IP</th>
                </tr>
              </thead>
              <tbody>
                {auditLog.map((entry) => (
                  <tr key={entry.id} className="border-b border-line/60 last:border-0">
                    <td className="num px-4 py-3 font-mono text-[10px] text-muted">{entry.time}</td>
                    <td className="px-3 py-3 text-[11px] font-medium text-text">{entry.actor}</td>
                    <td className="px-3 py-3 text-[11px] text-muted">{entry.action}</td>
                    <td className="max-w-[240px] truncate px-3 py-3 text-[11px] text-dim">{entry.entity}</td>
                    <td className="num px-4 py-3 text-right font-mono text-[10px] text-dim">{entry.ip}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t border-line px-4 py-2.5 text-[10px] text-dim">
            Los registros se conservan durante 12 meses y son inmutables.
          </div>
        </Card>
      ) : null}

      {tab === 'database' ? <DatabaseManager /> : null}

      <Modal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        title="Invitar usuario"
        description="Se enviará un enlace de acceso con el rol seleccionado."
        footer={
          <>
            <Button variant="ghost" onClick={() => setInviteOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleInvite}>
              <Plus className="h-4 w-4" />
              Enviar invitación
            </Button>
          </>
        }
      >
        <form onSubmit={handleInvite} className="space-y-4">
          <Field label="Nombre completo">
            <Input
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              placeholder="Nombre y apellidos"
            />
          </Field>
          <Field label="Correo electrónico">
            <Input
              type="email"
              value={form.email}
              onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
              placeholder="nombre@apexrace.io"
            />
          </Field>
          <Field label="Rol asignado" hint={roleMeta[form.role].description}>
            <Select
              value={form.role}
              onChange={(event) => setForm((current) => ({ ...current, role: event.target.value as Role }))}
            >
              {roleOrder.map((item) => (
                <option key={item} value={item}>
                  {roleMeta[item].label}
                </option>
              ))}
            </Select>
          </Field>
        </form>
      </Modal>
    </div>
  )
}
