import { defineConfig } from "vite";
import wallbashHmrPlugin from "./src/vite-plugin-wallbash-hmr"; 

export default defineConfig({
  plugins: [wallbashHmrPlugin()],
  server: {
    hmr: {
      overlay: true, 
    },
  },
});
