import { promises as fs } from "fs";
import { resolve } from "path";

export default function symlinkImagePlugin() {
  const realImagePath = resolve(process.env.HOME, ".cache/hyde/wall.set.png");

  return {
    name: "vite-plugin-symlink-image",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url === "/wall.set.png" || req.url.startsWith("/wall.set.png?")) {
          try {
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
          console.log(`[symlinkImagePlugin] Detected change in ${realImagePath}`);
          server.ws.send({
            type: "full-reload",
            path: "/src/wallbashTheme.ts",
          });
        }
      });
    },
    async transformIndexHtml() {
      try {
        await fs.access(realImagePath);
        return [
          {
            tag: "link",
            attrs: {
              rel: "prefetch",
              href: "/wall.set.png",
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
