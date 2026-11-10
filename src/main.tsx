import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "@fontsource-variable/outfit"
import "@fontsource-variable/fraunces"
import "@fontsource-variable/literata"
import "@fontsource/noto-serif-hebrew/500.css"
import "@fontsource/noto-serif-hebrew/600.css"
import "@fontsource/noto-serif/500.css"
import "@fontsource/noto-serif/600.css"
import { App } from "./App"
import "./styles.css"

;(window as Window & { EXCALIDRAW_ASSET_PATH?: string }).EXCALIDRAW_ASSET_PATH = "/excalidraw/"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
