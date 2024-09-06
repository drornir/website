import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import react from "@astrojs/react";
import tailwind from "@astrojs/tailwind";
import cloudflare from "@astrojs/cloudflare";

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
};

// https://astro.build/config
export default defineConfig(config);
