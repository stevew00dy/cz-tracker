import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  base: "/exec-hangar-tracker/",
  plugins: [react(), tailwindcss()],
});
