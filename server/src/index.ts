import Fastify from "fastify";
import cors from "@fastify/cors";
import fastifyStatic from "@fastify/static";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { existsSync } from "fs";
import { gameRoutes } from "./routes/game.js";
import { locationRoutes } from "./routes/locations.js";
import { setupBot } from "./bot.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

const server = Fastify({ logger: true });

await server.register(cors, { origin: true });

// API routes
server.register(gameRoutes, { prefix: "/api/game" });
server.register(locationRoutes, { prefix: "/api/locations" });
server.get("/api/health", async () => ({ status: "ok" }));

// Serve static frontend in production
const distPath = resolve(__dirname, "../../web/dist");
if (existsSync(distPath)) {
  await server.register(fastifyStatic, {
    root: distPath,
    prefix: "/",
  });

  // SPA fallback — serve index.html for non-API routes
  server.setNotFoundHandler(async (req, reply) => {
    if (req.url.startsWith("/api/")) {
      reply.status(404).send({ error: "Not found" });
    } else {
      return reply.sendFile("index.html");
    }
  });
}

// Setup bot webhook
const botToken = process.env.BOT_TOKEN;
const appUrl = process.env.RENDER_EXTERNAL_URL || process.env.APP_URL;

if (botToken) {
  await setupBot(server, botToken, appUrl || "");
}

const port = Number(process.env.PORT) || 3001;

try {
  await server.listen({ port, host: "0.0.0.0" });
  console.log(`Server running on port ${port}`);
} catch (err) {
  server.log.error(err);
  process.exit(1);
}
