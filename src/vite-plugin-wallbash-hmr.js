import { promises as fs } from "fs";
import { resolve } from "path";

export default function wallbashHmrPlugin() {
  let lastManualUpdateTime = 0;
  let lastImageUpdateTime = 0;
  const debounceDelay = 1500;
  const editDelay = 500;
  let isProcessingUpdate = false;

  return {
    name: "vite-plugin-wallbash-hmr",
    configureServer(server) {
      server.watcher.on("change", (path) => {
        if (path === resolve(process.env.HOME, ".cache/hyde/wall.set.png")) {
          lastImageUpdateTime = Date.now();
        }
      });

      server.httpServer?.once("listening", () => {
        setTimeout(() => {
          if (isProcessingUpdate) {
            console.log(`[wallbashHmrPlugin] Skipped initial update (already processing)`);
            return;
          }
          isProcessingUpdate = true;

          const file = "src/wallbashTheme.ts";
          fs.readFile(file, "utf-8")
            .then((content) => {
              const cleanedContent = content.replace(/\/\/ HMR timestamp: .*\n?/, "");
              const newContent = `${cleanedContent}\n// HMR timestamp: ${Date.now()}\n`;

              return fs.writeFile(file, newContent).then(() => {
                console.log(`[wallbashHmrPlugin] Initial update to ${file} after ${editDelay}ms delay`);
                const module = server.moduleGraph.getModuleById(file);
                if (module) {
                  server.moduleGraph.invalidateModule(module);
                  server.ws.send({
                    type: "full-reload",
                    path: "/src/wallbashTheme.ts",
                  });
                } else {
                  console.warn(`[wallbashHmrPlugin] Module not found for ${file}`);
                }
                isProcessingUpdate = false;
              });
            })
            .catch((err) => {
              console.error(`[wallbashHmrPlugin] Failed to initial update ${file}:`, err);
              isProcessingUpdate = false;
            });
        }, editDelay);
      });
    },
    handleHotUpdate({ file, server, timestamp }) {
      if (file.endsWith("wallbashTheme.ts")) {
        if (isProcessingUpdate) {
          console.log(`[wallbashHmrPlugin] Skipped update for ${file} (already processing)`);
          return;
        }
        if (timestamp - lastManualUpdateTime < debounceDelay) {
          console.log(`[wallbashHmrPlugin] Skipped update for ${file} (within ${debounceDelay}ms debounce)`);
          return;
        }
        if (timestamp - lastImageUpdateTime < 1000) {
          console.log(`[wallbashHmrPlugin] Skipped update for ${file} (recent image update)`);
          return;
        }

        lastManualUpdateTime = timestamp;
        isProcessingUpdate = true;

        setTimeout(() => {
          fs.readFile(file, "utf-8")
            .then((content) => {
              const cleanedContent = content.replace(/\/\/ HMR timestamp: .*\n?/, "");
              const newContent = `${cleanedContent}\n// HMR timestamp: ${Date.now()}\n`;

              return fs.writeFile(file, newContent).then(() => {
                console.log(`[wallbashHmrPlugin] Updated ${file} with HMR timestamp after ${editDelay}ms delay`);
                const module = server.moduleGraph.getModuleById(file);
                if (module) {
                  server.moduleGraph.invalidateModule(module);
                  server.ws.send({
                    type: "full-reload",
                    path: "/src/wallbashTheme.ts",
                  });
                } else {
                  console.warn(`[wallbashHmrPlugin] Module not found for ${file}`);
                }
                isProcessingUpdate = false;
              });
            })
            .catch((err) => {
              console.error(`[wallbashHmrPlugin] Failed to update ${file}:`, err);
              isProcessingUpdate = false;
            });
        }, editDelay);
      }
    },
  };
}
