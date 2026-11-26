import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Urban Air Quality Assistant",
    short_name: "Urban Air",
    description: "Science-Backed Environmental Health & AQI Defense Assistant",
    start_url: "/",
    display: "standalone",
    background_color: "#0b1120",
    theme_color: "#026aa2",
    icons: [
      {
        src: "/icon.png",
        sizes: "192x192",
        type: "image/png",
      },
    ],
  };
}
