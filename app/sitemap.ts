import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://www.whiterabbit.onl";
  return [
    { url: `${base}/`, lastModified: new Date() },
    // Add more pages as you add them
  ];
}

