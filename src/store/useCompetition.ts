import { create } from 'zustand'
import {
  championship as defaultChampionship,
  circuits as defaultCircuits,
  drivers as defaultDrivers,
  events as defaultEvents,
  standings as defaultStandings,
  teamStandings as defaultTeamStandings,
  teams as defaultTeams,
  vehicles as defaultVehicles,
} from '@/data/seed'
import type {
  Championship,
  Circuit,
  Driver,
  RaceEvent,
  StandingRow,
  Team,
  TeamStanding,
  Vehicle,
} from '@/types'

const STORAGE_KEY = 'apex_competition_store_v2'

interface CompetitionState {
  drivers: Driver[]
  vehicles: Vehicle[]
  teams: Team[]
  circuits: Circuit[]
  events: RaceEvent[]
  championships: Championship[]
  standings: StandingRow[]
  teamStandings: TeamStanding[]
  isApiConnected: boolean | null
  isSyncing: boolean
  error: string | null

  init: () => Promise<void>
  syncFromApi: () => Promise<void>
  resetToDefaults: () => void

  // Driver CRUD
  addDriver: (data: Partial<Driver>) => Promise<Driver>
  updateDriver: (id: string, updates: Partial<Driver>) => Promise<Driver>
  deleteDriver: (id: string) => Promise<boolean>

  // Vehicle CRUD
  addVehicle: (data: Partial<Vehicle>) => Promise<Vehicle>
  updateVehicle: (id: string, updates: Partial<Vehicle>) => Promise<Vehicle>
  deleteVehicle: (id: string) => Promise<boolean>

  // Team CRUD
  addTeam: (data: Partial<Team>) => Promise<Team>
  updateTeam: (id: string, updates: Partial<Team>) => Promise<Team>
  deleteTeam: (id: string) => Promise<boolean>

  // Generic generic delete for database manager
  deleteRecord: (resource: string, id: string) => Promise<boolean>
}

async function apiRequest<T>(url: string, options?: RequestInit): Promise<T> {
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

function loadFromLocalStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed && Array.isArray(parsed.drivers) && Array.isArray(parsed.vehicles)) {
        return parsed
      }
    }
  } catch (err) {
    console.warn('Error reading from localStorage:', err)
  }
  return null
}

function saveToLocalStorage(state: Partial<CompetitionState>) {
  try {
    const data = {
      drivers: state.drivers,
      vehicles: state.vehicles,
      teams: state.teams,
      circuits: state.circuits,
      events: state.events,
      championships: state.championships,
      standings: state.standings,
      teamStandings: state.teamStandings,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (err) {
    console.warn('Error saving to localStorage:', err)
  }
}

const initialLocal = loadFromLocalStorage()

export const useCompetition = create<CompetitionState>()((set, get) => ({
  drivers: initialLocal?.drivers ?? defaultDrivers,
  vehicles: initialLocal?.vehicles ?? defaultVehicles,
  teams: initialLocal?.teams ?? defaultTeams,
  circuits: initialLocal?.circuits ?? defaultCircuits,
  events: initialLocal?.events ?? defaultEvents,
  championships: initialLocal?.championships ?? [defaultChampionship],
  standings: initialLocal?.standings ?? defaultStandings,
  teamStandings: initialLocal?.teamStandings ?? defaultTeamStandings,
  isApiConnected: null,
  isSyncing: false,
  error: null,

  init: async () => {
    try {
      await apiRequest('/api/health')
      set({ isApiConnected: true })
      // If connected, sync data from API
      await get().syncFromApi()
    } catch {
      set({ isApiConnected: false })
    }
  },

  syncFromApi: async () => {
    set({ isSyncing: true, error: null })
    try {
      const counts = await apiRequest<Record<string, number>>('/api/counts')
      const hasData = Object.values(counts).some((count) => count > 0)

      if (hasData) {
        const [drivers, vehicles, teams, circuits, championships, events, standings, teamStandings] =
          await Promise.all([
            apiRequest<Driver[]>('/api/drivers').catch(() => get().drivers),
            apiRequest<Vehicle[]>('/api/vehicles').catch(() => get().vehicles),
            apiRequest<Team[]>('/api/teams').catch(() => get().teams),
            apiRequest<Circuit[]>('/api/circuits').catch(() => get().circuits),
            apiRequest<Championship[]>('/api/championships').catch(() => get().championships),
            apiRequest<RaceEvent[]>('/api/events').catch(() => get().events),
            apiRequest<StandingRow[]>('/api/standings').catch(() => get().standings),
            apiRequest<TeamStanding[]>('/api/teamStandings').catch(() => get().teamStandings),
          ])

        set({
          drivers: drivers.length ? drivers : get().drivers,
          vehicles: vehicles.length ? vehicles : get().vehicles,
          teams: teams.length ? teams : get().teams,
          circuits: circuits.length ? circuits : get().circuits,
          championships: championships.length ? championships : get().championships,
          events: events.length ? events : get().events,
          standings: standings.length ? standings : get().standings,
          teamStandings: teamStandings.length ? teamStandings : get().teamStandings,
          isApiConnected: true,
        })
        saveToLocalStorage(get())
      } else {
        set({ isApiConnected: true })
      }
    } catch (err) {
      set({
        isApiConnected: false,
        error: err instanceof Error ? err.message : 'Error al sincronizar con el servidor',
      })
    } finally {
      set({ isSyncing: false })
    }
  },

  resetToDefaults: () => {
    localStorage.removeItem(STORAGE_KEY)
    set({
      drivers: defaultDrivers,
      vehicles: defaultVehicles,
      teams: defaultTeams,
      circuits: defaultCircuits,
      events: defaultEvents,
      championships: [defaultChampionship],
      standings: defaultStandings,
      teamStandings: defaultTeamStandings,
    })
    saveToLocalStorage({
      drivers: defaultDrivers,
      vehicles: defaultVehicles,
      teams: defaultTeams,
      circuits: defaultCircuits,
      events: defaultEvents,
      championships: [defaultChampionship],
      standings: defaultStandings,
      teamStandings: defaultTeamStandings,
    })
  },

  // Driver CRUD
  addDriver: async (data) => {
    const state = get()
    const id = data.id || `d-${Date.now()}`
    const number = Number(data.number) || 99
    const teamId = data.teamId || state.teams[0]?.id || 't-aurora'
    const vehicleId = data.vehicleId || state.vehicles[0]?.id || 'v-aurora-1'
    const firstName = data.firstName?.trim() || 'Nuevo'
    const lastName = data.lastName?.trim() || 'Piloto'
    const displayName = data.displayName?.trim() || `${firstName[0]}. ${lastName}`

    const newDriver: Driver = {
      id,
      firstName,
      lastName,
      displayName,
      number,
      nationality: data.nationality?.trim() || 'Internacional',
      countryCode: data.countryCode?.trim() || 'INT',
      flag: data.flag?.trim() || '🏁',
      dob: data.dob || '1998-05-15',
      city: data.city?.trim() || 'Madrid',
      category: data.category || 'GT3 Pro',
      teamId,
      vehicleId,
      license: data.license?.trim() || `FIA-${number}-${Date.now().toString().slice(-4)}`,
      licenseClass: data.licenseClass || 'FIA Silver',
      licenseExpiry: data.licenseExpiry || '2026-12-31',
      medicalExpiry: data.medicalExpiry || '2026-11-30',
      bloodType: data.bloodType || 'O+',
      emergencyContact: data.emergencyContact?.trim() || 'Dirección de Carrera',
      bio: data.bio?.trim() || 'Piloto profesional inscrito en la temporada 2026.',
      heightCm: Number(data.heightCm) || 178,
      weightKg: Number(data.weightKg) || 72,
      helmet: data.helmet?.trim() || 'Casco deportivo oficial',
      sponsors: data.sponsors || ['Apex Racing'],
      results: data.results || [0, 0, 0, 0],
      fastestLapRounds: data.fastestLapRounds || [],
      stats: data.stats || {
        starts: 0,
        wins: 0,
        podiums: 0,
        poles: 0,
        fastestLaps: 0,
        titles: 0,
        points: 0,
        position: state.drivers.length + 1,
      },
    }

    const newStanding: StandingRow = {
      position: state.standings.length + 1,
      driverId: id,
      teamId,
      points: 0,
      diff: 0,
      wins: 0,
      podiums: 0,
      fastestLaps: 0,
      trend: 'equal',
    }

    const updatedDrivers = [newDriver, ...state.drivers]
    const updatedStandings = [...state.standings, newStanding]

    set({ drivers: updatedDrivers, standings: updatedStandings })
    saveToLocalStorage({ drivers: updatedDrivers, standings: updatedStandings })

    if (state.isApiConnected) {
      try {
        await apiRequest('/api/drivers', { method: 'POST', body: JSON.stringify(newDriver) })
        await apiRequest('/api/standings', { method: 'POST', body: JSON.stringify(newStanding) })
      } catch (err) {
        console.warn('API sync error (addDriver):', err)
      }
    }

    return newDriver
  },

  updateDriver: async (id, updates) => {
    const state = get()
    const target = state.drivers.find((d) => d.id === id)
    if (!target) throw new Error(`Piloto con id ${id} no encontrado.`)

    const updatedDriver: Driver = {
      ...target,
      ...updates,
      id, // ensure ID cannot be altered
      number: updates.number !== undefined ? Number(updates.number) : target.number,
      heightCm: updates.heightCm !== undefined ? Number(updates.heightCm) : target.heightCm,
      weightKg: updates.weightKg !== undefined ? Number(updates.weightKg) : target.weightKg,
      stats: updates.stats ? { ...target.stats, ...updates.stats } : target.stats,
    }

    const updatedDrivers = state.drivers.map((d) => (d.id === id ? updatedDriver : d))
    const updatedStandings = state.standings.map((s) =>
      s.driverId === id
        ? {
            ...s,
            teamId: updatedDriver.teamId,
          }
        : s,
    )

    set({ drivers: updatedDrivers, standings: updatedStandings })
    saveToLocalStorage({ drivers: updatedDrivers, standings: updatedStandings })

    if (state.isApiConnected) {
      try {
        await apiRequest(`/api/drivers/${encodeURIComponent(id)}`, {
          method: 'PUT',
          body: JSON.stringify(updatedDriver),
        })
      } catch (err) {
        console.warn('API sync error (updateDriver):', err)
      }
    }

    return updatedDriver
  },

  deleteDriver: async (id) => {
    const state = get()
    const updatedDrivers = state.drivers.filter((d) => d.id !== id)
    const updatedStandings = state.standings.filter((s) => s.driverId !== id)

    // Recompute standings positions
    const reorderedStandings = updatedStandings.map((row, idx) => ({
      ...row,
      position: idx + 1,
    }))

    set({ drivers: updatedDrivers, standings: reorderedStandings })
    saveToLocalStorage({ drivers: updatedDrivers, standings: reorderedStandings })

    if (state.isApiConnected) {
      try {
        await apiRequest(`/api/drivers/${encodeURIComponent(id)}`, { method: 'DELETE' })
        await apiRequest(`/api/standings/${encodeURIComponent(id)}`, { method: 'DELETE' }).catch(() => {})
      } catch (err) {
        console.warn('API sync error (deleteDriver):', err)
      }
    }

    return true
  },

  // Vehicle CRUD
  addVehicle: async (data) => {
    const state = get()
    const id = data.id || `v-${Date.now()}`
    const number = Number(data.number) || 99
    const teamId = data.teamId || state.teams[0]?.id || 't-aurora'
    const make = data.make?.trim() || 'Porsche'
    const model = data.model?.trim() || '911 GT3 R'

    const newVehicle: Vehicle = {
      id,
      teamId,
      number,
      make,
      model,
      year: Number(data.year) || 2026,
      category: data.category || 'GT3 Pro',
      color: data.color?.trim() || '#c9f73a',
      engine: data.engine?.trim() || '4.0L Boxer-6 Atmosférico',
      displacement: data.displacement?.trim() || '3,996 cc',
      powerHp: Number(data.powerHp) || 565,
      torqueNm: Number(data.torqueNm) || 530,
      weightKg: Number(data.weightKg) || 1250,
      minWeightKg: Number(data.minWeightKg) || 1250,
      drivetrain: data.drivetrain?.trim() || 'RWD',
      transmission: data.transmission?.trim() || 'Secuencial 6 velocidades',
      fuel: data.fuel?.trim() || '100 RON Biofuel',
      fuelCapacity: Number(data.fuelCapacity) || 120,
      tire: data.tire?.trim() || 'Pirelli P Zero DHF 325/705-18',
      homologation: data.homologation?.trim() || `FIA-GT3-${Date.now().toString().slice(-4)}`,
      vin: data.vin?.trim() || `WP0ZZZ99ZTS${Date.now().toString().slice(-6)}`,
      transponder: data.transponder?.trim() || `TX-${number * 100 + 42}`,
      status: data.status || 'approved',
      inspectionDate: data.inspectionDate || new Date().toISOString().slice(0, 10),
      inspector: data.inspector?.trim() || 'J. Lima (Scrutineer)',
      notes: data.notes?.trim() || 'Homologación técnica completada para el campeonato.',
      documents: data.documents || [
        { name: 'Pasaporte Técnico FIA', expires: '2026-12-31', status: 'valid' },
        { name: 'Certificado de Homologación BoP', expires: '2026-11-30', status: 'valid' },
        { name: 'Inspección de Jaula de Seguridad', expires: '2027-01-15', status: 'valid' },
        { name: 'Verificación de Depósito de Combustible', expires: '2026-10-15', status: 'valid' },
      ],
      checklist: data.checklist || [
        { label: 'Pesaje oficial y verificación de lastre BoP', ok: true },
        { label: 'Alineación aerodinámica y ángulo de alerón', ok: true },
        { label: 'Sistema de extinción y corte eléctrico externo', ok: true },
        { label: 'Arnés de seguridad y red de ventanilla FIA 8853-2016', ok: true },
        { label: 'Límites de decibelios de escape (110 dB @ 0.5 m)', ok: true },
        { label: 'Transponder oficial y telemetría Scrutineering', ok: true },
      ],
    }

    const updatedVehicles = [newVehicle, ...state.vehicles]
    set({ vehicles: updatedVehicles })
    saveToLocalStorage({ vehicles: updatedVehicles })

    if (state.isApiConnected) {
      try {
        await apiRequest('/api/vehicles', { method: 'POST', body: JSON.stringify(newVehicle) })
      } catch (err) {
        console.warn('API sync error (addVehicle):', err)
      }
    }

    return newVehicle
  },

  updateVehicle: async (id, updates) => {
    const state = get()
    const target = state.vehicles.find((v) => v.id === id)
    if (!target) throw new Error(`Vehículo con id ${id} no encontrado.`)

    const updatedVehicle: Vehicle = {
      ...target,
      ...updates,
      id, // ensure ID cannot be altered
      number: updates.number !== undefined ? Number(updates.number) : target.number,
      year: updates.year !== undefined ? Number(updates.year) : target.year,
      powerHp: updates.powerHp !== undefined ? Number(updates.powerHp) : target.powerHp,
      torqueNm: updates.torqueNm !== undefined ? Number(updates.torqueNm) : target.torqueNm,
      weightKg: updates.weightKg !== undefined ? Number(updates.weightKg) : target.weightKg,
      minWeightKg: updates.minWeightKg !== undefined ? Number(updates.minWeightKg) : target.minWeightKg,
      fuelCapacity: updates.fuelCapacity !== undefined ? Number(updates.fuelCapacity) : target.fuelCapacity,
      documents: updates.documents || target.documents,
      checklist: updates.checklist || target.checklist,
    }

    const updatedVehicles = state.vehicles.map((v) => (v.id === id ? updatedVehicle : v))
    set({ vehicles: updatedVehicles })
    saveToLocalStorage({ vehicles: updatedVehicles })

    if (state.isApiConnected) {
      try {
        await apiRequest(`/api/vehicles/${encodeURIComponent(id)}`, {
          method: 'PUT',
          body: JSON.stringify(updatedVehicle),
        })
      } catch (err) {
        console.warn('API sync error (updateVehicle):', err)
      }
    }

    return updatedVehicle
  },

  deleteVehicle: async (id) => {
    const state = get()
    const updatedVehicles = state.vehicles.filter((v) => v.id !== id)
    set({ vehicles: updatedVehicles })
    saveToLocalStorage({ vehicles: updatedVehicles })

    if (state.isApiConnected) {
      try {
        await apiRequest(`/api/vehicles/${encodeURIComponent(id)}`, { method: 'DELETE' })
      } catch (err) {
        console.warn('API sync error (deleteVehicle):', err)
      }
    }

    return true
  },

  // Team CRUD
  addTeam: async (data) => {
    const state = get()
    const id = data.id || `t-${Date.now()}`
    const name = data.name?.trim() || 'Nuevo Equipo'
    const shortName = data.shortName?.trim() || name.slice(0, 3).toUpperCase()

    const newTeam: Team = {
      id,
      name,
      shortName,
      color: data.color?.trim() || '#38bdf8',
      country: data.country?.trim() || 'España',
      principal: data.principal?.trim() || 'Director Deportivo',
    }

    const newTeamStanding: TeamStanding = {
      position: state.teamStandings.length + 1,
      teamId: id,
      points: 0,
      diff: 0,
      wins: 0,
      podiums: 0,
    }

    const updatedTeams = [...state.teams, newTeam]
    const updatedTeamStandings = [...state.teamStandings, newTeamStanding]

    set({ teams: updatedTeams, teamStandings: updatedTeamStandings })
    saveToLocalStorage({ teams: updatedTeams, teamStandings: updatedTeamStandings })

    if (state.isApiConnected) {
      try {
        await apiRequest('/api/teams', { method: 'POST', body: JSON.stringify(newTeam) })
        await apiRequest('/api/teamStandings', { method: 'POST', body: JSON.stringify(newTeamStanding) })
      } catch (err) {
        console.warn('API sync error (addTeam):', err)
      }
    }

    return newTeam
  },

  updateTeam: async (id, updates) => {
    const state = get()
    const target = state.teams.find((t) => t.id === id)
    if (!target) throw new Error(`Equipo con id ${id} no encontrado.`)

    const updatedTeam: Team = {
      ...target,
      ...updates,
      id,
    }

    const updatedTeams = state.teams.map((t) => (t.id === id ? updatedTeam : t))
    set({ teams: updatedTeams })
    saveToLocalStorage({ teams: updatedTeams })

    if (state.isApiConnected) {
      try {
        await apiRequest(`/api/teams/${encodeURIComponent(id)}`, {
          method: 'PUT',
          body: JSON.stringify(updatedTeam),
        })
      } catch (err) {
        console.warn('API sync error (updateTeam):', err)
      }
    }

    return updatedTeam
  },

  deleteTeam: async (id) => {
    const state = get()
    const updatedTeams = state.teams.filter((t) => t.id !== id)
    const updatedTeamStandings = state.teamStandings.filter((ts) => ts.teamId !== id)
    set({ teams: updatedTeams, teamStandings: updatedTeamStandings })
    saveToLocalStorage({ teams: updatedTeams, teamStandings: updatedTeamStandings })

    if (state.isApiConnected) {
      try {
        await apiRequest(`/api/teams/${encodeURIComponent(id)}`, { method: 'DELETE' })
        await apiRequest(`/api/teamStandings/${encodeURIComponent(id)}`, { method: 'DELETE' }).catch(() => {})
      } catch (err) {
        console.warn('API sync error (deleteTeam):', err)
      }
    }

    return true
  },

  deleteRecord: async (resource, id) => {
    if (resource === 'drivers') {
      return get().deleteDriver(id)
    }
    if (resource === 'vehicles') {
      return get().deleteVehicle(id)
    }
    if (resource === 'teams') {
      return get().deleteTeam(id)
    }

    // Generic fallback for circuits, championships, events, etc.
    const state = get()
    if (state.isApiConnected) {
      await apiRequest(`/api/${resource}/${encodeURIComponent(id)}`, { method: 'DELETE' })
      await get().syncFromApi()
      return true
    }
    return false
  },
}))
