import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
// Fuentes alojadas en la propia app: no se envía la IP de nadie a Google y funcionan sin conexión
import "@fontsource-variable/fraunces/opsz.css"
import "@fontsource-variable/fraunces/opsz-italic.css"
import "@fontsource/dm-sans/latin-400.css"
import "@fontsource/dm-sans/latin-500.css"
import "@fontsource/dm-sans/latin-700.css"
import "./styles/index.css"
import App from "./App"
import { watchSystemTheme } from "./lib/theme"

watchSystemTheme()

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
