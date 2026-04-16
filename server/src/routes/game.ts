import type { FastifyInstance } from "fastify";
import * as gameService from "../services/game.js";

export async function gameRoutes(app: FastifyInstance) {
  // Create a new game
  app.post("/", async (req, reply) => {
    const { mode, hostId, hostName, spyCount, timerSeconds } = req.body as {
      mode: "online" | "local";
      hostId: string;
      hostName: string;
      spyCount?: number;
      timerSeconds?: number | null;
    };

    try {
      const game = await gameService.createGame({
        mode,
        hostId,
        hostName,
        spyCount,
        timerSeconds,
      });
      return game;
    } catch (e: any) {
      reply.status(400).send({ error: e.message });
    }
  });

  // Get game state
  app.get("/:code", async (req, reply) => {
    const { code } = req.params as { code: string };
    const game = await gameService.getGame(code.toUpperCase());
    if (!game) return reply.status(404).send({ error: "Game not found" });
    return game;
  });

  // Join a game
  app.post("/:code/join", async (req, reply) => {
    const { code } = req.params as { code: string };
    const { userId, name } = req.body as { userId: string; name: string };

    try {
      const player = await gameService.joinGame(code.toUpperCase(), userId, name);
      return player;
    } catch (e: any) {
      reply.status(400).send({ error: e.message });
    }
  });

  // Start the game
  app.post("/:code/start", async (req, reply) => {
    const { code } = req.params as { code: string };
    const { hostId } = req.body as { hostId: string };

    try {
      const game = await gameService.startGame(code.toUpperCase(), hostId);
      return game;
    } catch (e: any) {
      reply.status(400).send({ error: e.message });
    }
  });

  // Vote
  app.post("/:code/vote", async (req, reply) => {
    const { code } = req.params as { code: string };
    const { odId, targetPlayerId } = req.body as {
      odId: string;
      targetPlayerId: string;
    };

    try {
      const result = await gameService.vote(
        code.toUpperCase(),
        odId,
        targetPlayerId
      );
      return result;
    } catch (e: any) {
      reply.status(400).send({ error: e.message });
    }
  });

  // Get results
  app.get("/:code/results", async (req, reply) => {
    const { code } = req.params as { code: string };

    try {
      const results = await gameService.getResults(code.toUpperCase());
      return results;
    } catch (e: any) {
      reply.status(400).send({ error: e.message });
    }
  });
}
