import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";
import type { IncomingMessage, ServerResponse } from "node:http";
import { handleAssistente, type AssistenteRichiesta } from "./api/assistente";

function assistenteLocale(): Plugin {
  const handler = async (req: IncomingMessage, res: ServerResponse) => {
    if (req.method === "OPTIONS") {
      res.statusCode = 204;
      res.end();
      return;
    }
    if (req.method !== "POST") {
      res.statusCode = 405;
      res.end();
      return;
    }
    const pezzi: Buffer[] = [];
    for await (const pezzo of req) pezzi.push(pezzo as Buffer);
    try {
      const body = JSON.parse(Buffer.concat(pezzi).toString("utf8") || "{}") as AssistenteRichiesta;
      const out = await handleAssistente(body);
      res.setHeader("content-type", "application/json");
      res.end(JSON.stringify(out));
    } catch (e) {
      res.statusCode = 500;
      res.setHeader("content-type", "application/json");
      res.end(JSON.stringify({ error: e instanceof Error ? e.message : "assistente" }));
    }
  };
  return {
    name: "assistente-api",
    configureServer(server) {
      server.middlewares.use("/api/assistente", (req, res) => {
        void handler(req, res);
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use("/api/assistente", (req, res) => {
        void handler(req, res);
      });
    },
  };
}

export default defineConfig({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    assistenteLocale(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "auto",
      filename: "sw.js",
      includeAssets: [
        "favicon.png",
        "icons/apple-touch-icon.png",
        "icons/icon-96.png",
        "icons/icon-192.png",
        "icons/icon-512.png",
        "icons/icon-maskable-512.png",
      ],
      manifest: false,
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2,webmanifest}"],
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [/^\/api\//],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
