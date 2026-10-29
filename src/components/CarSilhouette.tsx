import { cn } from '@/lib/utils'

export function CarSilhouette({
  color = '#C9F73A',
  className,
}: {
  color?: string
  className?: string
}) {
  return (
    <svg
      viewBox="0 0 480 180"
      className={cn('h-full w-full', className)}
      role="img"
      aria-label="Silueta de auto GT3"
    >
      <defs>
        <linearGradient id="car-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2A323E" />
          <stop offset="100%" stopColor="#141920" />
        </linearGradient>
        <linearGradient id="car-accent" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={color} stopOpacity="0.95" />
          <stop offset="100%" stopColor={color} stopOpacity="0.35" />
        </linearGradient>
      </defs>

      <ellipse cx="240" cy="148" rx="190" ry="13" fill="#000" opacity="0.35" />

      <path
        d="M30 114 L44 96 C52 84 68 78 88 76 L126 72 L160 50 C174 42 194 38 216 38 L292 38 C318 38 338 44 354 56 L378 75 L412 81 C430 84 442 93 448 106 L452 120 L440 130 L34 130 Z"
        fill="url(#car-body)"
        stroke="#3B4552"
        strokeWidth="1.5"
      />

      <path
        d="M164 52 L196 44 C210 41 226 40 242 40 L288 40 C308 40 324 45 336 54 L354 68 L176 68 Z"
        fill="#0D1116"
        stroke={color}
        strokeWidth="1"
        opacity="0.9"
      />
      <path d="M188 52 L210 46 L240 45 L240 64 L184 64 Z" fill={color} opacity="0.14" />
      <path d="M284 46 L310 48 L330 62 L288 62 Z" fill={color} opacity="0.1" />

      <path
        d="M42 110 C120 100 220 98 336 104 L442 112"
        fill="none"
        stroke="url(#car-accent)"
        strokeWidth="3"
        opacity="0.9"
      />
      <path d="M34 122 L448 122" stroke={color} strokeWidth="1" opacity="0.35" />
      <path d="M30 118 L20 124 L34 128 Z" fill="#0D1116" stroke="#3B4552" />
      <path d="M440 116 L466 118 L462 127 L442 128 Z" fill="#0D1116" stroke="#3B4552" />

      <rect x="352" y="62" width="34" height="4" rx="2" fill="#0D1116" stroke="#3B4552" />
      <rect x="354" y="58" width="4" height="12" fill={color} opacity="0.6" />

      <g>
        <circle cx="128" cy="130" r="27" fill="#0A0C10" stroke="#3B4552" strokeWidth="2" />
        <circle cx="128" cy="130" r="16" fill="#171C23" stroke={color} strokeWidth="1.5" opacity="0.8" />
        <circle cx="128" cy="130" r="5" fill="#3B4552" />
        <circle cx="372" cy="130" r="27" fill="#0A0C10" stroke="#3B4552" strokeWidth="2" />
        <circle cx="372" cy="130" r="16" fill="#171C23" stroke={color} strokeWidth="1.5" opacity="0.8" />
        <circle cx="372" cy="130" r="5" fill="#3B4552" />
      </g>

      <g fill={color} opacity="0.8">
        <rect x="304" y="84" width="18" height="3" rx="1.5" />
        <rect x="330" y="84" width="12" height="3" rx="1.5" />
      </g>
      <text x="402" y="102" fill="#7C8798" fontSize="11" fontFamily="Barlow Condensed, sans-serif" fontWeight="700" letterSpacing="1">
        GT3
      </text>
    </svg>
  )
}
