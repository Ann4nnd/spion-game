export type GameMode = "online" | "local";
export type GameStatus = "lobby" | "playing" | "voting" | "finished";
export type PlayerRole = "spy" | "citizen";

export interface GameSettings {
  mode: GameMode;
  timerSeconds: number | null;
  spyCount: number;
  locationPackIds: string[];
}

export interface GameState {
  id: string;
  code: string;
  mode: GameMode;
  status: GameStatus;
  hostId: string;
  spyCount: number;
  timerSeconds: number | null;
  location: string | null;
  players: PlayerInfo[];
}

export interface PlayerInfo {
  id: string;
  name: string;
  role: PlayerRole | null;
  hasVoted: boolean;
}

export interface LocationPack {
  id: string;
  name: string;
  isDefault: boolean;
  locations: string[];
}

export interface CreateGameRequest {
  mode: GameMode;
  hostId: string;
  hostName: string;
  settings: GameSettings;
}

export interface JoinGameRequest {
  userId: string;
  name: string;
}

export interface VoteRequest {
  odId: string;
  targetPlayerId: string;
}

export interface GameResult {
  spies: PlayerInfo[];
  location: string;
  votedOut: PlayerInfo | null;
  spyWins: boolean;
}

// Local mode types (no server needed)
export interface LocalPlayer {
  name: string;
  role: PlayerRole | null;
}

export interface LocalGameState {
  players: LocalPlayer[];
  location: string | null;
  spyCount: number;
  timerSeconds: number | null;
  currentRevealIndex: number;
  status: "setup" | "revealing" | "discussion" | "voting" | "results";
}
