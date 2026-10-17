import cloudflare from "@astrojs/cloudflare"
import { rehypeHeadingIds } from "@astrojs/markdown-remark"
import mdx from "@astrojs/mdx"
import react from "@astrojs/react"
import sitemap from "@astrojs/sitemap"
import tailwind from "@astrojs/tailwind"
import { defineConfig, passthroughImageService } from "astro/config"

function rehypeHeadingLinks() {
  return (tree) => {
    const visit = (node) => {
      if (node.type === "element" && /^h[1-4]$/.test(node.tagName) && typeof node.properties?.id === "string") {
        const hasLink = (child) =>
          (child.type === "element" && child.tagName === "a") || child.children?.some(hasLink)

        if (!node.children.some(hasLink)) {
          node.children = [{
            type: "element",
            tagName: "a",
            properties: { href: `#${node.properties.id}`, className: ["heading-link"] },
            children: node.children,
          }]
        }
      }
      node.children?.forEach(visit)
    }
    visit(tree)
  }
}

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
    sitemap({
      lastmod: new Date(),
      xslURL: "/sitemap.xsl",
    }),
    react(),
    tailwind({
      applyBaseStyles: false,
    }),
  ],
  markdown: {
    syntaxHighlight: "shiki",
    rehypePlugins: [rehypeHeadingIds, rehypeHeadingLinks],
    shikiConfig: {
      theme: "catppuccin-mocha",
    },
  },

  output: "server",
  image: {
    service: passthroughImageService(),
  },
  adapter: cloudflare({
    imageService: "passthrough",
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
