import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "¡Palabras! — Spanish for little kids",
    short_name: "Palabras",
    description:
      "Tap a sticker, hear the Spanish word. Flashcards for pre-readers.",
    start_url: "/",
    display: "standalone",
    background_color: "#fbf3e2",
    theme_color: "#a3e635",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
