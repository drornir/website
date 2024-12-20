import { defineConfig } from "astro/config"
import mdx from "@astrojs/mdx"
import sitemap from "@astrojs/sitemap"
import react from "@astrojs/react"
import tailwind from "@astrojs/tailwind"
import cloudflare from "@astrojs/cloudflare"

/***
 * @typedef {import("astro/config").AstroUserConfig} AstroUserConfig
 */

// https://astro.build/config
/**
 *  @type {AstroUserConfig}
 */
const config = {
  site: "https://drornir.dev",

  integrations: [
    mdx(),
    sitemap(),
    react(),
    tailwind({
      applyBaseStyles: false,
    }),
  ],
  markdown: {
    syntaxHighlight: "shiki",
    shikiConfig: {
      theme: "catppuccin-mocha",
    },
  },

  output: "server",
  adapter: cloudflare({
    imageService: "cloudflare",
    platformProxy: {
      enabled: false,
    },
  }),

  redirects: {
    "/posts": {
      status: 301,
      destination: "/blog",
    },
    "/posts/*": {
      status: 301,
      destination: "/blog/:splat",
    },
  },
}

export default defineConfig(config)
