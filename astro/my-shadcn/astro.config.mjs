import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import react from "@astrojs/react";
import tailwind from "@astrojs/tailwind";
import cloudflare from "@astrojs/cloudflare";

const config ={
    site: "https://drornir.dev",

    redirects: {
      "/posts/[...slug]": "/blog/[...slug]",
    },

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
        platformProxy: {
            enabled: false,
        }
    }),
  }



// https://astro.build/config
export default defineConfig(config);
