import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Served from https://<user>.github.io/PhD/
export default defineConfig({
  base: "/PhD/",
  plugins: [react()],
  server: {
    // allow `import src from "../../../cusp_h.py?raw"` from outside web/
    fs: { allow: [".."] },
  },
  worker: { format: "es" },
});
