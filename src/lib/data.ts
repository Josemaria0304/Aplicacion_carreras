import {
  championship,
  circuits,
  driverPoints,
  drivers,
  events,
  POINTS_SCALE,
  standings,
  teamStandings,
  teams,
  vehicles,
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

const driverMap = new Map(drivers.map((driver) => [driver.id, driver]))
const teamMap = new Map(teams.map((team) => [team.id, team]))
const vehicleMap = new Map(vehicles.map((vehicle) => [vehicle.id, vehicle]))
const circuitMap = new Map(circuits.map((circuit) => [circuit.id, circuit]))
const eventMap = new Map(events.map((event) => [event.id, event]))

export function getDriver(id: string): Driver {
  return driverMap.get(id) ?? drivers[0]
}

export function getTeam(id: string): Team {
  return teamMap.get(id) ?? teams[0]
}

export function getVehicle(id: string): Vehicle {
  return vehicleMap.get(id) ?? vehicles[0]
}

export function getCircuit(id: string): Circuit {
  return circuitMap.get(id) ?? circuits[0]
}

export function getEvent(id: string): RaceEvent {
  return eventMap.get(id) ?? events[0]
}

export function getChampionship(): Championship {
  return championship
}

export function getStanding(driverId: string): StandingRow {
  return standings.find((row) => row.driverId === driverId) ?? standings[0]
}

export function getTeamStanding(teamId: string): TeamStanding {
  return teamStandings.find((row) => row.teamId === teamId) ?? teamStandings[0]
}

export function getDriversByTeam(teamId: string): Driver[] {
  return drivers.filter((driver) => driver.teamId === teamId)
}

export function getDriversByVehicle(vehicleId: string): Driver[] {
  return drivers.filter((driver) => driver.vehicleId === vehicleId)
}

export function getVehicleForDriver(driver: Driver): Vehicle {
  return getVehicle(driver.vehicleId)
}

export function getEventsForChampionship(championshipId: string): RaceEvent[] {
  return events
    .filter((event) => event.championshipId === championshipId)
    .sort((a, b) => a.round - b.round)
}

export function getEventForCircuit(circuitId: string): RaceEvent | undefined {
  return events.find((event) => event.circuitId === circuitId)
}

export function pointsForPosition(position: number): number {
  return POINTS_SCALE[position - 1] ?? 0
}

export function pointsByRound(driver: Driver): number[] {
  return driver.results.map((result, index) => {
    if (typeof result !== 'number') return 0
    return (POINTS_SCALE[result - 1] ?? 0) + (driver.fastestLapRounds.includes(index + 1) ? 1 : 0)
  })
}

export function cumulativePoints(driver: Driver): number[] {
  let total = 0
  return pointsByRound(driver).map((points) => {
    total += points
    return total
  })
}

export function driverLabel(driverId: string): string {
  return getDriver(driverId).displayName
}

export function teamLabel(teamId: string): string {
  return getTeam(teamId).name
}

export const roundLabels = ['R1', 'R2', 'R3', 'R4']

export { driverPoints, standings, teamStandings }
