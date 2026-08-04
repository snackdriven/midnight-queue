import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Static build for GitHub Pages. Reuses the app's React UI (app/page.tsx) but reads a
// pre-baked releases.json instead of the live API routes, so there is no server and no
// secret keys in the browser. Served from a custom domain at the root, so base is "/".
//
// globals.css only pulls Tailwind's base layer via `@import "tailwindcss"`. Resolve it with
// the repo's existing @tailwindcss/postcss config (css.postcss points at the repo root so
// Vite finds postcss.config.mjs even though the build root is site/). No @tailwindcss/vite,
// which peers on vite <=7 and can't install against this repo's vite 8.
//
// The static-build sources live in site/ (not pages/), which is Next/Vinext's reserved
// Pages-Router directory name and would otherwise be scanned as routes by the live build.
export default defineConfig({
  root: "site",
  base: "/",
  plugins: [react()],
  css: { postcss: import.meta.dirname },
  build: {
    outDir: "../dist-pages",
    emptyOutDir: true,
  },
});
