import { defineConfig } from "vite";
import wallbashHmrPlugin from "./src/vite-plugin-wallbash-hmr";
import symlinkImagePlugin from "./src/vite-plugin-symlink-image";

export default defineConfig({
  plugins: [
    wallbashHmrPlugin(),
    symlinkImagePlugin(),
  ],
  server: {
    hmr: {
      overlay: true,
    },
  },
});
