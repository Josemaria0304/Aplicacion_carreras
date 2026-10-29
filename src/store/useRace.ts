import { create } from 'zustand'
import { drivers, feedSeed } from '@/data/seed'
import { getDriver, getTeam } from '@/lib/data'
import { formatLap } from '@/lib/utils'
import type { FeedItem, Flag, LiveEntry, RaceStatus } from '@/types'

const TOTAL_LAPS = 40
const TICK_SECONDS = 6
const INITIAL_CLOCK = 1_661_400

let feedCounter = 0

function nextFeedId(): string {
  feedCounter += 1
  return `live-${Date.now()}-${feedCounter}`
}

function wallClock(clockMs: number): string {
  const total = 18 * 3600 + Math.floor(clockMs / 1000)
  const hours = Math.floor(total / 3600) % 24
  const minutes = Math.floor((total % 3600) / 60)
  const seconds = total % 60
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

function splitSectors(total: number): [number, number, number] {
  const s1 = Math.round(total * 0.328 + (Math.random() - 0.5) * 260)
  const s2 = Math.round(total * 0.352 + (Math.random() - 0.5) * 240)
  return [s1, s2, total - s1 - s2]
}

function makeFeed(
  type: FeedItem['type'],
  message: string,
  detail: string | undefined,
  accent: FeedItem['accent'],
  clockMs: number,
): FeedItem {
  return {
    id: nextFeedId(),
    type,
    message,
    detail,
    time: wallClock(clockMs),
    accent,
  }
}

export function buildInitialEntries(): LiveEntry[] {
  const ordered = drivers
    .slice()
    .sort((a, b) => a.stats.position - b.stats.position)

  return ordered.map((driver, index) => {
    const laps = index < 12 ? 18 : 17
    const best = 91_882 + index * 245
    const last = Math.round(best + 480 + (index % 4) * 190)
    const sectors = splitSectors(last)
    const bestSectors = splitSectors(best)
    const target = Math.round(92_050 + index * 190)
    const isPenalized = driver.id === 'd-almeida'

    return {
      id: `entry-${driver.id}`,
      driverId: driver.id,
      teamId: driver.teamId,
      vehicleId: driver.vehicleId,
      number: driver.number,
      position: index + 1,
      previousPosition: index + 1,
      lapsCompleted: laps,
      progressMs: Math.round(Math.random() * 30_000),
      targetLapMs: target,
      lastLapMs: last,
      bestLapMs: best,
      sectors,
      bestSectors,
      sectorQuality: index < 3 ? ['personal', 'personal', 'personal'] : ['slow', 'slow', 'slow'],
      totalMs: laps * 92_300 + index * 520 + (isPenalized ? 5_000 : 0),
      gapMs: 0,
      intervalMs: 0,
      lapsDown: 0,
      status: 'running',
      pitStops: index % 4 === 0 ? 1 : 0,
      pitTicks: 0,
      penaltyMs: isPenalized ? 5_000 : 0,
      lastUpdate: 0,
      hasFastestLap: index === 0,
      recentLaps: [0, 1, 2].map((offset) => {
        const time = Math.round(92_900 + index * 300 + offset * 240 + (Math.random() - 0.5) * 450)
        return {
          lap: laps - 2 + offset,
          timeMs: time,
          sectors: splitSectors(time),
          valid: true,
        }
      }),
    }
  })
}

function recomputeOrder(entries: LiveEntry[]): LiveEntry[] {
  const active = entries.filter((entry) => entry.status !== 'dsq' && entry.status !== 'dnf')
  active.sort((a, b) => b.lapsCompleted - a.lapsCompleted || a.totalMs - b.totalMs)

  const leader = active[0]
  active.forEach((entry, index) => {
    entry.previousPosition = entry.position
    entry.position = index + 1
    entry.lapsDown = leader ? leader.lapsCompleted - entry.lapsCompleted : 0
    entry.gapMs =
      index === 0 ? 0 : entry.lapsDown > 0 || !leader ? null : leader.totalMs - entry.totalMs
    const ahead = active[index - 1]
    entry.intervalMs =
      index === 0
        ? 0
        : !ahead || entry.lapsDown > 0
          ? null
          : ahead.totalMs - entry.totalMs
  })

  const tail = entries.filter((entry) => entry.status === 'dsq' || entry.status === 'dnf')
  tail.forEach((entry, index) => {
    entry.position = active.length + index + 1
    entry.gapMs = null
    entry.intervalMs = null
    entry.lapsDown = leader ? leader.lapsCompleted - entry.lapsCompleted : 0
  })

  return entries
}

interface RaceStore {
  entries: LiveEntry[]
  flag: Flag
  status: RaceStatus
  currentLap: number
  totalLaps: number
  clockMs: number
  isRunning: boolean
  feed: FeedItem[]
  fastestLapMs: number
  fastestLapEntryId: string
  bestSectors: [number, number, number]
  tick: () => void
  setFlag: (flag: Flag) => void
  toggleRunning: () => void
  applyPenalty: (
    entryId: string,
    seconds: number,
    reason: string,
    type: 'time' | 'driveThrough' | 'stopGo' | 'reprimand' | 'dsq',
  ) => void
  reset: () => void
}

function initialState() {
  const entries = recomputeOrder(buildInitialEntries())
  return {
    entries,
    flag: 'green' as Flag,
    status: 'live' as RaceStatus,
    currentLap: 18,
    totalLaps: TOTAL_LAPS,
    clockMs: INITIAL_CLOCK,
    isRunning: true,
    feed: feedSeed,
    fastestLapMs: 91_882,
    fastestLapEntryId: 'entry-d-rossi',
    bestSectors: [30_137, 32_342, 29_403] as [number, number, number],
  }
}

export const useRace = create<RaceStore>()((set, get) => ({
  ...initialState(),

  tick: () => {
    const state = get()
    if (state.status !== 'live' || !state.isRunning) return

    const entries = state.entries.map((entry) => ({
      ...entry,
      sectors: [...entry.sectors] as [number, number, number],
      bestSectors: [...entry.bestSectors] as [number, number, number],
      sectorQuality: [...entry.sectorQuality] as LiveEntry['sectorQuality'],
      recentLaps: [...entry.recentLaps],
    }))

    const newFeed: FeedItem[] = []
    let bestSectors = [...state.bestSectors] as [number, number, number]
    let fastestLapMs = state.fastestLapMs
    let fastestLapEntryId = state.fastestLapEntryId
    let overtakeLogged = false

    for (const entry of entries) {
      if (entry.pitTicks > 0) {
        entry.pitTicks -= 1
        if (entry.pitTicks === 0 && entry.status === 'pit') entry.status = 'running'
        continue
      }
      if (entry.status !== 'running') continue

      entry.progressMs += TICK_SECONDS * 1000
      if (entry.progressMs < entry.targetLapMs) continue

      entry.progressMs -= entry.targetLapMs
      entry.lapsCompleted += 1

      const lapPenalty =
        state.flag === 'yellow' ? 4_200 : state.flag === 'safetyCar' ? 11_000 : 0
      const degradation = Math.min(entry.lapsCompleted * 6, 240)
      const noise = (Math.random() - 0.5) * 1_300
      const lapTime = Math.max(
        88_000,
        Math.round(entry.targetLapMs + lapPenalty + degradation + noise),
      )

      entry.totalMs += lapTime
      entry.lastLapMs = lapTime
      entry.lastUpdate = Date.now()
      if (!entry.bestLapMs || lapTime < entry.bestLapMs) entry.bestLapMs = lapTime

      const sectors = splitSectors(lapTime)
      entry.sectors = sectors
      const quality = [...entry.sectorQuality] as LiveEntry['sectorQuality']
      for (let index = 0; index < 3; index += 1) {
        if (sectors[index] < bestSectors[index]) {
          bestSectors[index] = sectors[index]
          quality[index] = 'best'
        } else if (sectors[index] < entry.bestSectors[index]) {
          quality[index] = 'personal'
        } else {
          quality[index] = 'slow'
        }
        entry.bestSectors[index] = Math.min(entry.bestSectors[index], sectors[index])
      }
      entry.sectorQuality = quality

      entry.recentLaps = [
        ...entry.recentLaps,
        { lap: entry.lapsCompleted, timeMs: lapTime, sectors, valid: true },
      ].slice(-6)

      if (lapTime < fastestLapMs) {
        fastestLapMs = lapTime
        fastestLapEntryId = entry.id
        entries.forEach((candidate) => {
          candidate.hasFastestLap = candidate.id === entry.id
        })
        newFeed.push(
          makeFeed(
            'lap',
            `Vuelta rápida de ${getDriver(entry.driverId).displayName}`,
            `${formatLap(lapTime)} · Vuelta ${entry.lapsCompleted} · ${getTeam(entry.teamId).name}`,
            'purple',
            state.clockMs,
          ),
        )
      }

      const pitChance = Math.random()
      if (pitChance < 0.035 && entry.lapsCompleted > 4 && entry.lapsCompleted < state.totalLaps - 1) {
        entry.pitStops += 1
        entry.status = 'pit'
        entry.pitTicks = 1
        const pitLoss = 23_000 + Math.round(Math.random() * 3_000)
        entry.totalMs += pitLoss
        newFeed.push(
          makeFeed(
            'pit',
            `${getDriver(entry.driverId).displayName} entra a boxes`,
            `Parada #${entry.pitStops} · Neumáticos medios · +${(pitLoss / 1000).toFixed(1)} s`,
            'sky',
            state.clockMs,
          ),
        )
      }

      const nextBase = 91_800 + entry.position * 210
      entry.targetLapMs = Math.round(nextBase + Math.random() * 900 + degradation * 0.4)
    }

    recomputeOrder(entries)
    const active = entries.filter((entry) => entry.status !== 'dsq' && entry.status !== 'dnf')
    const leader = active[0]
    const leaderLaps = leader?.lapsCompleted ?? 0

    if (!overtakeLogged) {
      for (const entry of active.slice(1, 6)) {
        if (entry.position < entry.previousPosition && Math.random() < 0.35) {
          const rival = active[entry.position - 2]
          if (rival) {
            newFeed.push(
              makeFeed(
                'overtake',
                `${getDriver(entry.driverId).displayName} adelanta a ${getDriver(rival.driverId).displayName} por P${entry.position}`,
                'Curva 1 · Sector 1',
                'lime',
                state.clockMs,
              ),
            )
            overtakeLogged = true
          }
          break
        }
      }
    }

    let status: RaceStatus = state.status
    let flag: Flag = state.flag
    let isRunning: boolean = state.isRunning

    if (leaderLaps >= state.totalLaps) {
      status = 'finished'
      flag = 'chequered'
      isRunning = false
      if (leader) {
        newFeed.push(
          makeFeed(
            'finish',
            'Bandera a cuadros',
            `${getDriver(leader.driverId).displayName} gana la Carrera 2 en Interlagos`,
            'lime',
            state.clockMs,
          ),
        )
      }
    }

    set({
      entries,
      feed: newFeed.length ? [...newFeed.reverse(), ...state.feed].slice(0, 40) : state.feed,
      clockMs: state.clockMs + TICK_SECONDS * 1000,
      currentLap: Math.min(leaderLaps, state.totalLaps),
      fastestLapMs,
      fastestLapEntryId,
      bestSectors,
      status,
      flag,
      isRunning,
    })
  },

  setFlag: (flag) => {
    const state = get()
    const messages: Record<Flag, { message: string; accent: FeedItem['accent'] }> = {
      green: { message: 'Bandera verde · pista libre', accent: 'lime' },
      yellow: { message: 'Bandera amarilla en sector 2', accent: 'amber' },
      safetyCar: { message: 'Safety car en pista', accent: 'amber' },
      red: { message: 'Bandera roja · sesión suspendida', accent: 'red' },
      chequered: { message: 'Bandera a cuadros · sesión finalizada', accent: 'lime' },
    }
    const info = messages[flag]
    const status: RaceStatus =
      flag === 'red' ? 'red' : flag === 'chequered' ? 'finished' : 'live'

    set({
      flag,
      status,
      isRunning: flag !== 'chequered',
      feed: [
        makeFeed('flag', info.message, 'Dirección de Carrera', info.accent, state.clockMs),
        ...state.feed,
      ].slice(0, 40),
    })
  },

  toggleRunning: () => set((state) => ({ isRunning: !state.isRunning })),

  applyPenalty: (entryId, seconds, reason, type) => {
    const state = get()
    const entries = state.entries.map((entry) => ({
      ...entry,
      sectors: [...entry.sectors] as [number, number, number],
      bestSectors: [...entry.bestSectors] as [number, number, number],
      sectorQuality: [...entry.sectorQuality] as LiveEntry['sectorQuality'],
      recentLaps: [...entry.recentLaps],
    }))
    const target = entries.find((entry) => entry.id === entryId)
    if (!target) return

    if (type === 'dsq') {
      target.status = 'dsq'
    } else if (type === 'reprimand') {
      // Sin efecto en el tiempo.
    } else {
      const penaltyMs = seconds * 1000
      target.penaltyMs += penaltyMs
      target.totalMs += penaltyMs
    }

    recomputeOrder(entries)
    const driver = getDriver(target.driverId)
    const label =
      type === 'dsq'
        ? 'Descalificación'
        : type === 'reprimand'
          ? 'Reprimenda oficial'
          : `Sanción de +${seconds} s`

    set({
      entries,
      feed: [
        makeFeed(
          'penalty',
          `${label} para ${driver.displayName}`,
          `${reason} · Aplicada por Dirección de Carrera`,
          'red',
          state.clockMs,
        ),
        ...state.feed,
      ].slice(0, 40),
    })
  },

  reset: () => set(initialState()),
}))

export { TOTAL_LAPS, TICK_SECONDS }
