import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { Database, Pencil, Plus, RefreshCw, Trash2, Upload } from 'lucide-react'
import {
  championship,
  circuits,
  drivers,
  events,
  standings,
  teamStandings,
  teams,
  vehicles,
} from '@/data/seed'
import { useCompetition } from '@/store/useCompetition'
import { ConfirmDeleteModal } from '@/components/ConfirmDeleteModal'
import { Badge, Button, Card, CardHeader, EmptyState, Field, Input, Modal, Textarea } from '@/components/ui'

const catalogues = {
  teams: { label: 'Equipos', template: teams[0] },
  drivers: { label: 'Pilotos', template: drivers[0] },
  vehicles: { label: 'Vehículos', template: vehicles[0] },
  championships: { label: 'Campeonatos', template: championship },
  circuits: { label: 'Circuitos', template: circuits[0] },
  events: { label: 'Eventos', template: events[0] },
  standings: { label: 'Clasificación de pilotos', template: standings[0] },
  teamStandings: { label: 'Clasificación de equipos', template: teamStandings[0] },
}

type Catalogue = keyof typeof catalogues
type RecordData = Record<string, unknown>

const demoData: Record<Catalogue, object[]> = {
  teams,
  drivers,
  vehicles,
  championships: [championship],
  circuits,
  events,
  standings,
  teamStandings,
}

function blankTemplate(value: unknown): unknown {
  if (Array.isArray(value)) return []
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        key === 'id' ? '' : blankTemplate(item),
      ]),
    )
  }
  if (typeof value === 'string') return ''
  if (typeof value === 'number') return 0
  if (typeof value === 'boolean') return false
  return value
}

function displayName(record: RecordData): string {
  if (typeof record.displayName === 'string' && record.displayName) return record.displayName
  if (typeof record.name === 'string' && record.name) return record.name
  if (typeof record.firstName === 'string' || typeof record.lastName === 'string') {
    return `${record.firstName ?? ''} ${record.lastName ?? ''}`.trim() || 'Registro sin nombre'
  }
  if (typeof record.teamId === 'string' && typeof record.position === 'number') {
    return `Posición ${record.position} · ${record.teamId}`
  }
  return String(record.id ?? 'Registro sin nombre')
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  })
  const body = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(typeof body.error === 'string' ? body.error : `Error HTTP ${response.status}`)
  }
  return body as T
}

export function DatabaseManager() {
  const [catalogue, setCatalogue] = useState<Catalogue>('teams')
  const [records, setRecords] = useState<RecordData[]>([])
  const [counts, setCounts] = useState<Partial<Record<Catalogue, number>>>({})
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deletingRecord, setDeletingRecord] = useState<RecordData | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [jsonText, setJsonText] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [connected, setConnected] = useState<boolean | null>(null)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  const refresh = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [nextRecords, nextCounts] = await Promise.all([
        request<RecordData[]>(`/api/${catalogue}`),
        request<Partial<Record<Catalogue, number>>>('/api/counts'),
      ])
      setRecords(nextRecords)
      setCounts(nextCounts)
      setConnected(true)
    } catch (reason) {
      setConnected(false)
      setError(reason instanceof Error ? reason.message : 'No se pudo cargar la base de datos.')
    } finally {
      setLoading(false)
    }
  }, [catalogue])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const filteredRecords = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return records
    return records.filter((record) =>
      `${displayName(record)} ${String(record.id ?? '')}`.toLowerCase().includes(term),
    )
  }, [records, search])

  const isEmptyDatabase = Object.values(counts).length > 0 && Object.values(counts).every((count) => count === 0)

  const openNewRecord = () => {
    setEditingId(null)
    setJsonText(JSON.stringify(blankTemplate(catalogues[catalogue].template), null, 2))
    setEditorOpen(true)
  }

  const openExistingRecord = (record: RecordData) => {
    setEditingId(String(record.id))
    setJsonText(JSON.stringify(record, null, 2))
    setEditorOpen(true)
  }

  const deleteCurrentRecord = async () => {
    if (!deletingRecord || !deletingRecord.id) return
    setIsDeleting(true)
    setError('')
    try {
      await request(`/api/${catalogue}/${encodeURIComponent(String(deletingRecord.id))}`, {
        method: 'DELETE',
      })
      setDeletingRecord(null)
      await refresh()
      void useCompetition.getState().syncFromApi()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo eliminar el registro.')
    } finally {
      setIsDeleting(false)
    }
  }

  const saveRecord = async (event: FormEvent) => {
    event.preventDefault()
    let record: RecordData
    try {
      const parsed: unknown = JSON.parse(jsonText)
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        throw new Error('El registro debe ser un objeto JSON.')
      }
      record = parsed as RecordData
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'El JSON no es válido.')
      return
    }

    setSaving(true)
    setError('')
    try {
      if (editingId) {
        await request(`/api/${catalogue}/${encodeURIComponent(editingId)}`, {
          method: 'PUT',
          body: JSON.stringify(record),
        })
      } else {
        await request(`/api/${catalogue}`, { method: 'POST', body: JSON.stringify(record) })
      }
      setEditorOpen(false)
      await refresh()
      void useCompetition.getState().syncFromApi()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo guardar el registro.')
    } finally {
      setSaving(false)
    }
  }

  const loadDemoData = async () => {
    setSaving(true)
    setError('')
    try {
      await request('/api/bootstrap', { method: 'POST', body: JSON.stringify(demoData) })
      await refresh()
      void useCompetition.getState().syncFromApi()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudieron cargar los datos iniciales.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <Card className="p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Badge tone={connected === false ? 'red' : connected ? 'green' : 'neutral'}>
                <Database className="h-3 w-3" />
                {connected === false ? 'Sin conexión' : connected ? 'MySQL conectado' : 'Conectando…'}
              </Badge>
              <Badge tone="neutral">{records.length} registros</Badge>
            </div>
            <h2 className="text-sm font-semibold text-text">Catálogos de la competición</h2>
            <p className="mt-1 max-w-2xl text-xs leading-relaxed text-muted">
              Agrega y edita los datos guardados en MySQL. Los campos se muestran como JSON para conservar
              completos los datos anidados, como sesiones, documentos y resultados.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {isEmptyDatabase ? (
              <Button size="sm" variant="secondary" onClick={loadDemoData} disabled={saving}>
                <Upload className="h-3.5 w-3.5" />
                Cargar datos de ejemplo
              </Button>
            ) : null}
            <Button size="sm" variant="secondary" onClick={() => void refresh()} disabled={loading}>
              <RefreshCw className="h-3.5 w-3.5" />
              Actualizar
            </Button>
            <Button size="sm" onClick={openNewRecord} disabled={connected === false}>
              <Plus className="h-3.5 w-3.5" />
              Agregar registro
            </Button>
          </div>
        </div>
        {error ? <p role="alert" className="mt-3 rounded-lg border border-red/25 bg-red/10 px-3 py-2 text-xs text-red">{error}</p> : null}
      </Card>

      <div className="grid gap-4 lg:grid-cols-[230px_minmax(0,1fr)]">
        <Card className="h-fit p-2">
          <p className="label px-2 py-2">Catálogo</p>
          <div className="space-y-1">
            {(Object.keys(catalogues) as Catalogue[]).map((key) => (
              <button
                key={key}
                onClick={() => {
                  setCatalogue(key)
                  setSearch('')
                }}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs transition-colors ${
                  catalogue === key ? 'bg-accent/10 text-accent' : 'text-muted hover:bg-surface-2 hover:text-text'
                }`}
              >
                <span>{catalogues[key].label}</span>
                <span className="num text-[10px]">{counts[key] ?? '—'}</span>
              </button>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader
            title={catalogues[catalogue].label}
            subtitle={loading ? 'Cargando registros…' : `${filteredRecords.length} registros`}
            icon={<Database className="h-4 w-4" />}
            action={
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar por nombre o id…"
                className="h-8 w-44 text-xs sm:w-60"
                aria-label="Buscar registros"
              />
            }
          />
          {loading ? (
            <p className="px-5 py-8 text-center text-xs text-muted">Cargando…</p>
          ) : filteredRecords.length === 0 ? (
            <EmptyState
              title="No hay registros"
              description="Agrega un registro o carga los datos de ejemplo para comenzar."
              action={
                <Button size="sm" onClick={openNewRecord} disabled={connected === false}>
                  <Plus className="h-3.5 w-3.5" />
                  Agregar
                </Button>
              }
            />
          ) : (
            <div className="divide-y divide-line/70">
              {filteredRecords.map((record) => (
                <div key={String(record.id)} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-text">{displayName(record)}</p>
                    <p className="num mt-1 truncate font-mono text-[10px] text-dim">{String(record.id ?? '')}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Button variant="ghost" size="sm" onClick={() => openExistingRecord(record)}>
                      <Pencil className="h-3.5 w-3.5" />
                      Editar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red hover:bg-red/10 hover:text-red"
                      onClick={() => setDeletingRecord(record)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Eliminar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Modal
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        title={editingId ? 'Editar registro' : `Agregar ${catalogues[catalogue].label.toLowerCase()}`}
        description="Edita el objeto JSON completo. El campo id identifica el registro."
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditorOpen(false)}>Cancelar</Button>
            <Button type="submit" form="record-editor" disabled={saving}>
              {saving ? 'Guardando…' : 'Guardar'}
            </Button>
          </>
        }
      >
        <form id="record-editor" onSubmit={saveRecord} className="space-y-3">
          <Field label="Datos del registro" hint="Debe ser un objeto JSON válido. Los arreglos y objetos anidados también se pueden editar.">
            <Textarea
              value={jsonText}
              onChange={(event) => setJsonText(event.target.value)}
              className="min-h-[360px] font-mono text-xs leading-relaxed"
              spellCheck={false}
              required
            />
          </Field>
          {error ? <p role="alert" className="text-xs text-red">{error}</p> : null}
        </form>
      </Modal>

      <ConfirmDeleteModal
        open={Boolean(deletingRecord)}
        onClose={() => setDeletingRecord(null)}
        onConfirm={deleteCurrentRecord}
        title={`Eliminar ${catalogues[catalogue].label.slice(0, -1)}`}
        itemName={deletingRecord ? displayName(deletingRecord) : ''}
        itemType="el registro"
        loading={isDeleting}
      />
    </div>
  )
}
