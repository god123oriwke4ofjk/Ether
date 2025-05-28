import { promises as fs } from "fs";
import { resolve, normalize } from "path";

export default function wallbashHmrPlugin() {
  let lastManualUpdateTime = 0;
  let lastImageUpdateTime = 0;
  const debounceDelay = 1500;
  const editDelay = 500;
  let isProcessingUpdate = false;
  let lastKnownContentHash = null;
  let hasReloadedOnConnection = false; 

  const file = normalize(resolve(process.cwd(), "src/wallbashTheme.ts"));

  async function getFileHash(file) {
    try {
      const content = await fs.readFile(file, "utf-8");
      const hash = content.length + ":" + Buffer.from(content).toString("base64").slice(0, 100);
      console.log(`[wallbashHmrPlugin] Computed hash for ${file}: ${hash.slice(0, 20)}...`);
      return hash;
    } catch (err) {
      console.error(`[wallbashHmrPlugin] Failed to compute hash for ${file}:`, err);
      return null;
    }
  }

  async function updateFileWithTimestamp(server, reason) {
    try {
      const content = await fs.readFile(file, "utf-8");
      const cleanedContent = content.replace(/\/\/ HMR timestamp: .*\n?/, "");
      const newContent = `${cleanedContent}\n// HMR timestamp: ${Date.now()}\n`;
      await fs.writeFile(file, newContent);

      const moduleId = normalize(file);
      const module = server.moduleGraph.getModuleById(moduleId) || server.moduleGraph.getModuleById(`/src/wallbashTheme.ts`);
      if (module) {
        server.moduleGraph.invalidateModule(module);
        console.log(`[wallbashHmrPlugin] Cleared module cache for ${file}`);
      } else {
        console.warn(`[wallbashHmrPlugin] Module not found for ${file}`);
      }

      server.ws.send({
        type: "full-reload",
        path: "/src/wallbashTheme.ts",
      });
      lastKnownContentHash = await getFileHash(file);
      console.log(`[wallbashHmrPlugin] Updated ${file} with timestamp (${reason})`);
    } catch (err) {
      console.error(`[wallbashHmrPlugin] Failed to update ${file}:`, err);
    }
  }

  return {
    name: "vite-plugin-wallbash-hmr",
    configureServer(server) {
      server.watcher.add(file);

      server.watcher.on("change", (path) => {
        if (path === resolve(process.env.HOME, ".cache/hyde/wall.set.png")) {
          lastImageUpdateTime = Date.now();
          console.log(`[wallbashHmrPlugin] Detected image change at ${path}`);
        }
      });

      server.ws.on("connection", async () => {
        if (isProcessingUpdate) {
          console.log(`[wallbashHmrPlugin] Skipped connection update (already processing)`);
          return;
        }
        if (hasReloadedOnConnection) {
          console.log(`[wallbashHmrPlugin] Skipped connection update (already reloaded)`);
          return;
        }

        isProcessingUpdate = true;
        hasReloadedOnConnection = true; 

        try {
          console.log(`[wallbashHmrPlugin] Forcing initial update for ${file} on connection`);
          await updateFileWithTimestamp(server, "initial connection");
        } catch (err) {
          console.error(`[wallbashHmrPlugin] Failed to process ${file} on connection:`, err);
        } finally {
          isProcessingUpdate = false;
        }

        setTimeout(() => {
          hasReloadedOnConnection = false;
          console.log(`[wallbashHmrPlugin] Reset reload flag for ${file}`);
        }, 5000); 
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
            await updateFileWithTimestamp(server, "HMR update");
            console.log(`[wallbashHmrPlugin] Processed HMR update for ${file}`);
          } catch (err) {
            console.error(`[wallbashHmrPlugin] Failed to update ${file} in HMR:`, err);
          } finally {
            isProcessingUpdate = false;
          }
        }, editDelay);
      }
    },
  };
}
