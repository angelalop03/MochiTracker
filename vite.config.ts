import { defineConfig } from "vitest/config"
import react from "@vitejs/plugin-react"

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        // Three.js va en su propio archivo: quien no ve la escena no lo descarga
        manualChunks(id) {
          if (/node_modules[\/](three|@react-three)/.test(id)) return "three"
        },
      },
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts", "src/**/*.test.ts"],
  },
})
