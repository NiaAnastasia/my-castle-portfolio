import { defineConfig } from "vite";

export default defineConfig({
  base: "/my-castle-portfolio/",
  build: {
    minify: "terser",
  },
});
