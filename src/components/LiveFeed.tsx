import {
  AlertTriangle,
  ArrowUpRight,
  Flag,
  Gauge,
  Info,
  Trophy,
  Wrench,
} from 'lucide-react'
import type { FeedItem } from '@/types'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui'

const feedIcons = {
  lap: Gauge,
  pit: Wrench,
  flag: Flag,
  penalty: AlertTriangle,
  info: Info,
  finish: Trophy,
  overtake: ArrowUpRight,
}

const accentClasses = {
  lime: 'text-accent border-accent/25 bg-accent/10',
  red: 'text-red border-red/25 bg-red/10',
  amber: 'text-amber border-amber/25 bg-amber/10',
  purple: 'text-purple border-purple/25 bg-purple/10',
  sky: 'text-sky border-sky/25 bg-sky/10',
  muted: 'text-muted border-line bg-surface-3',
}

export function LiveFeed({
  items,
  className,
  maxHeight = 'max-h-[420px]',
  showHeader = true,
}: {
  items: FeedItem[]
  className?: string
  maxHeight?: string
  showHeader?: boolean
}) {
  return (
    <div className={cn('panel flex flex-col', className)}>
      {showHeader ? (
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-red live-dot" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-red" />
            </span>
            <h2 className="text-sm font-semibold text-text">Race control</h2>
          </div>
          <Badge tone="red" dot>
            En vivo
          </Badge>
        </div>
      ) : null}

      <div className={cn('flex-1 overflow-y-auto', maxHeight)}>
        {items.length === 0 ? (
          <div className="px-4 py-8 text-center text-xs text-muted">Sin eventos todavía.</div>
        ) : (
          <ol className="divide-y divide-line/70">
            {items.map((item, index) => {
              const Icon = feedIcons[item.type]
              return (
                <li
                  key={item.id}
                  className={cn('flex gap-3 px-4 py-3', index === 0 && 'feed-in bg-surface-2/40')}
                >
                  <span
                    className={cn(
                      'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border',
                      accentClasses[item.accent ?? 'muted'],
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-xs font-semibold leading-snug text-text">{item.message}</p>
                      <span className="num shrink-0 font-mono text-[10px] text-dim">{item.time}</span>
                    </div>
                    {item.detail ? (
                      <p className="mt-0.5 text-[11px] leading-relaxed text-muted">{item.detail}</p>
                    ) : null}
                  </div>
                </li>
              )
            })}
          </ol>
        )}
      </div>
    </div>
  )
}
