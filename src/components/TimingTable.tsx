import { ArrowDown, ArrowUp, Minus } from 'lucide-react'
import type { LiveEntry } from '@/types'
import { getDriver, getTeam } from '@/lib/data'
import { cn, formatGap, formatLap } from '@/lib/utils'

const qualityClasses = {
  best: 'border-purple/30 bg-purple/15 text-purple',
  personal: 'border-green/25 bg-green/10 text-green',
  slow: 'border-line bg-surface-3 text-muted',
}

const statusLabel: Record<string, string> = {
  running: 'EN PISTA',
  pit: 'BOX',
  dnf: 'DNF',
  dsq: 'DSQ',
  finished: 'FIN',
}

function PositionDelta({ entry }: { entry: LiveEntry }) {
  const delta = entry.previousPosition - entry.position
  if (delta > 0) {
    return (
      <span className="inline-flex items-center text-green" title={`Gana ${delta} posiciones`}>
        <ArrowUp className="h-3 w-3" />
      </span>
    )
  }
  if (delta < 0) {
    return (
      <span className="inline-flex items-center text-red" title={`Pierde ${Math.abs(delta)} posiciones`}>
        <ArrowDown className="h-3 w-3" />
      </span>
    )
  }
  return <Minus className="h-2.5 w-2.5 text-dim/50" />
}

function gapLabel(entry: LiveEntry): string {
  if (entry.position === 1) return 'LÍDER'
  if (entry.lapsDown > 0) return `+${entry.lapsDown} V.`
  return formatGap(entry.gapMs)
}

function statusTone(entry: LiveEntry) {
  if (entry.status === 'pit') return 'border-amber/30 bg-amber/10 text-amber'
  if (entry.status === 'dsq') return 'border-red/30 bg-red/10 text-red'
  if (entry.status === 'dnf') return 'border-line bg-surface-3 text-dim'
  if (entry.status === 'finished') return 'border-text/25 bg-text/10 text-text'
  return 'border-line bg-surface-3 text-dim'
}

export function TimingTable({
  entries,
  showSectors = true,
  compact = false,
  onSelect,
  selectedId,
  maxRows,
}: {
  entries: LiveEntry[]
  showSectors?: boolean
  compact?: boolean
  onSelect?: (entry: LiveEntry) => void
  selectedId?: string | null
  maxRows?: number
}) {
  const sorted = [...entries].sort((a, b) => a.position - b.position)
  const rows = typeof maxRows === 'number' ? sorted.slice(0, maxRows) : sorted
  const rowPadding = compact ? 'py-1.5' : 'py-2.5'

  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[820px] border-collapse text-left">
          <thead>
            <tr className="border-b border-line text-[9px] uppercase tracking-[0.16em] text-dim">
              <th className="w-12 py-2 pl-4 pr-1 font-semibold">Pos</th>
              <th className="w-10 py-2 pr-1 font-semibold">#</th>
              <th className="py-2 pr-3 font-semibold">Piloto</th>
              <th className="w-12 py-2 pr-2 text-center font-semibold">V</th>
              <th className="w-24 py-2 pr-2 text-right font-semibold">Última</th>
              <th className="w-24 py-2 pr-2 text-right font-semibold">Mejor</th>
              {showSectors ? (
                <>
                  <th className="w-16 py-2 pr-1 text-center font-semibold">S1</th>
                  <th className="w-16 py-2 pr-1 text-center font-semibold">S2</th>
                  <th className="w-16 py-2 pr-1 text-center font-semibold">S3</th>
                </>
              ) : null}
              <th className="w-12 py-2 pr-2 text-center font-semibold">Pit</th>
              <th className="w-24 py-2 pr-2 text-right font-semibold">Gap</th>
              <th className="w-24 py-2 pr-2 text-right font-semibold">Int</th>
              <th className="w-24 py-2 pr-4 text-right font-semibold">Estado</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((entry) => {
              const driver = getDriver(entry.driverId)
              const team = getTeam(entry.teamId)
              const selected = selectedId === entry.id
              return (
                <tr
                  key={entry.id}
                  onClick={() => onSelect?.(entry)}
                  className={cn(
                    'border-b border-line/60 transition-colors last:border-0',
                    entry.position === 1 && 'bg-accent/[0.035]',
                    selected ? 'bg-accent/10' : onSelect && 'cursor-pointer hover:bg-surface-2',
                    entry.status === 'dsq' && 'opacity-50',
                  )}
                >
                  <td className={cn('pl-4 pr-1', rowPadding)}>
                    <div className="flex items-center gap-1.5">
                      <span className="num font-display text-base font-semibold text-text">{entry.position}</span>
                      <PositionDelta entry={entry} />
                    </div>
                  </td>
                  <td className={cn('pr-1', rowPadding)}>
                    <span
                      className="num inline-flex h-6 min-w-6 items-center justify-center rounded border px-1 font-display text-xs font-bold"
                      style={{
                        color: team.color,
                        borderColor: `${team.color}55`,
                        backgroundColor: `${team.color}14`,
                      }}
                    >
                      {entry.number}
                    </span>
                  </td>
                  <td className={cn('pr-3', rowPadding)}>
                    <div className="flex items-center gap-2.5">
                      <span className="h-7 w-[3px] rounded-full" style={{ backgroundColor: team.color }} />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate text-xs font-semibold text-text">{driver.displayName}</span>
                          {entry.hasFastestLap ? (
                            <span className="h-1.5 w-1.5 rounded-full bg-purple" title="Vuelta rápida" />
                          ) : null}
                        </div>
                        <p className="truncate text-[10px] text-dim">
                          {team.shortName} · {driver.category}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className={cn('num text-center text-xs text-muted', rowPadding)}>{entry.lapsCompleted}</td>
                  <td className={cn('num pr-2 text-right font-mono text-xs', rowPadding)}>
                    <span key={`last-${entry.lastUpdate}`} className={cn(entry.lastUpdate ? 'value-flash' : 'text-text')}>
                      {formatLap(entry.lastLapMs)}
                    </span>
                  </td>
                  <td
                    className={cn(
                      'num pr-2 text-right font-mono text-xs',
                      entry.hasFastestLap ? 'text-purple' : 'text-muted',
                      rowPadding,
                    )}
                  >
                    {formatLap(entry.bestLapMs)}
                  </td>
                  {showSectors
                    ? entry.sectors.map((sector, index) => (
                        <td key={`${entry.id}-s${index}`} className={cn('pr-1 text-center', rowPadding)}>
                          <span
                            className={cn(
                              'num inline-flex h-5 min-w-[42px] items-center justify-center rounded border px-1 font-mono text-[10px]',
                              qualityClasses[entry.sectorQuality[index]],
                            )}
                          >
                            {(sector / 1000).toFixed(3)}
                          </span>
                        </td>
                      ))
                    : null}
                  <td className={cn('text-center', rowPadding)}>
                    {entry.pitStops > 0 ? (
                      <span className="num inline-flex items-center gap-1 text-[10px] text-muted">
                        <span className="rounded bg-surface-3 px-1.5 py-0.5 font-mono">{entry.pitStops}</span>
                      </span>
                    ) : (
                      <span className="text-[10px] text-dim">—</span>
                    )}
                  </td>
                  <td
                    className={cn(
                      'num pr-2 text-right font-mono text-xs',
                      entry.position === 1 ? 'font-semibold text-accent' : 'text-text',
                      rowPadding,
                    )}
                  >
                    {gapLabel(entry)}
                  </td>
                  <td className={cn('num pr-2 text-right font-mono text-[11px] text-muted', rowPadding)}>
                    {entry.position === 1 ? '—' : entry.lapsDown > 0 ? '—' : formatGap(entry.intervalMs)}
                  </td>
                  <td className={cn('pr-4 text-right', rowPadding)}>
                    <span
                      className={cn(
                        'inline-flex rounded border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider',
                        statusTone(entry),
                      )}
                    >
                      {statusLabel[entry.status]}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="space-y-2 p-3 md:hidden">
        {rows.map((entry) => {
          const driver = getDriver(entry.driverId)
          const team = getTeam(entry.teamId)
          const selected = selectedId === entry.id
          return (
            <button
              key={entry.id}
              onClick={() => onSelect?.(entry)}
              className={cn(
                'w-full rounded-xl border border-line bg-surface-2 p-3 text-left transition-colors',
                entry.position === 1 && 'border-accent/20 bg-accent/[0.04]',
                selected && 'border-accent/50 bg-accent/10',
              )}
            >
              <div className="flex items-center gap-3">
                <span className="num w-6 font-display text-lg font-semibold text-text">{entry.position}</span>
                <span
                  className="num flex h-8 min-w-8 items-center justify-center rounded-md border px-1 font-display text-sm font-bold"
                  style={{
                    color: team.color,
                    borderColor: `${team.color}55`,
                    backgroundColor: `${team.color}14`,
                  }}
                >
                  {entry.number}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate text-sm font-semibold text-text">{driver.displayName}</span>
                    {entry.hasFastestLap ? <span className="h-1.5 w-1.5 rounded-full bg-purple" /> : null}
                  </div>
                  <p className="text-[10px] text-dim">
                    {team.shortName} · {entry.lapsCompleted} vueltas
                  </p>
                </div>
                <div className="text-right">
                  <p className="num font-mono text-xs font-semibold text-text">{gapLabel(entry)}</p>
                  <p className="text-[9px] uppercase tracking-wider text-dim">{statusLabel[entry.status]}</p>
                </div>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2 border-t border-line/70 pt-2">
                <div>
                  <p className="text-[9px] uppercase tracking-wider text-dim">Última</p>
                  <p className="num font-mono text-xs text-text">{formatLap(entry.lastLapMs)}</p>
                </div>
                <div>
                  <p className="text-[9px] uppercase tracking-wider text-dim">Mejor</p>
                  <p className={cn('num font-mono text-xs', entry.hasFastestLap ? 'text-purple' : 'text-muted')}>
                    {formatLap(entry.bestLapMs)}
                  </p>
                </div>
              </div>
              {showSectors ? (
                <div className="mt-2 grid grid-cols-3 gap-1">
                  {entry.sectors.map((sector, index) => (
                    <span
                      key={`${entry.id}-mobile-s${index}`}
                      className={cn(
                        'num rounded border px-1 py-0.5 text-center font-mono text-[10px]',
                        qualityClasses[entry.sectorQuality[index]],
                      )}
                    >
                      {(sector / 1000).toFixed(3)}
                    </span>
                  ))}
                </div>
              ) : null}
            </button>
          )
        })}
      </div>
    </>
  )
}
