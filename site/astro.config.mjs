import { defineConfig } from "astro/config"
import sitemap from "@astrojs/sitemap"

export default defineConfig({
  site: "https://www.anointedstaff.com",
  trailingSlash: "never",
  integrations: [sitemap()],
  build: {
    format: "directory",
  },
})
