export type MafiaRole = "mafia" | "villager" | "doctor" | "cop";

export interface MafiaPlayer {
  name: string;
  role: MafiaRole;
  alive: boolean;
}

export interface MafiaSettings {
  mafiaCount: number;
  hasDoctor: boolean;
  hasCop: boolean;
  timerSeconds: number | null;
}

export interface MafiaGameState {
  players: MafiaPlayer[];
  settings: MafiaSettings;
  round: number;
  lastNightKilled: number | null; // index of player killed last night (null if saved)
  lastKickedIndex: number | null;
  cognitiveLog: string[]; // story log for morning announcements
}

export function setupMafiaGame(
  names: string[],
  settings: MafiaSettings
): MafiaGameState {
  const roles: MafiaRole[] = [];

  // Assign mafia
  for (let i = 0; i < settings.mafiaCount; i++) roles.push("mafia");
  if (settings.hasDoctor) roles.push("doctor");
  if (settings.hasCop) roles.push("cop");
  // Rest are villagers
  while (roles.length < names.length) roles.push("villager");

  // Fisher-Yates shuffle
  for (let i = roles.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [roles[i], roles[j]] = [roles[j], roles[i]];
  }

  const players: MafiaPlayer[] = names.map((name, i) => ({
    name,
    role: roles[i],
    alive: true,
  }));

  return {
    players,
    settings,
    round: 1,
    lastNightKilled: null,
    lastKickedIndex: null,
    cognitiveLog: [],
  };
}

export function processNight(
  state: MafiaGameState,
  mafiaTargetIndex: number,
  doctorTargetIndex: number | null
): MafiaGameState {
  const newPlayers = state.players.map((p) => ({ ...p }));
  let killedIndex: number | null = null;

  if (mafiaTargetIndex >= 0 && doctorTargetIndex !== mafiaTargetIndex) {
    newPlayers[mafiaTargetIndex].alive = false;
    killedIndex = mafiaTargetIndex;
  }

  return {
    ...state,
    players: newPlayers,
    lastNightKilled: killedIndex,
    round: state.round + 1,
  };
}

export function processVote(
  state: MafiaGameState,
  kickedIndex: number
): MafiaGameState {
  const newPlayers = state.players.map((p) => ({ ...p }));
  newPlayers[kickedIndex].alive = false;
  return {
    ...state,
    players: newPlayers,
    lastKickedIndex: kickedIndex,
  };
}

export function checkWinCondition(
  players: MafiaPlayer[]
): "mafia" | "villagers" | null {
  const alive = players.filter((p) => p.alive);
  const mafiaAlive = alive.filter((p) => p.role === "mafia").length;
  const othersAlive = alive.length - mafiaAlive;

  if (mafiaAlive === 0) return "villagers";
  if (mafiaAlive >= othersAlive) return "mafia";
  return null;
}

export function getAliveIndices(players: MafiaPlayer[]): number[] {
  return players
    .map((p, i) => (p.alive ? i : -1))
    .filter((i) => i >= 0);
}

export const ROLE_INFO: Record<
  MafiaRole,
  { name: string; emoji: string; description: string; color: string }
> = {
  mafia: {
    name: "Мафия",
    emoji: "🔫",
    description: "Ночью выбери жертву. Днём прикидывайся мирным.",
    color: "mafia",
  },
  villager: {
    name: "Мирный",
    emoji: "👤",
    description: "Найди мафию и выгони её днём.",
    color: "villager",
  },
  doctor: {
    name: "Доктор",
    emoji: "⚕️",
    description: "Ночью выбери, кого спасти от мафии.",
    color: "doctor",
  },
  cop: {
    name: "Комиссар",
    emoji: "🕵️",
    description: "Ночью проверь одного игрока — узнай, мафия он или нет.",
    color: "cop",
  },
};
