import { defineConfig } from "vitest/config"
import react from "@vitejs/plugin-react"

export default defineConfig({
  plugins: [react()],
  build: {
    // La escena 3D va en su propio archivo con lazy(): no bloquea la carga inicial
    chunkSizeWarningLimit: 1200,
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts", "src/**/*.test.ts"],
  },
})
