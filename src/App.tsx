import { useEffect, type ReactNode } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { useCompetition } from '@/store/useCompetition'
import { useSession } from '@/store/useSession'
import { LoginPage } from '@/pages/Login'
import { DashboardPage } from '@/pages/Dashboard'
import { LiveTimingPage } from '@/pages/LiveTiming'
import { DriversPage } from '@/pages/Drivers'
import { DriverDetailPage } from '@/pages/DriverDetail'
import { VehiclesPage } from '@/pages/Vehicles'
import { VehicleDetailPage } from '@/pages/VehicleDetail'
import { ChampionshipsPage } from '@/pages/Championships'
import { ChampionshipDetailPage } from '@/pages/ChampionshipDetail'
import { EventDetailPage } from '@/pages/EventDetail'
import { StandingsPage } from '@/pages/Standings'
import { AdminPage } from '@/pages/Admin'
import { SettingsPage } from '@/pages/Settings'
import { NotFoundPage } from '@/pages/NotFound'

function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
  }, [pathname])

  return null
}

function RequireAuth({ children }: { children: ReactNode }) {
  const isAuthenticated = useSession((state) => state.isAuthenticated)
  const authReady = useSession((state) => state.authReady)
  const role = useSession((state) => state.role)
  const user = useSession((state) => state.user)
  const location = useLocation()

  if (!authReady) {
    return <div className="flex min-h-screen items-center justify-center bg-bg text-sm text-muted">Verificando sesión...</div>
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (role === 'pilot') {
    const ownProfile = user.driverId ? `/pilotos/${user.driverId}` : '/pilotos'
    if (location.pathname !== '/pilotos' && location.pathname !== ownProfile) {
      return <Navigate to={ownProfile} replace />
    }
  }

  return <>{children}</>
}

function LoginRoute() {
  const isAuthenticated = useSession((state) => state.isAuthenticated)
  const authReady = useSession((state) => state.authReady)
  const role = useSession((state) => state.role)
  const user = useSession((state) => state.user)

  if (!authReady) {
    return <div className="flex min-h-screen items-center justify-center bg-bg text-sm text-muted">Verificando sesión...</div>
  }
  if (isAuthenticated) {
    return <Navigate to={role === 'pilot' ? (user.driverId ? `/pilotos/${user.driverId}` : '/pilotos') : '/'} replace />
  }

  return <LoginPage />
}

export function App() {
  useEffect(() => {
    const initialize = async () => {
      await useSession.getState().restoreSession()
      if (useSession.getState().isAuthenticated) {
        await useCompetition.getState().init()
      }
    }
    void initialize()
  }, [])

  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/login" element={<LoginRoute />} />
        <Route
          element={
            <RequireAuth>
              <AppShell />
            </RequireAuth>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="live" element={<LiveTimingPage />} />
          <Route path="pilotos" element={<DriversPage />} />
          <Route path="pilotos/:driverId" element={<DriverDetailPage />} />
          <Route path="garaje" element={<VehiclesPage />} />
          <Route path="garaje/:vehicleId" element={<VehicleDetailPage />} />
          <Route path="campeonatos" element={<ChampionshipsPage />} />
          <Route path="campeonatos/:championshipId" element={<ChampionshipDetailPage />} />
          <Route path="eventos/:eventId" element={<EventDetailPage />} />
          <Route path="clasificacion" element={<StandingsPage />} />
          <Route path="administracion" element={<AdminPage />} />
          <Route path="ajustes" element={<SettingsPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
