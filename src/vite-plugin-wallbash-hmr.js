import { promises as fs } from "fs";
import { resolve, normalize } from "path";

export default function wallbashHmrPlugin() {
  let lastManualUpdateTime = 0;
  let lastImageUpdateTime = 0;
  let lastConnectionTime = 0;
  const debounceDelay = 1500;
  const editDelay = 500;
  const connectionDebounce = 1000;
  const imageDebounce = 1000;
  let isProcessingUpdate = false;
  let isProcessingImageUpdate = false;
  let lastKnownContentHash = null;
  let hasReloadedOnConnection = false;
  const imagePath = resolve(process.env.HOME, ".cache/hyde/wall.set.png");

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

  async function invalidateImage(server) {
    try {
      const publicImagePath = normalize(resolve(process.cwd(), "public/wall.set.png"));
      const moduleId = publicImagePath;
      const module = server.moduleGraph.getModuleById(moduleId) || server.moduleGraph.getModuleById("/wall.set.png");
      if (module) {
        server.moduleGraph.invalidateModule(module);
        console.log(`[wallbashHmrPlugin] Invalidated module cache for ${publicImagePath}`);
      }
      const cacheBustUrl = `/wall.set.png?t=${Date.now()}`;
      server.ws.send({
        type: "update",
        updates: [
          {
            type: "js-update",
            path: cacheBustUrl,
            acceptedPath: "/wall.set.png",
            timestamp: Date.now(),
          },
        ],
      });
      console.log(`[wallbashHmrPlugin] Sent cache-busting update for ${cacheBustUrl}`);
    } catch (err) {
      console.error(`[wallbashHmrPlugin] Failed to invalidate image:`, err);
    }
  }

  async function triggerImageUpdate(server) {
    if (isProcessingImageUpdate) {
      console.log(`[wallbashHmrPlugin] Skipped image update for ${imagePath} (already processing)`);
      return;
    }
    isProcessingImageUpdate = true;

    try {
      await invalidateImage(server);
      console.log(`[wallbashHmrPlugin] Triggered image update for ${imagePath}`);
    } catch (err) {
      console.error(`[wallbashHmrPlugin] Failed to trigger image update:`, err);
    } finally {
      setTimeout(() => {
        isProcessingImageUpdate = false;
      }, imageDebounce);
    }
  }

  return {
    name: "vite-plugin-wallbash-hmr",
    configureServer(server) {
      server.watcher.add(file);
      server.watcher.add(imagePath);

      server.middlewares.use((req, res, next) => {
        if (req.url?.startsWith("/wall.set.png")) {
          res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
          res.setHeader("Pragma", "no-cache");
          res.setHeader("Expires", "0");
          console.log(`[wallbashHmrPlugin] Set no-cache headers for ${req.url}`);
        }
        next();
      });

      server.watcher.on("change", async (path) => {
        if (path === imagePath && !isProcessingImageUpdate) {
          lastImageUpdateTime = Date.now();
          console.log(`[wallbashHmrPlugin] Detected image change at ${path}`);
          await triggerImageUpdate(server);
        }
      });

      server.ws.on("connection", async () => {
        const now = Date.now();
        if (now - lastConnectionTime < connectionDebounce) {
          console.log(`[wallbashHmrPlugin] Skipped connection update (within ${connectionDebounce}ms debounce)`);
          return;
        }
        lastConnectionTime = now;

        if (isProcessingUpdate || hasReloadedOnConnection) {
          console.log(`[wallbashHmrPlugin] Skipped connection update (already processing or reloaded)`);
          return;
        }

        isProcessingUpdate = true;
        hasReloadedOnConnection = true;

        try {
          console.log(`[wallbashHmrPlugin] Forcing initial update for ${file} on connection`);
          await updateFileWithTimestamp(server, "initial connection");
          await invalidateImage(server); 
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
