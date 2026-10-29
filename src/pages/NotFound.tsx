import { Link } from 'react-router-dom'
import { ArrowLeft, Compass, Flag, Timer } from 'lucide-react'
import { Button, Card } from '@/components/ui'
import { TrackMap } from '@/components/TrackMap'

export function NotFoundPage() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <Card className="relative w-full max-w-2xl overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-grid opacity-40" />
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-red/10 blur-3xl" />
        <div className="relative p-6 sm:p-10">
          <div className="flex items-center gap-2">
            <Flag className="h-4 w-4 text-red" />
            <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-red">Bandera roja</span>
          </div>
          <p className="num mt-4 font-display text-7xl font-bold leading-none tracking-tight text-text sm:text-8xl">
            404
          </p>
          <h1 className="mt-3 font-display text-3xl font-semibold uppercase leading-none text-text">
            Fuera de pista
          </h1>
          <p className="mt-2 max-w-md text-xs leading-relaxed text-muted">
            La ruta solicitada no existe o la sesión ya no está disponible. Vuelve al centro de control
            para continuar operando el evento.
          </p>

          <div className="pointer-events-none mt-6 h-24 opacity-70">
            <TrackMap animated={false} labels={false} flag="red" />
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <Link to="/">
              <Button>
                <ArrowLeft className="h-4 w-4" />
                Volver al dashboard
              </Button>
            </Link>
            <Link to="/live">
              <Button variant="secondary">
                <Timer className="h-4 w-4" />
                Ir a live timing
              </Button>
            </Link>
            <Link to="/campeonatos">
              <Button variant="ghost">
                <Compass className="h-4 w-4" />
                Ver calendario
              </Button>
            </Link>
          </div>
        </div>
      </Card>
    </div>
  )
}
