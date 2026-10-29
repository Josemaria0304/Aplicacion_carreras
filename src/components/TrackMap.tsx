import { useId } from 'react'
import type { Flag } from '@/types'
import { cn } from '@/lib/utils'

const TRACK_PATH =
  'M62 148 C42 132 40 106 58 88 C76 70 100 72 112 56 C124 40 146 30 170 34 C194 38 206 52 228 54 C250 56 268 44 286 50 C306 56 314 76 304 92 C294 108 270 106 256 118 C242 130 248 150 232 160 C214 172 190 166 172 154 C154 142 140 150 122 156 C106 162 90 160 78 154 C70 150 66 149 62 148 Z'

const flagColors: Record<Flag, string> = {
  green: '#C9F73A',
  yellow: '#FFB020',
  safetyCar: '#FFB020',
  red: '#FF4D5A',
  chequered: '#F4F6F9',
}

export function TrackMap({
  className,
  flag = 'green',
  labels = true,
  animated = true,
}: {
  className?: string
  flag?: Flag
  labels?: boolean
  animated?: boolean
}) {
  const rawId = useId()
  const glowId = `track-glow-${rawId.replace(/[^a-zA-Z0-9]/g, '')}`
  const gradientId = `track-gradient-${rawId.replace(/[^a-zA-Z0-9]/g, '')}`
  const accent = flagColors[flag]

  return (
    <svg viewBox="0 0 360 200" className={cn('h-full w-full', className)} role="img" aria-label="Mapa del circuito de Interlagos">
      <defs>
        <filter id={glowId} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={accent} stopOpacity="0.9" />
          <stop offset="100%" stopColor={accent} stopOpacity="0.28" />
        </linearGradient>
      </defs>

      <g opacity="0.28" stroke="#39414D" strokeWidth="0.6">
        {[24, 48, 72, 96, 120, 144, 168, 192].map((y) => (
          <line key={`h-${y}`} x1="16" y1={y} x2="344" y2={y} strokeDasharray="2 8" />
        ))}
        {[36, 72, 108, 144, 180, 216, 252, 288, 324].map((x) => (
          <line key={`v-${x}`} x1={x} y1="16" x2={x} y2="184" strokeDasharray="2 8" />
        ))}
      </g>

      <path d={TRACK_PATH} fill="none" stroke="#1B212A" strokeWidth="17" strokeLinejoin="round" />
      <path d={TRACK_PATH} fill="none" stroke="#2B333F" strokeWidth="12" strokeLinejoin="round" />
      <path
        d={TRACK_PATH}
        fill="none"
        stroke={`url(#${gradientId})`}
        strokeWidth="4"
        strokeLinejoin="round"
        filter={`url(#${glowId})`}
        opacity="0.9"
      />
      <path
        d={TRACK_PATH}
        fill="none"
        stroke="#E9FFB0"
        strokeWidth="1"
        strokeLinejoin="round"
        opacity="0.45"
        className={animated ? 'track-dash' : undefined}
      />

      <line x1="57" y1="141" x2="69" y2="155" stroke="#F4F6F9" strokeWidth="2.5" />
      <line x1="52" y1="146" x2="64" y2="160" stroke="#0B0D11" strokeWidth="2.5" />

      {labels ? (
        <g fill="#7C8798" fontSize="7" fontFamily="Inter Variable, sans-serif" fontWeight="600" letterSpacing="0.08em">
          <text x="70" y="80">S1</text>
          <text x="205" y="36">S2</text>
          <text x="278" y="172">S3</text>
          <text x="28" y="172">META</text>
        </g>
      ) : null}

      {animated ? (
        <>
          <circle r="3.6" fill={accent} filter={`url(#${glowId})`}>
            <animateMotion dur="16s" repeatCount="indefinite" path={TRACK_PATH} />
          </circle>
          <circle r="3" fill="#59C7F2" opacity="0.9">
            <animateMotion dur="16s" begin="-5.2s" repeatCount="indefinite" path={TRACK_PATH} />
          </circle>
          <circle r="2.8" fill="#FF6B6B" opacity="0.9">
            <animateMotion dur="16s" begin="-10.4s" repeatCount="indefinite" path={TRACK_PATH} />
          </circle>
        </>
      ) : null}
    </svg>
  )
}
