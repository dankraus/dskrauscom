import { defineConfig } from "astro/config";

// https://astro.build/config
import mdx from "@astrojs/mdx";

// https://astro.build/config
export default defineConfig({
  site: "https://www.dskraus.com",
  integrations: [mdx()],
  markdown: { mode: "mdx" },
});
