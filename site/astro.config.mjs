import { defineConfig } from "astro/config"
import sitemap from "@astrojs/sitemap"
import react from "@astrojs/react"
import tailwindcss from "@tailwindcss/vite"

export default defineConfig({
  site: "https://www.anointedstaff.com",
  trailingSlash: "never",
  integrations: [sitemap(), react()],
  vite: {
    plugins: [tailwindcss()],
  },
  build: {
    format: "directory",
  },
})
