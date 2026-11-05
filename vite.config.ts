import { defineConfig } from "vitest/config"
import react from "@vitejs/plugin-react"
import { VitePWA } from "vite-plugin-pwa"

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      strategies: "injectManifest",
      srcDir: "src",
      filename: "sw.ts",
      registerType: "autoUpdate",
      injectManifest: {
        globPatterns: ["**/*.{js,css,html,svg,png,woff2}"],
      },
      manifest: {
        name: "Isla Mochi",
        short_name: "Isla Mochi",
        description: "Cómo te puedes sentir en cada momento del ciclo, y qué te puede sentar bien.",
        lang: "es",
        start_url: "/hoy",
        display: "standalone",
        background_color: "#FFF7F3",
        theme_color: "#FFF7F3",
        icons: [
          { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
    }),
  ],
  build: {
    // La escena 3D va en su propio archivo con lazy(): no bloquea la carga inicial
    chunkSizeWarningLimit: 1200,
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts", "src/**/*.test.ts"],
  },
})
