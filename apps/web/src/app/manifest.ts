import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Omniplex — Discord Bot List",
    short_name: "Omniplex",
    description:
      "Discover and add the best Discord bots and servers. Vote, review, and explore thousands of bots.",
    start_url: "/",
    display: "standalone",
    background_color: "#09090b",
    theme_color: "#09090b",
    icons: [
      {
        src: "/logo.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
    categories: ["utilities", "social"],
  };
}
