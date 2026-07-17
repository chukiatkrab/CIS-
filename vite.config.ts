import { defineConfig } from "vite";

export default defineConfig({
  // Base public path when serving in development
  base: "./",

  server: {
    port: 3000,
    open: true, // automatically open browser
  },

  build: {
    outDir: "dist",
  },

  // Vite only serves files inside "public/" as static assets by default.
  // By setting publicDir to "assets", every file under /assets is
  // accessible at the URL /assets/... with no import required.
  // Example: this.load.image("tileset", "assets/tiles/tilemap.png")
  publicDir: "assets",
});
