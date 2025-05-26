import { promises as fs } from "fs";

export default function wallbashHmrPlugin() {
  let lastUpdateTime = 0;
  const debounceDelay = 500;

  return {
    name: "vite-plugin-wallbash-hmr",
    handleHotUpdate({ file, server, timestamp }) {
      if (file.endsWith("wallbashTheme.ts")) {
        if (timestamp - lastUpdateTime < debounceDelay) {
          return;
        }
        lastUpdateTime = timestamp;

        fs.readFile(file, "utf-8")
          .then((content) => {
            const cleanedContent = content.replace(/\/\/ HMR timestamp: .*\n?/, "");
            const newContent = `${cleanedContent}\n// HMR timestamp: ${Date.now()}\n`;

            return fs.writeFile(file, newContent).then(() => {
              console.log(`[wallbashHmrPlugin] Updated ${file} with HMR timestamp`);
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
            });
          })
          .catch((err) => {
            console.error(`[wallbashHmrPlugin] Failed to update ${file}:`, err);
          });
      }
    },
  };
}
