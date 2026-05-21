import { defineConfig } from "vite";

export default defineConfig({
  base: "/my-castle/",
  build: {
    minify: "terser",
  },
});
