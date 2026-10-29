import { useEffect, type ReactNode } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
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
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return <>{children}</>
}

function LoginRoute() {
  const isAuthenticated = useSession((state) => state.isAuthenticated)

  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  return <LoginPage />
}

export function App() {
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
