import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Relative asset paths, so the site works under any GitHub Pages repo path
// (currently https://mmgupta713.github.io/ktheory-singular-planar-curves/).
export default defineConfig({
  base: "./",
  plugins: [react()],
  server: {
    // allow `import src from "../../../cusp_h.py?raw"` from outside web/
    fs: { allow: [".."] },
  },
  worker: { format: "es" },
});
