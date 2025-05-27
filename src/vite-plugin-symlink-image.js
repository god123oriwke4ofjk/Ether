import { promises as fs } from "fs";
import { resolve } from "path";

export default function symlinkImagePlugin() {
  const realImagePath = resolve(process.env.HOME, ".cache/hyde/wall.set.png");
  let lastImageUpdateTime = 0;
  let lastSuccessfulLoad = 0;
  let lastImageHash = null;
  const baseDebounceDelay = 1500;
  const smallImageDebounceDelay = 750;
  const maxRetries = 3;
  const baseRetryDelay = 500;
  const smallImageRetryDelay = 200;
  const smallImageThreshold = 1024 * 1024;

  async function getFileHash(path) {
    try {
      const content = await fs.readFile(path);
      return content.length + ":" + content.slice(0, 100).toString("base64");
    } catch {
      return null;
    }
  }

  async function isFileReady(path, retries = 0) {
    try {
      const stats = await fs.stat(path);
      const isSmallImage = stats.size < smallImageThreshold;
      const initialSize = stats.size;
      await new Promise((resolve) => setTimeout(resolve, 100));
      const newStats = await fs.stat(path);
      if (newStats.size === initialSize && initialSize > 0) {
        return { ready: true, isSmallImage };
      }
      throw new Error("File size unstable");
    } catch (err) {
      if (retries < maxRetries) {
        const isSmallImage = retries === 0 ? true : (await fs.stat(path).catch(() => ({ size: 0 }))).size < smallImageThreshold;
        const retryDelay = isSmallImage ? smallImageRetryDelay : baseRetryDelay;
        console.log(`[symlinkImagePlugin] Retrying access to ${path} (${retries + 1}/${maxRetries})`);
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
        return isFileReady(path, retries + 1);
      }
      throw err;
    }
  }

  return {
    name: "vite-plugin-symlink-image",
    configureServer(server) {
      server.middlewares.use(async (ctx, res, next) => {
        if (ctx.url === "/wall.set.png" || ctx.url.startsWith("/wall.set.png?")) {
          try {
            const { ready, isSmallImage } = await isFileReady(realImagePath);
            const content = await fs.readFile(realImagePath);
            res.setHeader("Content-Type", "image/png");
            res.setHeader("Cache-Control", "no-cache");
            res.end(content);
            lastSuccessfulLoad = Date.now();
            console.log(`[symlinkImagePlugin] Served ${realImagePath} (${isSmallImage ? "small" : "large"} image)`);
          } catch (err) {
            console.error(`[symlinkImagePlugin] Failed to serve ${realImagePath}:`, err);
            res.statusCode = 404;
            res.end("Image not found");
          }
        } else {
          next();
        }
      });

      server.watcher.add(realImagePath);
      server.watcher.on("change", async (path) => {
        if (path === realImagePath) {
          const now = Date.now();
          const currentHash = await getFileHash(path);
          if (currentHash === lastImageHash) {
            console.log(`[symlinkImagePlugin] Skipped change for ${path} (identical content)`);
            return;
          }
          if (now - lastSuccessfulLoad < 500) {
            console.log(`[symlinkImagePlugin] Skipped change for ${path} (recently loaded successfully)`);
            return;
          }
          const stats = await fs.stat(path).catch(() => ({ size: 0 }));
          const isSmallImage = stats.size < smallImageThreshold;
          const debounceDelay = isSmallImage ? smallImageDebounceDelay : baseDebounceDelay;

          if (now - lastImageUpdateTime < debounceDelay) {
            console.log(`[symlinkImagePlugin] Skipped change for ${path} (within ${debounceDelay}ms debounce)`);
            return;
          }
          lastImageUpdateTime = now;
          lastImageHash = currentHash;
          console.log(`[symlinkImagePlugin] Detected change in ${path} (${isSmallImage ? "small" : "large"} image)`);
          const hmrDelay = isSmallImage ? 500 : 1000;
          setTimeout(() => {
            server.ws.send({
              type: "full-reload",
              path: "/src/wallbashTheme.ts",
            });
            console.log(`[symlinkImagePlugin] Triggered HMR for /src/wallbashTheme.ts after ${hmrDelay}ms`);
          }, hmrDelay);
        }
      });
    },
    async transformIndexHtml() {
      try {
        await isFileReady(realImagePath);
        return [
          {
            tag: "link",
            attrs: {
              rel: "preload",
              href: "/wall.set.png",
              as: "image",
            },
            injectTo: "head",
          },
        ];
      } catch (err) {
        console.error(`[symlinkImagePlugin] Failed to access ${realImagePath}:`, err);
        return [];
      }
    },
  };
}
