import type { Permission, Role } from '@/types'

export interface RoleMeta {
  label: string
  short: string
  description: string
  permissions: Permission[]
  accent: string
}

export const roleMeta: Record<Role, RoleMeta> = {
  organizer: {
    label: 'Organizador',
    short: 'ORG',
    description: 'Control total del campeonato, eventos, personal y publicación de resultados.',
    permissions: [
      'event:manage',
      'race:control',
      'timing:write',
      'penalty:write',
      'results:publish',
      'admin:users',
      'medical:view',
    ],
    accent: '#C9F73A',
  },
  director: {
    label: 'Dirección de Carrera',
    short: 'RD',
    description: 'Banderas, estado de sesión, sanciones y aprobación de resultados.',
    permissions: ['race:control', 'penalty:write', 'timing:write', 'results:publish', 'medical:view'],
    accent: '#FF6B6B',
  },
  steward: {
    label: 'Comisario',
    short: 'STW',
    description: 'Verificación técnica, incidencias y propuesta de sanciones.',
    permissions: ['penalty:write', 'medical:view'],
    accent: '#FFB020',
  },
  timekeeper: {
    label: 'Cronometrista',
    short: 'TIM',
    description: 'Captura, corrección e importación de tiempos oficiales.',
    permissions: ['timing:write'],
    accent: '#59C7F2',
  },
  pilot: {
    label: 'Piloto',
    short: 'PLT',
    description: 'Consulta de ficha, inscripciones, resultados y documentos propios.',
    permissions: ['entry:own'],
    accent: '#B388FF',
  },
  press: {
    label: 'Prensa',
    short: 'PRS',
    description: 'Resultados publicados, perfiles y material acreditado.',
    permissions: [],
    accent: '#F472B6',
  },
  public: {
    label: 'Espectador',
    short: 'PUB',
    description: 'Live timing y clasificaciones públicas.',
    permissions: [],
    accent: '#98A2B3',
  },
}

export function can(role: Role, permission: Permission): boolean {
  return roleMeta[role].permissions.includes(permission)
}

export const roleOrder: Role[] = [
  'organizer',
  'director',
  'steward',
  'timekeeper',
  'pilot',
  'press',
  'public',
]
