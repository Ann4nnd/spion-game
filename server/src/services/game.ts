import { PrismaClient } from "@prisma/client";
import type { GameMode } from "@spion/shared";

const prisma = new PrismaClient();

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export async function createGame(opts: {
  mode: GameMode;
  hostId: string;
  hostName: string;
  spyCount?: number;
  timerSeconds?: number | null;
}) {
  let code = generateCode();
  // Ensure unique code
  while (await prisma.game.findUnique({ where: { code } })) {
    code = generateCode();
  }

  const game = await prisma.game.create({
    data: {
      code,
      mode: opts.mode,
      hostId: opts.hostId,
      spyCount: opts.spyCount ?? 1,
      timerSeconds: opts.timerSeconds ?? null,
      players: {
        create: {
          userId: opts.hostId,
          name: opts.hostName,
        },
      },
    },
    include: { players: true },
  });

  return game;
}

export async function getGame(code: string) {
  return prisma.game.findUnique({
    where: { code },
    include: { players: true },
  });
}

export async function joinGame(code: string, userId: string, name: string) {
  const game = await prisma.game.findUnique({ where: { code } });
  if (!game) throw new Error("Game not found");
  if (game.status !== "lobby") throw new Error("Game already started");

  return prisma.player.upsert({
    where: { gameId_userId: { gameId: game.id, odId: userId } },
    update: { name },
    create: { gameId: game.id, userId, name },
  });
}

export async function startGame(code: string, hostId: string) {
  const game = await prisma.game.findUnique({
    where: { code },
    include: { players: true },
  });

  if (!game) throw new Error("Game not found");
  if (game.hostId !== hostId) throw new Error("Only host can start");
  if (game.status !== "lobby") throw new Error("Game already started");
  if (game.players.length < 3) throw new Error("Need at least 3 players");

  // Pick a random location from default packs
  const locations = await prisma.location.findMany({
    where: { pack: { isDefault: true } },
  });
  if (locations.length === 0) throw new Error("No locations available");

  const location = locations[Math.floor(Math.random() * locations.length)];

  // Assign roles
  const playerIds = game.players.map((p) => p.id);
  const shuffled = [...playerIds].sort(() => Math.random() - 0.5);
  const spyIds = new Set(shuffled.slice(0, game.spyCount));

  // Update all players' roles
  await Promise.all(
    game.players.map((p) =>
      prisma.player.update({
        where: { id: p.id },
        data: { role: spyIds.has(p.id) ? "spy" : "citizen" },
      })
    )
  );

  // Update game state
  return prisma.game.update({
    where: { code },
    data: { status: "playing", location: location.name },
    include: { players: true },
  });
}

export async function vote(code: string, odId: string, targetPlayerId: string) {
  const game = await prisma.game.findUnique({
    where: { code },
    include: { players: true },
  });

  if (!game) throw new Error("Game not found");
  if (game.status !== "playing" && game.status !== "voting")
    throw new Error("Not in voting phase");

  // Mark vote
  const voter = game.players.find((p) => p.userId === odId);
  if (!voter) throw new Error("Player not in game");

  await prisma.player.update({
    where: { id: voter.id },
    data: { vote: targetPlayerId },
  });

  // Update status to voting if not already
  if (game.status === "playing") {
    await prisma.game.update({
      where: { code },
      data: { status: "voting" },
    });
  }

  // Check if all voted
  const updatedGame = await prisma.game.findUnique({
    where: { code },
    include: { players: true },
  });

  const allVoted = updatedGame!.players.every((p) => p.vote !== null);

  if (allVoted) {
    await prisma.game.update({
      where: { code },
      data: { status: "finished" },
    });

    return { allVoted: true, game: await getGame(code) };
  }

  return { allVoted: false, game: await getGame(code) };
}

export async function getResults(code: string) {
  const game = await prisma.game.findUnique({
    where: { code },
    include: { players: true },
  });

  if (!game || game.status !== "finished") throw new Error("Game not finished");

  // Count votes
  const voteCounts: Record<string, number> = {};
  for (const p of game.players) {
    if (p.vote) {
      voteCounts[p.vote] = (voteCounts[p.vote] || 0) + 1;
    }
  }

  // Find most voted
  let maxVotes = 0;
  let votedOutId: string | null = null;
  for (const [playerId, count] of Object.entries(voteCounts)) {
    if (count > maxVotes) {
      maxVotes = count;
      votedOutId = playerId;
    }
  }

  const spies = game.players.filter((p) => p.role === "spy");
  const votedOut = game.players.find((p) => p.id === votedOutId) ?? null;
  const spyWins = !votedOut || votedOut.role !== "spy";

  return {
    spies: spies.map((s) => ({ id: s.id, name: s.name })),
    location: game.location!,
    votedOut: votedOut ? { id: votedOut.id, name: votedOut.name } : null,
    spyWins,
  };
}
