export type Role =
  | 'organizer'
  | 'director'
  | 'steward'
  | 'timekeeper'
  | 'pilot'
  | 'press'
  | 'public'

export type Permission =
  | 'event:manage'
  | 'race:control'
  | 'timing:write'
  | 'penalty:write'
  | 'results:publish'
  | 'admin:users'
  | 'medical:view'
  | 'entry:own'

export interface Team {
  id: string
  name: string
  shortName: string
  color: string
  country: string
  principal: string
}

export interface DriverStats {
  starts: number
  wins: number
  podiums: number
  poles: number
  fastestLaps: number
  titles: number
  points: number
  position: number
}

export type RaceResult = number | 'DNF' | 'DNS'

export interface Driver {
  id: string
  firstName: string
  lastName: string
  displayName: string
  number: number
  nationality: string
  countryCode: string
  flag: string
  dob: string
  city: string
  category: 'GT3 Pro' | 'GT3 Pro-Am' | 'GT4'
  teamId: string
  vehicleId: string
  license: string
  licenseClass: string
  licenseExpiry: string
  medicalExpiry: string
  bloodType: string
  emergencyContact: string
  bio: string
  heightCm: number
  weightKg: number
  helmet: string
  sponsors: string[]
  results: RaceResult[]
  fastestLapRounds: number[]
  stats: DriverStats
}

export interface VehicleDocument {
  name: string
  expires: string
  status: 'valid' | 'expiring' | 'expired'
}

export interface VehicleChecklistItem {
  label: string
  ok: boolean
}

export interface Vehicle {
  id: string
  teamId: string
  number: number
  make: string
  model: string
  year: number
  category: 'GT3 Pro' | 'GT3 Pro-Am' | 'GT4'
  color: string
  engine: string
  displacement: string
  powerHp: number
  torqueNm: number
  weightKg: number
  minWeightKg: number
  drivetrain: string
  transmission: string
  fuel: string
  fuelCapacity: number
  tire: string
  homologation: string
  vin: string
  transponder: string
  status: 'approved' | 'pending' | 'observed' | 'rejected'
  inspectionDate: string
  inspector: string
  notes: string
  documents: VehicleDocument[]
  checklist: VehicleChecklistItem[]
}

export interface Circuit {
  id: string
  name: string
  city: string
  country: string
  flag: string
  lengthM: number
  corners: number
  direction: string
  record: string
  recordHolder: string
  timezone: string
}

export type SessionStatus = 'finished' | 'live' | 'scheduled'
export type SessionType = 'practice' | 'qualifying' | 'sprint' | 'race' | 'endurance'

export interface SessionResult {
  position: number
  driverId: string
  time: string
  points: number
  fastestLap?: boolean
}

export interface EventSession {
  id: string
  type: SessionType
  name: string
  date: string
  time: string
  duration: string
  status: SessionStatus
  laps?: number
  results?: SessionResult[]
}

export interface RaceEvent {
  id: string
  championshipId: string
  circuitId: string
  round: number
  name: string
  date: string
  dateLabel: string
  status: 'finished' | 'live' | 'scheduled'
  sessions: EventSession[]
  entries: string[]
  notes: string
}

export interface Championship {
  id: string
  name: string
  season: number
  organizer: string
  status: 'En curso' | 'Finalizado' | 'Programado'
  categories: string[]
  description: string
  color: string
  rounds: number
}

export interface StandingRow {
  position: number
  previousPosition: number
  driverId: string
  teamId: string
  points: number
  wins: number
  podiums: number
  poles: number
  fastestLaps: number
  results: RaceResult[]
}

export interface TeamStanding {
  position: number
  previousPosition: number
  teamId: string
  points: number
  wins: number
  podiums: number
}

export type FeedType =
  | 'lap'
  | 'pit'
  | 'flag'
  | 'penalty'
  | 'info'
  | 'finish'
  | 'overtake'

export interface FeedItem {
  id: string
  type: FeedType
  message: string
  detail?: string
  time: string
  accent?: 'lime' | 'red' | 'amber' | 'purple' | 'sky' | 'muted'
}

export interface LapRecord {
  lap: number
  timeMs: number
  sectors: [number, number, number]
  valid: boolean
}

export type LiveStatus = 'running' | 'pit' | 'dnf' | 'dsq' | 'finished'
export type Flag = 'green' | 'yellow' | 'safetyCar' | 'red' | 'chequered'
export type RaceStatus = 'live' | 'neutralized' | 'red' | 'finished'

export interface LiveEntry {
  id: string
  driverId: string
  teamId: string
  vehicleId: string
  number: number
  position: number
  previousPosition: number
  lapsCompleted: number
  progressMs: number
  targetLapMs: number
  lastLapMs: number | null
  bestLapMs: number | null
  sectors: [number, number, number]
  bestSectors: [number, number, number]
  sectorQuality: ['best' | 'personal' | 'slow', 'best' | 'personal' | 'slow', 'best' | 'personal' | 'slow']
  totalMs: number
  gapMs: number | null
  intervalMs: number | null
  lapsDown: number
  status: LiveStatus
  pitStops: number
  pitTicks: number
  penaltyMs: number
  lastUpdate: number
  hasFastestLap: boolean
  recentLaps: LapRecord[]
}

export interface Toast {
  id: string
  title: string
  description?: string
  tone: 'success' | 'error' | 'info' | 'warning'
}

export interface AppNotification {
  id: string
  title: string
  description: string
  time: string
  read: boolean
  tone: 'info' | 'warning' | 'success'
}

export interface AuditEntry {
  id: string
  actor: string
  action: string
  entity: string
  time: string
  ip: string
}

export interface UserAccount {
  id: string
  name: string
  email: string
  role: Role
  status: 'active' | 'invited' | 'suspended'
  lastActive: string
}

export interface AppSettings {
  compact: boolean
  showSectors: boolean
  autoScroll: boolean
  simulationSpeed: 1 | 2 | 4
  pushResults: boolean
  pushFlags: boolean
  pushEntries: boolean
}
