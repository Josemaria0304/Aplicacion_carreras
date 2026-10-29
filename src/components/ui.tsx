import { useEffect, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import { createPortal } from 'react-dom'
import { AlertTriangle, Check, Info, X, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSession } from '@/store/useSession'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'
type ButtonSize = 'sm' | 'md' | 'lg' | 'icon'

const buttonVariants: Record<ButtonVariant, string> = {
  primary:
    'bg-accent text-accent-ink hover:bg-accent-strong active:bg-accent/90 font-semibold shadow-[0_8px_30px_-12px_rgba(201,247,58,0.55)]',
  secondary:
    'bg-surface-2 text-text border border-line hover:border-line-strong hover:bg-surface-3 font-medium',
  ghost: 'text-muted hover:text-text hover:bg-surface-2 font-medium',
  danger:
    'bg-red/10 text-red border border-red/30 hover:bg-red/20 hover:border-red/50 font-medium',
  outline:
    'border border-line text-text hover:border-line-strong hover:bg-surface-2 font-medium',
}

const buttonSizes: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-12 px-6 text-sm gap-2',
  icon: 'h-9 w-9 p-0',
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
}

export function Button({
  className,
  variant = 'primary',
  size = 'md',
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex items-center justify-center rounded-lg transition-all duration-150 disabled:pointer-events-none disabled:opacity-45',
        buttonVariants[variant],
        buttonSizes[size],
        className,
      )}
      {...props}
    />
  )
}

type BadgeTone = 'neutral' | 'accent' | 'red' | 'amber' | 'green' | 'purple' | 'sky' | 'pink'

const badgeTones: Record<BadgeTone, string> = {
  neutral: 'bg-surface-3 text-muted border-line',
  accent: 'bg-accent/10 text-accent border-accent/25',
  red: 'bg-red/10 text-red border-red/25',
  amber: 'bg-amber/10 text-amber border-amber/25',
  green: 'bg-green/10 text-green border-green/25',
  purple: 'bg-purple/10 text-purple border-purple/25',
  sky: 'bg-sky/10 text-sky border-sky/25',
  pink: 'bg-pink/10 text-pink border-pink/25',
}

export function Badge({
  children,
  tone = 'neutral',
  className,
  dot,
}: {
  children: ReactNode
  tone?: BadgeTone
  className?: string
  dot?: boolean
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider',
        badgeTones[tone],
        className,
      )}
    >
      {dot ? <span className="h-1.5 w-1.5 rounded-full bg-current" /> : null}
      {children}
    </span>
  )
}

export function Card({
  children,
  className,
  hover,
}: {
  children: ReactNode
  className?: string
  hover?: boolean
}) {
  return (
    <div className={cn('panel', hover && 'panel-hover', className)}>{children}</div>
  )
}

export function CardHeader({
  title,
  subtitle,
  action,
  icon,
  className,
}: {
  title: ReactNode
  subtitle?: ReactNode
  action?: ReactNode
  icon?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex items-start justify-between gap-4 border-b border-line px-4 py-3.5 sm:px-5', className)}>
      <div className="flex min-w-0 items-start gap-2.5">
        {icon ? <div className="mt-0.5 text-muted">{icon}</div> : null}
        <div className="min-w-0">
          <h2 className="truncate text-sm font-semibold text-text">{title}</h2>
          {subtitle ? <p className="mt-0.5 text-xs text-muted">{subtitle}</p> : null}
        </div>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  )
}

export function Avatar({
  name,
  color = '#C9F73A',
  size = 'md',
  className,
}: {
  name: string
  color?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}) {
  const parts = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
  const sizes = {
    sm: 'h-7 w-7 text-[10px]',
    md: 'h-9 w-9 text-xs',
    lg: 'h-12 w-12 text-sm',
    xl: 'h-20 w-20 text-2xl',
  }
  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center rounded-xl border font-display font-bold tracking-wide',
        sizes[size],
        className,
      )}
      style={{
        backgroundColor: `${color}1a`,
        borderColor: `${color}40`,
        color,
      }}
      aria-hidden="true"
    >
      {parts}
    </div>
  )
}

export function StatCard({
  label,
  value,
  detail,
  icon,
  accent = 'accent',
  onClick,
}: {
  label: string
  value: ReactNode
  detail?: ReactNode
  icon?: ReactNode
  accent?: 'accent' | 'red' | 'amber' | 'green' | 'purple' | 'sky' | 'pink'
  onClick?: () => void
}) {
  const accents: Record<string, string> = {
    accent: 'text-accent bg-accent/10 border-accent/20',
    red: 'text-red bg-red/10 border-red/20',
    amber: 'text-amber bg-amber/10 border-amber/20',
    green: 'text-green bg-green/10 border-green/20',
    purple: 'text-purple bg-purple/10 border-purple/20',
    sky: 'text-sky bg-sky/10 border-sky/20',
    pink: 'text-pink bg-pink/10 border-pink/20',
  }
  const Comp = onClick ? 'button' : 'div'
  return (
    <Comp
      onClick={onClick}
      className={cn(
        'panel flex items-center gap-3.5 p-4 text-left',
        onClick && 'panel-hover cursor-pointer',
      )}
    >
      {icon ? (
        <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border', accents[accent])}>
          {icon}
        </div>
      ) : null}
      <div className="min-w-0">
        <p className="label truncate">{label}</p>
        <p className="num mt-0.5 font-display text-2xl font-semibold leading-none text-text">{value}</p>
        {detail ? <p className="mt-1 truncate text-[11px] text-muted">{detail}</p> : null}
      </div>
    </Comp>
  )
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  children,
}: {
  eyebrow?: ReactNode
  title: ReactNode
  description?: ReactNode
  actions?: ReactNode
  children?: ReactNode
}) {
  return (
    <div className="mb-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          {eyebrow ? <div className="mb-2 flex items-center gap-2">{eyebrow}</div> : null}
          <h1 className="font-display text-3xl font-semibold uppercase leading-none tracking-tight text-text sm:text-4xl">
            {title}
          </h1>
          {description ? (
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
      {children ? <div className="mt-4">{children}</div> : null}
    </div>
  )
}

export function Tabs({
  items,
  value,
  onChange,
  className,
}: {
  items: { id: string; label: string; count?: number }[]
  value: string
  onChange: (id: string) => void
  className?: string
}) {
  return (
    <div className={cn('flex gap-1 overflow-x-auto border-b border-line', className)} role="tablist">
      {items.map((item) => {
        const active = item.id === value
        return (
          <button
            key={item.id}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.id)}
            className={cn(
              'relative shrink-0 px-3 py-2.5 text-xs font-semibold uppercase tracking-wider transition-colors',
              active ? 'text-text' : 'text-muted hover:text-text',
            )}
          >
            <span className="flex items-center gap-1.5">
              {item.label}
              {typeof item.count === 'number' ? (
                <span className="rounded bg-surface-3 px-1.5 py-0.5 text-[10px] text-muted">{item.count}</span>
              ) : null}
            </span>
            {active ? <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-accent" /> : null}
          </button>
        )
      })}
    </div>
  )
}

export function ProgressBar({
  value,
  max = 100,
  color = 'accent',
  className,
}: {
  value: number
  max?: number
  color?: 'accent' | 'red' | 'amber' | 'green' | 'purple' | 'sky' | 'pink'
  className?: string
}) {
  const colors: Record<string, string> = {
    accent: 'bg-accent',
    red: 'bg-red',
    amber: 'bg-amber',
    green: 'bg-green',
    purple: 'bg-purple',
    sky: 'bg-sky',
    pink: 'bg-pink',
  }
  const percent = Math.max(0, Math.min(100, (value / max) * 100))
  return (
    <div className={cn('h-1.5 w-full overflow-hidden rounded-full bg-surface-3', className)}>
      <div
        className={cn('bar-grow h-full rounded-full', colors[color])}
        style={{ width: `${percent}%` }}
      />
    </div>
  )
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'h-10 w-full rounded-lg border border-line bg-surface-2 px-3 text-sm text-text placeholder:text-dim outline-none transition-colors focus:border-accent/50 focus:bg-surface-3',
        className,
      )}
      {...props}
    />
  )
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        'w-full rounded-lg border border-line bg-surface-2 px-3 py-2.5 text-sm text-text placeholder:text-dim outline-none transition-colors focus:border-accent/50 focus:bg-surface-3',
        className,
      )}
      {...props}
    />
  )
}

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        'h-10 w-full appearance-none rounded-lg border border-line bg-surface-2 px-3 text-sm text-text outline-none transition-colors focus:border-accent/50',
        className,
      )}
      {...props}
    >
      {children}
    </select>
  )
}

export function Field({
  label,
  hint,
  children,
  className,
}: {
  label: string
  hint?: string
  children: ReactNode
  className?: string
}) {
  return (
    <label className={cn('block space-y-1.5', className)}>
      <span className="label block">{label}</span>
      {children}
      {hint ? <span className="block text-[11px] text-dim">{hint}</span> : null}
    </label>
  )
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
}: {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg'
}) {
  useEffect(() => {
    if (!open) return
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = previous
    }
  }, [open, onClose])

  if (!open) return null

  const widths = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl' }

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={cn(
          'relative z-10 w-full rounded-t-2xl border border-line bg-surface shadow-2xl sm:rounded-2xl',
          widths[size],
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
          <div>
            <h2 id="modal-title" className="font-display text-xl font-semibold uppercase tracking-wide text-text">
              {title}
            </h2>
            {description ? <p className="mt-1 text-xs text-muted">{description}</p> : null}
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted transition-colors hover:bg-surface-3 hover:text-text"
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto px-5 py-4">{children}</div>
        {footer ? <div className="flex justify-end gap-2 border-t border-line px-5 py-3.5">{footer}</div> : null}
      </div>
    </div>,
    document.body,
  )
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-line bg-surface-2 text-muted">
        {icon ?? <Info className="h-5 w-5" />}
      </div>
      <h3 className="text-sm font-semibold text-text">{title}</h3>
      {description ? <p className="mt-1 max-w-sm text-xs text-muted">{description}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  )
}

const toastIcons = {
  success: <Check className="h-4 w-4" />,
  error: <XCircle className="h-4 w-4" />,
  warning: <AlertTriangle className="h-4 w-4" />,
  info: <Info className="h-4 w-4" />,
}

const toastTones = {
  success: 'border-green/30 bg-green/10 text-green',
  error: 'border-red/30 bg-red/10 text-red',
  warning: 'border-amber/30 bg-amber/10 text-amber',
  info: 'border-sky/30 bg-sky/10 text-sky',
}

export function ToastViewport() {
  const toasts = useSession((state) => state.toasts)
  const dismissToast = useSession((state) => state.dismissToast)

  return createPortal(
    <div className="pointer-events-none fixed bottom-4 right-4 z-[120] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto flex items-start gap-3 rounded-xl border border-line bg-surface/95 p-3.5 shadow-2xl backdrop-blur slide-in-right"
        >
          <div className={cn('mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border', toastTones[toast.tone])}>
            {toastIcons[toast.tone]}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-text">{toast.title}</p>
            {toast.description ? <p className="mt-0.5 text-xs leading-relaxed text-muted">{toast.description}</p> : null}
          </div>
          <button
            onClick={() => dismissToast(toast.id)}
            className="rounded p-1 text-dim transition-colors hover:text-text"
            aria-label="Cerrar notificación"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>,
    document.body,
  )
}

export function StatusPill({
  tone = 'green',
  children,
  pulse,
  className,
}: {
  tone?: 'green' | 'red' | 'amber' | 'neutral' | 'sky'
  children: ReactNode
  pulse?: boolean
  className?: string
}) {
  const tones = {
    green: 'border-green/25 bg-green/10 text-green',
    red: 'border-red/25 bg-red/10 text-red',
    amber: 'border-amber/25 bg-amber/10 text-amber',
    neutral: 'border-line bg-surface-2 text-muted',
    sky: 'border-sky/25 bg-sky/10 text-sky',
  }
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[10px] font-bold uppercase tracking-widest',
        tones[tone],
        className,
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full bg-current', pulse && 'live-dot')} />
      {children}
    </span>
  )
}
