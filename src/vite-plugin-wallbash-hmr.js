import { promises as fs } from "fs";

export default function wallbashHmrPlugin() {
  let lastManualUpdateTime = 0;
  const debounceDelay = 1000; 
  const editDelay = 500; 
  let isProcessingUpdate = false;

  return {
    name: "vite-plugin-wallbash-hmr",
    handleHotUpdate({ file, server, timestamp }) {
      if (file.endsWith("wallbashTheme.ts")) {
        if (isProcessingUpdate) {
          console.log(`[wallbashHmrPlugin] Skipped update for ${file} (already processing)`);
          return;
        }

        if (timestamp - lastManualUpdateTime < debounceDelay) {
          console.log(`[wallbashHmrPlugin] Skipped update for ${file} (within debounce period)`);
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
