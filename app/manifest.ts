import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Tobi Voetbalmissie",
    short_name: "Voetbalmissie",
    description: "Scoor goede acties en verdien extra bedtijd!",
    start_url: "/",
    display: "standalone",
    background_color: "#0b5c2b",
    theme_color: "#16a34a",
    icons: [
      { src: "/apple-icon", sizes: "180x180", type: "image/png", purpose: "any" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png", purpose: "maskable" }
    ]
  };
}