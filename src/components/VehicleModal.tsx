import { useEffect, useState, type FormEvent } from 'react'
import { Plus, Save } from 'lucide-react'
import { useCompetition } from '@/store/useCompetition'
import { Button, Field, Input, Modal, Select, Textarea } from '@/components/ui'
import type { Vehicle } from '@/types'

interface VehicleModalProps {
  open: boolean
  onClose: () => void
  vehicle?: Vehicle | null // if provided, editing mode; if null/undefined, insert mode
  onSuccess?: (vehicle: Vehicle) => void
}

export function VehicleModal({ open, onClose, vehicle, onSuccess }: VehicleModalProps) {
  const teams = useCompetition((state) => state.teams)
  const addVehicle = useCompetition((state) => state.addVehicle)
  const updateVehicle = useCompetition((state) => state.updateVehicle)

  const isEditing = Boolean(vehicle?.id)

  const [make, setMake] = useState('')
  const [model, setModel] = useState('')
  const [number, setNumber] = useState('77')
  const [year, setYear] = useState('2026')
  const [teamId, setTeamId] = useState('')
  const [category, setCategory] = useState<Vehicle['category']>('GT3 Pro')
  const [status, setStatus] = useState<Vehicle['status']>('approved')
  const [color, setColor] = useState('#c9f73a')
  const [engine, setEngine] = useState('4.0L Boxer-6 Atmosférico')
  const [displacement, setDisplacement] = useState('3,996 cc')
  const [powerHp, setPowerHp] = useState('565')
  const [torqueNm, setTorqueNm] = useState('530')
  const [weightKg, setWeightKg] = useState('1250')
  const [minWeightKg, setMinWeightKg] = useState('1250')
  const [drivetrain, setDrivetrain] = useState('RWD')
  const [transmission, setTransmission] = useState('Secuencial 6 velocidades')
  const [fuel, setFuel] = useState('100 RON Biofuel')
  const [fuelCapacity, setFuelCapacity] = useState('120')
  const [tire, setTire] = useState('Pirelli P Zero DHF 325/705-18')
  const [homologation, setHomologation] = useState('FIA-GT3-2026')
  const [vin, setVin] = useState('')
  const [transponder, setTransponder] = useState('')
  const [inspector, setInspector] = useState('J. Lima (Scrutineer)')
  const [inspectionDate, setInspectionDate] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (vehicle) {
      setMake(vehicle.make || '')
      setModel(vehicle.model || '')
      setNumber(String(vehicle.number || ''))
      setYear(String(vehicle.year || '2026'))
      setTeamId(vehicle.teamId || teams[0]?.id || '')
      setCategory(vehicle.category || 'GT3 Pro')
      setStatus(vehicle.status || 'approved')
      setColor(vehicle.color || '#c9f73a')
      setEngine(vehicle.engine || '')
      setDisplacement(vehicle.displacement || '')
      setPowerHp(String(vehicle.powerHp || '550'))
      setTorqueNm(String(vehicle.torqueNm || '520'))
      setWeightKg(String(vehicle.weightKg || '1250'))
      setMinWeightKg(String(vehicle.minWeightKg || '1250'))
      setDrivetrain(vehicle.drivetrain || 'RWD')
      setTransmission(vehicle.transmission || '')
      setFuel(vehicle.fuel || '')
      setFuelCapacity(String(vehicle.fuelCapacity || '120'))
      setTire(vehicle.tire || '')
      setHomologation(vehicle.homologation || '')
      setVin(vehicle.vin || '')
      setTransponder(vehicle.transponder || '')
      setInspector(vehicle.inspector || '')
      setInspectionDate(vehicle.inspectionDate || '')
      setNotes(vehicle.notes || '')
    } else {
      // Defaults for new vehicle
      setMake('Porsche')
      setModel('911 GT3 R')
      setNumber('77')
      setYear('2026')
      setTeamId(teams[0]?.id || '')
      setCategory('GT3 Pro')
      setStatus('approved')
      setColor('#c9f73a')
      setEngine('4.0L Boxer-6 Atmosférico')
      setDisplacement('3,996 cc')
      setPowerHp('565')
      setTorqueNm('530')
      setWeightKg('1250')
      setMinWeightKg('1250')
      setDrivetrain('RWD')
      setTransmission('Secuencial 6 velocidades con levas')
      setFuel('100 RON Biofuel de competición')
      setFuelCapacity('120')
      setTire('Pirelli P Zero DHF 325/705-18')
      setHomologation(`FIA-GT3-${Math.floor(100 + Math.random() * 900)}`)
      setVin(`WP0ZZZ99ZTS${Math.floor(100000 + Math.random() * 900000)}`)
      setTransponder(`TX-${Math.floor(1000 + Math.random() * 9000)}`)
      setInspector('Comisario Técnico FIA')
      setInspectionDate(new Date().toISOString().slice(0, 10))
      setNotes('Vehículo verificado en parque cerrado conforme a normativa BoP.')
    }
    setError('')
  }, [vehicle, open, teams])

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!make.trim() || !model.trim()) {
      setError('La marca y el modelo son obligatorios.')
      return
    }
    const num = Number(number)
    if (!num || num <= 0) {
      setError('El dorsal debe ser un número entero mayor a cero.')
      return
    }

    setLoading(true)
    setError('')

    const payload: Partial<Vehicle> = {
      make: make.trim(),
      model: model.trim(),
      number: num,
      year: Number(year) || 2026,
      teamId: teamId || teams[0]?.id || 't-aurora',
      category,
      status,
      color: color.trim() || '#c9f73a',
      engine: engine.trim(),
      displacement: displacement.trim(),
      powerHp: Number(powerHp) || 550,
      torqueNm: Number(torqueNm) || 520,
      weightKg: Number(weightKg) || 1250,
      minWeightKg: Number(minWeightKg) || 1250,
      drivetrain: drivetrain.trim(),
      transmission: transmission.trim(),
      fuel: fuel.trim(),
      fuelCapacity: Number(fuelCapacity) || 120,
      tire: tire.trim(),
      homologation: homologation.trim(),
      vin: vin.trim(),
      transponder: transponder.trim(),
      inspector: inspector.trim(),
      inspectionDate: inspectionDate || new Date().toISOString().slice(0, 10),
      notes: notes.trim(),
    }

    try {
      let saved: Vehicle
      if (isEditing && vehicle?.id) {
        saved = await updateVehicle(vehicle.id, payload)
      } else {
        saved = await addVehicle(payload)
      }
      onSuccess?.(saved)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar el vehículo')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEditing ? `Modificar Vehículo: #${vehicle?.number} ${vehicle?.make}` : 'Registrar Nuevo Vehículo'}
      description="Completa las especificaciones técnicas, motor, homologación y estado del vehículo."
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button type="submit" form="vehicle-form" disabled={loading}>
            {loading ? (
              'Guardando…'
            ) : isEditing ? (
              <>
                <Save className="h-4 w-4" />
                Actualizar Vehículo
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                Registrar Vehículo
              </>
            )}
          </Button>
        </>
      }
    >
      <form id="vehicle-form" onSubmit={handleSubmit} className="space-y-4">
        {error ? (
          <div role="alert" className="rounded-lg border border-red/30 bg-red/10 px-3.5 py-2 text-xs text-red">
            {error}
          </div>
        ) : null}

        {/* Sección: Identificación del Chasis */}
        <div className="space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-accent">
            Ficha del Chasis
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Marca *">
              <Input
                value={make}
                onChange={(e) => setMake(e.target.value)}
                placeholder="Ej. Porsche, Ferrari, BMW"
                required
              />
            </Field>
            <Field label="Modelo *">
              <Input
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="Ej. 911 GT3 R"
                required
              />
            </Field>
            <Field label="Dorsal / Número *">
              <Input
                type="number"
                min="1"
                max="999"
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                required
              />
            </Field>
          </div>

          <div className="grid gap-3 sm:grid-cols-4">
            <Field label="Año">
              <Input
                type="number"
                value={year}
                onChange={(e) => setYear(e.target.value)}
              />
            </Field>
            <Field label="Equipo Asignado">
              <Select value={teamId} onChange={(e) => setTeamId(e.target.value)}>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Categoría">
              <Select
                value={category}
                onChange={(e) => setCategory(e.target.value as Vehicle['category'])}
              >
                <option value="GT3 Pro">GT3 Pro</option>
                <option value="GT3 Pro-Am">GT3 Pro-Am</option>
                <option value="GT4">GT4</option>
              </Select>
            </Field>
            <Field label="Estado Scrutineering">
              <Select
                value={status}
                onChange={(e) => setStatus(e.target.value as Vehicle['status'])}
              >
                <option value="approved">Aprobado</option>
                <option value="pending">Pendiente</option>
                <option value="observed">Observado</option>
                <option value="rejected">Rechazado</option>
              </Select>
            </Field>
          </div>
        </div>

        {/* Sección: Motor y Prestaciones */}
        <div className="space-y-3 border-t border-line/60 pt-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-accent">
            Motor y Prestaciones
          </p>
          <div className="grid gap-3 sm:grid-cols-4">
            <Field label="Configuración Motor" className="sm:col-span-2">
              <Input
                value={engine}
                onChange={(e) => setEngine(e.target.value)}
                placeholder="Ej. 4.0L Boxer-6 Atmosférico"
              />
            </Field>
            <Field label="Cilindrada">
              <Input
                value={displacement}
                onChange={(e) => setDisplacement(e.target.value)}
                placeholder="Ej. 3,996 cc"
              />
            </Field>
            <Field label="Color Distintivo">
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="h-9 w-10 cursor-pointer rounded border border-line bg-surface-2 p-0.5"
                />
                <Input
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  placeholder="#c9f73a"
                  className="font-mono text-xs"
                />
              </div>
            </Field>
          </div>

          <div className="grid gap-3 sm:grid-cols-4">
            <Field label="Potencia (HP)">
              <Input
                type="number"
                value={powerHp}
                onChange={(e) => setPowerHp(e.target.value)}
              />
            </Field>
            <Field label="Torque (Nm)">
              <Input
                type="number"
                value={torqueNm}
                onChange={(e) => setTorqueNm(e.target.value)}
              />
            </Field>
            <Field label="Peso Chasis (Kg)">
              <Input
                type="number"
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
              />
            </Field>
            <Field label="Peso Mínimo BoP (Kg)">
              <Input
                type="number"
                value={minWeightKg}
                onChange={(e) => setMinWeightKg(e.target.value)}
              />
            </Field>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Transmisión">
              <Input
                value={transmission}
                onChange={(e) => setTransmission(e.target.value)}
                placeholder="Secuencial 6 vel."
              />
            </Field>
            <Field label="Tracción">
              <Input
                value={drivetrain}
                onChange={(e) => setDrivetrain(e.target.value)}
                placeholder="RWD / AWD"
              />
            </Field>
            <Field label="Capacidad Tanque (L)">
              <Input
                type="number"
                value={fuelCapacity}
                onChange={(e) => setFuelCapacity(e.target.value)}
              />
            </Field>
          </div>
        </div>

        {/* Sección: Homologación e Inspección */}
        <div className="space-y-3 border-t border-line/60 pt-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-accent">
            Homologación y Verificación Técnica
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Homologación FIA">
              <Input
                value={homologation}
                onChange={(e) => setHomologation(e.target.value)}
                placeholder="FIA-GT3-2026"
              />
            </Field>
            <Field label="VIN / Número Chasis">
              <Input
                value={vin}
                onChange={(e) => setVin(e.target.value)}
                placeholder="WP0ZZZ99Z..."
              />
            </Field>
            <Field label="Transponder ID">
              <Input
                value={transponder}
                onChange={(e) => setTransponder(e.target.value)}
                placeholder="TX-4402"
              />
            </Field>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Inspector Técnico">
              <Input
                value={inspector}
                onChange={(e) => setInspector(e.target.value)}
                placeholder="Nombre del Scrutineer"
              />
            </Field>
            <Field label="Fecha de Inspección">
              <Input
                type="date"
                value={inspectionDate}
                onChange={(e) => setInspectionDate(e.target.value)}
              />
            </Field>
          </div>

          <Field label="Observaciones y Notas de Parque Cerrado">
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Detalles sobre pesos, lastres BoP o revisiones pendientes..."
            />
          </Field>
        </div>
      </form>
    </Modal>
  )
}
