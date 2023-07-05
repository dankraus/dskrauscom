import rss from "@astrojs/rss";

export const get = () =>
  rss({
    title: "Dan Kraus | Blog",
    description: "My journey learning Astro",
    site: "https://dskraus.com",
    items: import.meta.glob("./**/*.md|*.mdx"),
    customData: `<language>en-us</language>`,
  });
