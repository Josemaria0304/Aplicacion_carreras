import { useEffect, useState, type FormEvent } from 'react'
import { Plus, Save, UserCheck } from 'lucide-react'
import { useCompetition } from '@/store/useCompetition'
import { Button, Field, Input, Modal, Select, Textarea } from '@/components/ui'
import type { Driver } from '@/types'

interface DriverModalProps {
  open: boolean
  onClose: () => void
  driver?: Driver | null // if provided, editing mode; if null/undefined, insert mode
  onSuccess?: (driver: Driver) => void
}

export function DriverModal({ open, onClose, driver, onSuccess }: DriverModalProps) {
  const teams = useCompetition((state) => state.teams)
  const vehicles = useCompetition((state) => state.vehicles)
  const addDriver = useCompetition((state) => state.addDriver)
  const updateDriver = useCompetition((state) => state.updateDriver)

  const isEditing = Boolean(driver?.id)

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [number, setNumber] = useState('88')
  const [category, setCategory] = useState<Driver['category']>('GT3 Pro')
  const [teamId, setTeamId] = useState('')
  const [vehicleId, setVehicleId] = useState('')
  const [nationality, setNationality] = useState('España')
  const [countryCode, setCountryCode] = useState('ESP')
  const [flag, setFlag] = useState('🇪🇸')
  const [dob, setDob] = useState('1998-05-12')
  const [city, setCity] = useState('Madrid')
  const [license, setLicense] = useState('FIA-INT-2026')
  const [licenseClass, setLicenseClass] = useState('FIA Silver')
  const [licenseExpiry, setLicenseExpiry] = useState('2026-12-31')
  const [bloodType, setBloodType] = useState('O+')
  const [medicalExpiry, setMedicalExpiry] = useState('2026-11-30')
  const [emergencyContact, setEmergencyContact] = useState('+34 600 000 000')
  const [heightCm, setHeightCm] = useState('178')
  const [weightKg, setWeightKg] = useState('72')
  const [helmet, setHelmet] = useState('Diseño oficial con visera iridium')
  const [bio, setBio] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (driver) {
      setFirstName(driver.firstName || '')
      setLastName(driver.lastName || '')
      setDisplayName(driver.displayName || '')
      setNumber(String(driver.number || ''))
      setCategory(driver.category || 'GT3 Pro')
      setTeamId(driver.teamId || teams[0]?.id || '')
      setVehicleId(driver.vehicleId || vehicles[0]?.id || '')
      setNationality(driver.nationality || '')
      setCountryCode(driver.countryCode || '')
      setFlag(driver.flag || '🏁')
      setDob(driver.dob || '1998-01-01')
      setCity(driver.city || '')
      setLicense(driver.license || '')
      setLicenseClass(driver.licenseClass || 'FIA Silver')
      setLicenseExpiry(driver.licenseExpiry || '')
      setBloodType(driver.bloodType || 'O+')
      setMedicalExpiry(driver.medicalExpiry || '')
      setEmergencyContact(driver.emergencyContact || '')
      setHeightCm(String(driver.heightCm || '175'))
      setWeightKg(String(driver.weightKg || '70'))
      setHelmet(driver.helmet || '')
      setBio(driver.bio || '')
    } else {
      // Default blank values for new driver
      setFirstName('')
      setLastName('')
      setDisplayName('')
      setNumber('88')
      setCategory('GT3 Pro')
      setTeamId(teams[0]?.id || '')
      setVehicleId(vehicles[0]?.id || '')
      setNationality('España')
      setCountryCode('ESP')
      setFlag('🇪🇸')
      setDob('1998-05-12')
      setCity('Barcelona')
      setLicense(`FIA-${Math.floor(1000 + Math.random() * 9000)}`)
      setLicenseClass('FIA Silver')
      setLicenseExpiry('2026-12-31')
      setBloodType('O+')
      setMedicalExpiry('2026-11-30')
      setEmergencyContact('+34 600 123 456')
      setHeightCm('178')
      setWeightKg('72')
      setHelmet('Diseño deportivo fibra de carbono')
      setBio('Piloto profesional de GT con experiencia internacional.')
    }
    setError('')
  }, [driver, open, teams, vehicles])

  // Auto-generate displayName if empty
  const handleNameBlur = () => {
    if (!displayName && firstName && lastName) {
      setDisplayName(`${firstName[0]}. ${lastName}`)
    }
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!firstName.trim() || !lastName.trim()) {
      setError('El nombre y apellido son obligatorios.')
      return
    }
    const num = Number(number)
    if (!num || num <= 0) {
      setError('El número o dorsal debe ser un número entero mayor a cero.')
      return
    }

    setLoading(true)
    setError('')

    const payload: Partial<Driver> = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      displayName: displayName.trim() || `${firstName[0]}. ${lastName}`,
      number: num,
      category,
      teamId: teamId || teams[0]?.id || 't-aurora',
      vehicleId: vehicleId || vehicles[0]?.id || 'v-aurora-1',
      nationality: nationality.trim() || 'Internacional',
      countryCode: countryCode.trim().toUpperCase() || 'INT',
      flag: flag.trim() || '🏁',
      dob,
      city: city.trim(),
      license: license.trim(),
      licenseClass,
      licenseExpiry,
      bloodType,
      medicalExpiry,
      emergencyContact: emergencyContact.trim(),
      heightCm: Number(heightCm) || 178,
      weightKg: Number(weightKg) || 72,
      helmet: helmet.trim(),
      bio: bio.trim(),
    }

    try {
      let saved: Driver
      if (isEditing && driver?.id) {
        saved = await updateDriver(driver.id, payload)
      } else {
        saved = await addDriver(payload)
      }
      onSuccess?.(saved)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar el piloto')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEditing ? `Modificar Piloto: ${driver?.displayName}` : 'Inscribir Nuevo Piloto'}
      description="Completa los datos deportivos, técnicos y médicos del corredor."
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button type="submit" form="driver-form" disabled={loading}>
            {loading ? (
              'Guardando…'
            ) : isEditing ? (
              <>
                <Save className="h-4 w-4" />
                Actualizar Piloto
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                Inscribir Piloto
              </>
            )}
          </Button>
        </>
      }
    >
      <form id="driver-form" onSubmit={handleSubmit} className="space-y-4">
        {error ? (
          <div role="alert" className="rounded-lg border border-red/30 bg-red/10 px-3.5 py-2 text-xs text-red">
            {error}
          </div>
        ) : null}

        {/* Sección: Datos Personales y Deportivos */}
        <div className="space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-accent">
            Identificación Deportiva
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Nombre *">
              <Input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                onBlur={handleNameBlur}
                placeholder="Ej. Alex"
                required
              />
            </Field>
            <Field label="Apellido *">
              <Input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                onBlur={handleNameBlur}
                placeholder="Ej. Rossi"
                required
              />
            </Field>
            <Field label="Nombre Deportivo">
              <Input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Ej. A. Rossi"
              />
            </Field>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
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
            <Field label="Categoría *">
              <Select
                value={category}
                onChange={(e) => setCategory(e.target.value as Driver['category'])}
              >
                <option value="GT3 Pro">GT3 Pro</option>
                <option value="GT3 Pro-Am">GT3 Pro-Am</option>
                <option value="GT4">GT4</option>
              </Select>
            </Field>
            <Field label="Equipo *">
              <Select value={teamId} onChange={(e) => setTeamId(e.target.value)}>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Vehículo Asignado *">
              <Select value={vehicleId} onChange={(e) => setVehicleId(e.target.value)}>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    #{v.number} {v.make} {v.model}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Nacionalidad">
              <Input
                value={nationality}
                onChange={(e) => setNationality(e.target.value)}
                placeholder="Ej. España"
              />
            </Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Cód. País">
                <Input
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  placeholder="ESP"
                  maxLength={4}
                />
              </Field>
              <Field label="Bandera">
                <Input
                  value={flag}
                  onChange={(e) => setFlag(e.target.value)}
                  placeholder="🇪🇸"
                />
              </Field>
            </div>
          </div>
        </div>

        {/* Sección: Licencia y Origen */}
        <div className="space-y-3 border-t border-line/60 pt-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-accent">
            Licencia y Biometría
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Nacimiento">
              <Input
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
              />
            </Field>
            <Field label="Ciudad Natal">
              <Input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Ej. Madrid"
              />
            </Field>
            <Field label="Licencia Deportiva">
              <Input
                value={license}
                onChange={(e) => setLicense(e.target.value)}
                placeholder="FIA-ESP-9902"
              />
            </Field>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Grado de Licencia">
              <Select
                value={licenseClass}
                onChange={(e) => setLicenseClass(e.target.value)}
              >
                <option value="FIA Platinum">FIA Platinum</option>
                <option value="FIA Gold">FIA Gold</option>
                <option value="FIA Silver">FIA Silver</option>
                <option value="FIA Bronze">FIA Bronze</option>
              </Select>
            </Field>
            <Field label="Vencimiento Licencia">
              <Input
                type="date"
                value={licenseExpiry}
                onChange={(e) => setLicenseExpiry(e.target.value)}
              />
            </Field>
            <Field label="Grupo Sanguíneo">
              <Select value={bloodType} onChange={(e) => setBloodType(e.target.value)}>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </Select>
            </Field>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Vencimiento Médico">
              <Input
                type="date"
                value={medicalExpiry}
                onChange={(e) => setMedicalExpiry(e.target.value)}
              />
            </Field>
            <Field label="Contacto de Emergencia">
              <Input
                value={emergencyContact}
                onChange={(e) => setEmergencyContact(e.target.value)}
                placeholder="Teléfono / Familiar"
              />
            </Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Altura (cm)">
                <Input
                  type="number"
                  value={heightCm}
                  onChange={(e) => setHeightCm(e.target.value)}
                />
              </Field>
              <Field label="Peso (kg)">
                <Input
                  type="number"
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value)}
                />
              </Field>
            </div>
          </div>
        </div>

        {/* Sección: Detalles adicionales */}
        <div className="space-y-3 border-t border-line/60 pt-3">
          <Field label="Diseño de Casco">
            <Input
              value={helmet}
              onChange={(e) => setHelmet(e.target.value)}
              placeholder="Ej. Rojo fluorescente con alerón transparente"
            />
          </Field>
          <Field label="Biografía y Trayectoria Deportiva">
            <Textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              placeholder="Resumen de experiencia en karting, monoplazas o GT..."
            />
          </Field>
        </div>
      </form>
    </Modal>
  )
}
