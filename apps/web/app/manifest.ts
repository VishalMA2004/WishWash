import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "WishWash", short_name: "WishWash", description: "Wash when the weather works for you.",
    start_url: "/", display: "standalone", background_color: "#f6f8f5", theme_color: "#f6f8f5",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
  };
}
