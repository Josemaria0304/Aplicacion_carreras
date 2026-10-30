import {
  championship as seedChampionship,
  circuits as seedCircuits,
  driverPoints,
  drivers as seedDrivers,
  events as seedEvents,
  POINTS_SCALE,
  standings as seedStandings,
  teamStandings as seedTeamStandings,
  teams as seedTeams,
  vehicles as seedVehicles,
} from '@/data/seed'
import { useCompetition } from '@/store/useCompetition'
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

export function getDriver(id: string): Driver {
  const drivers = useCompetition.getState().drivers
  return drivers.find((driver) => driver.id === id) ?? seedDrivers[0]
}

export function getTeam(id: string): Team {
  const teams = useCompetition.getState().teams
  return teams.find((team) => team.id === id) ?? seedTeams[0]
}

export function getVehicle(id: string): Vehicle {
  const vehicles = useCompetition.getState().vehicles
  return vehicles.find((vehicle) => vehicle.id === id) ?? seedVehicles[0]
}

export function getCircuit(id: string): Circuit {
  const circuits = useCompetition.getState().circuits
  return circuits.find((circuit) => circuit.id === id) ?? seedCircuits[0]
}

export function getEvent(id: string): RaceEvent {
  const events = useCompetition.getState().events
  return events.find((event) => event.id === id) ?? seedEvents[0]
}

export function getChampionship(): Championship {
  const championships = useCompetition.getState().championships
  return championships[0] ?? seedChampionship
}

export function getStanding(driverId: string): StandingRow {
  const standings = useCompetition.getState().standings
  return (
    standings.find((row) => row.driverId === driverId) ??
    seedStandings.find((row) => row.driverId === driverId) ??
    seedStandings[0]
  )
}

export function getTeamStanding(teamId: string): TeamStanding {
  const teamStandings = useCompetition.getState().teamStandings
  return (
    teamStandings.find((row) => row.teamId === teamId) ??
    seedTeamStandings.find((row) => row.teamId === teamId) ??
    seedTeamStandings[0]
  )
}

export function getDriversByTeam(teamId: string): Driver[] {
  const drivers = useCompetition.getState().drivers
  return drivers.filter((driver) => driver.teamId === teamId)
}

export function getDriversByVehicle(vehicleId: string): Driver[] {
  const drivers = useCompetition.getState().drivers
  return drivers.filter((driver) => driver.vehicleId === vehicleId)
}

export function getVehicleForDriver(driver: Driver): Vehicle {
  return getVehicle(driver.vehicleId)
}

export function getEventsForChampionship(championshipId: string): RaceEvent[] {
  const events = useCompetition.getState().events
  return events
    .filter((event) => event.championshipId === championshipId)
    .sort((a, b) => a.round - b.round)
}

export function getEventForCircuit(circuitId: string): RaceEvent | undefined {
  const events = useCompetition.getState().events
  return events.find((event) => event.circuitId === circuitId)
}

export function pointsForPosition(position: number): number {
  return POINTS_SCALE[position - 1] ?? 0
}

export function pointsByRound(driver: Driver): number[] {
  return (driver.results || []).map((result, index) => {
    if (typeof result !== 'number') return 0
    return (POINTS_SCALE[result - 1] ?? 0) + (driver.fastestLapRounds?.includes(index + 1) ? 1 : 0)
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

export { driverPoints, seedStandings as standings, seedTeamStandings as teamStandings }
