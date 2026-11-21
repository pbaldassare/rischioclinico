import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
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
  plugins: [react(), assistenteLocale()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
