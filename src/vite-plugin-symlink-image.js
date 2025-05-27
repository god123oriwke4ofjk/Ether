import { promises as fs } from "fs";
import { resolve } from "path";

export default function symlinkImagePlugin() {
  const realImagePath = resolve(process.env.HOME, ".cache/hyde/wall.set.png");
  let lastImageUpdateTime = 0;
  const debounceDelay = 1500;
  const maxRetries = 3;
  const retryDelay = 500; 

  async function isFileReady(path, retries = 0) {
    try {
      const stats = await fs.stat(path);
      const initialSize = stats.size;
      await new Promise((resolve) => setTimeout(resolve, 100));
      const newStats = await fs.stat(path);
      if (newStats.size === initialSize && initialSize > 0) {
        return true;
      }
      throw new Error("File size unstable");
    } catch (err) {
      if (retries < maxRetries) {
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
      server.middlewares.use(async (req, res, next) => {
        if (req.url === "/wall.set.png" || req.url.startsWith("/wall.set.png?")) {
          try {
            await isFileReady(realImagePath);
            const content = await fs.readFile(realImagePath);
            res.setHeader("Content-Type", "image/png");
            res.setHeader("Cache-Control", "no-cache");
            res.end(content);
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
      server.watcher.on("change", (path) => {
        if (path === realImagePath) {
          const now = Date.now();
          if (now - lastImageUpdateTime < debounceDelay) {
            console.log(`[symlinkImagePlugin] Skipped change for ${realImagePath} (within debounce period)`);
            return;
          }
          lastImageUpdateTime = now;
          console.log(`[symlinkImagePlugin] Detected change in ${realImagePath}`);
          setTimeout(() => {
            server.ws.send({
              type: "full-reload",
              path: "/src/wallbashTheme.ts",
            });
          }, 1000); 
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
        console.error(`[symlinkImagePlugin] Failed to access ${realImagePath} during build:`, err);
        return [];
      }
    },
  };
}
