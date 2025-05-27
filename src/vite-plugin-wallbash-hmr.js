import { promises as fs } from "fs";
import { resolve, normalize } from "path";

export default function wallbashHmrPlugin() {
  let lastManualUpdateTime = 0;
  let lastImageUpdateTime = 0;
  const debounceDelay = 2000;
  const editDelay = 500;
  let isProcessingUpdate = false;
  let lastKnownContentHash = null;

  const file = normalize(resolve(process.cwd(), "src/wallbashTheme.ts"));

  async function getFileHash(file) {
    try {
      const content = await fs.readFile(file, "utf-8");
      const cleanedContent = content.replace(/\/\/ HMR timestamp: .*\n?/, "");
      return Buffer.from(cleanedContent).toString("base64").slice(0, 100);
    } catch {
      return null;
    }
  }

  return {
    name: "vite-plugin-wallbash-hmr",
    async configureServer(server) {
      server.watcher.add(file);

      lastKnownContentHash = await getFileHash(file);
      console.log(`[wallbashHmrPlugin] Initialized hash for ${file}`);

      server.watcher.on("change", (path) => {
        if (path === resolve(process.env.HOME, ".cache/hyde/wall.set.png")) {
          lastImageUpdateTime = Date.now();
        }
      });

      server.ws.on("connection", async () => {
        if (isProcessingUpdate) {
          console.log(`[wallbashHmrPlugin] Skipped initial update (already processing)`);
          return;
        }
        isProcessingUpdate = true;

        try {
          const currentHash = await getFileHash(file);
          if (lastKnownContentHash && currentHash !== lastKnownContentHash) {
            console.log(`[wallbashHmrPlugin] Detected external changes to ${file}`);
            const moduleId = normalize(file);
            const module = server.moduleGraph.getModuleById(moduleId) || server.moduleGraph.getModuleById(`/src/wallbashTheme.ts`);
            if (module) {
              server.moduleGraph.invalidateModule(module);
              console.log(`[wallbashHmrPlugin] Cleared module cache for ${file}`);
            } else {
              console.warn(`[wallbashHmrPlugin] Module not found, forcing reload for ${file}`);
            }
            const content = await fs.readFile(file, "utf-8");
            const cleanedContent = content.replace(/\/\/ HMR timestamp: .*\n?/, "");
            const newContent = `${cleanedContent}\n// HMR timestamp: ${Date.now()}\n`;
            await fs.writeFile(file, newContent);
            server.ws.send({
              type: "full-reload",
              path: "/src/wallbashTheme.ts",
            });
            lastKnownContentHash = await getFileHash(file);
          } else {
            console.log(`[wallbashHmrPlugin] No external changes detected for ${file}`);
          }
        } catch (err) {
          console.error(`[wallbashHmrPlugin] Failed to process ${file}:`, err);
        } finally {
          isProcessingUpdate = false;
        }
      });
    },
    handleHotUpdate({ file: updatedFile, server, timestamp }) {
      if (normalize(updatedFile) === file) {
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

        setTimeout(async () => {
          try {
            const currentHash = await getFileHash(file);
            if (currentHash === lastKnownContentHash) {
              console.log(`[wallbashHmrPlugin] Skipped update for ${file} (no content change)`);
              isProcessingUpdate = false;
              return;
            }

            console.log(`[wallbashHmrPlugin] Updating ${file} to fix HMR lag`);
            const content = await fs.readFile(file, "utf-8");
            const cleanedContent = content.replace(/\/\/ HMR timestamp: .*\n?/, "");
            const newContent = `${cleanedContent}\n// HMR timestamp: ${Date.now()}\n`;
            await fs.writeFile(file, newContent);

            const moduleId = normalize(file);
            const module = server.moduleGraph.getModuleById(moduleId) || server.moduleGraph.getModuleById(`/src/wallbashTheme.ts`);
            if (module) {
              server.moduleGraph.invalidateModule(module);
            }
            server.ws.send({
              type: "full-reload",
              path: "/src/wallbashTheme.ts",
            });
            lastKnownContentHash = await getFileHash(file);
          } catch (err) {
            console.error(`[wallbashHmrPlugin] Failed to update ${file}:`, err);
          } finally {
            isProcessingUpdate = false;
          }
        }, editDelay);
      }
    },
  };
}
