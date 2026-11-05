import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
// Fuentes alojadas en la propia app: no se envía la IP de nadie a Google y funcionan sin conexión
import "@fontsource/baloo-2/latin-500.css"
import "@fontsource/baloo-2/latin-600.css"
import "@fontsource/baloo-2/latin-700.css"
import "@fontsource/m-plus-rounded-1c/latin-400.css"
import "@fontsource/m-plus-rounded-1c/latin-700.css"
import "./styles/index.css"
import App from "./App"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
