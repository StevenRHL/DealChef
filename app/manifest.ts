import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "DealChef",
    short_name: "DealChef",
    description: "Personalized half-price grocery deals and recipe ideas.",
    start_url: "/",
    display: "standalone",
    background_color: "#f7faf5",
    theme_color: "#174e3a",
    icons: [{ src: "/favicon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
