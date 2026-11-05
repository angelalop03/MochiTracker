import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"
import RequireReady from "./components/RequireReady"
import { CycleDataProvider } from "./hooks/useCycleData"
import { SessionProvider } from "./hooks/useSession"
import Auth from "./pages/Auth"
import Guide from "./pages/Guide"
import ImportClue from "./pages/ImportClue"
import Install from "./pages/Install"
import Landing from "./pages/Landing"
import MyCycle from "./pages/MyCycle"
import Onboarding from "./pages/Onboarding"
import Privacy from "./pages/Privacy"
import Settings from "./pages/Settings"
import Today from "./pages/Today"

export default function App() {
  return (
    <SessionProvider>
      <CycleDataProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/entrar" element={<Auth mode="signin" />} />
            <Route path="/registro" element={<Auth mode="signup" />} />
            <Route path="/privacidad" element={<Privacy />} />
            <Route path="/bienvenida" element={<Onboarding />} />
            <Route path="/importar" element={<ImportClue />} />
            <Route path="/instalar" element={<Install />} />
            <Route element={<RequireReady />}>
              <Route path="/hoy" element={<Today />} />
              <Route path="/guia" element={<Guide />} />
              <Route path="/mis-fechas" element={<MyCycle />} />
              <Route path="/ajustes" element={<Settings />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </CycleDataProvider>
    </SessionProvider>
  )
}
