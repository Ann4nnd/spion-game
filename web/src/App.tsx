import { useState } from "react";
import { Home } from "./pages/Home.js";
import { SpyModeChoice } from "./pages/SpyModeChoice.js";
import { LocalSetup } from "./pages/LocalSetup.js";
import { LocalReveal } from "./pages/LocalReveal.js";
import { LocalDiscussion } from "./pages/LocalDiscussion.js";
import { LocalVoting } from "./pages/LocalVoting.js";
import { LocalResults } from "./pages/LocalResults.js";
import { OnlineLobby } from "./pages/OnlineLobby.js";
import { OnlineGame } from "./pages/OnlineGame.js";
import { MafiaSetup } from "./pages/MafiaSetup.js";
import { MafiaRoleReveal } from "./pages/MafiaRoleReveal.js";
import { MafiaNight } from "./pages/MafiaNight.js";
import { MafiaDay } from "./pages/MafiaDay.js";
import { MafiaVoting } from "./pages/MafiaVoting.js";
import { MafiaKickReveal } from "./pages/MafiaKickReveal.js";
import { MafiaResults } from "./pages/MafiaResults.js";
import { WordOfDay } from "./pages/WordOfDay.js";
import type { LocalPlayer } from "./hooks/useLocalGame.js";
import {
  type MafiaGameState,
  processNight,
  processVote,
  checkWinCondition,
} from "./hooks/useMafiaGame.js";

type Screen =
  | { name: "home" }
  | { name: "spy-mode-choice" }
  | { name: "local-setup"; initialNames?: string[] }
  | { name: "local-reveal"; players: LocalPlayer[]; location: string; timerSeconds: number | null }
  | { name: "local-discussion"; players: LocalPlayer[]; location: string; timerSeconds: number | null }
  | { name: "local-voting"; players: LocalPlayer[]; location: string }
  | { name: "local-results"; players: LocalPlayer[]; location: string; votedOutIndex: number | null }
  | { name: "online-lobby" }
  | { name: "online-game"; code: string }
  | { name: "mafia-setup"; initialNames?: string[] }
  | { name: "mafia-reveal"; state: MafiaGameState }
  | { name: "mafia-night"; state: MafiaGameState }
  | { name: "mafia-day"; state: MafiaGameState }
  | { name: "mafia-voting"; state: MafiaGameState }
  | { name: "mafia-kick-reveal"; state: MafiaGameState }
  | { name: "mafia-results"; state: MafiaGameState; winner: "mafia" | "villagers" }
  | { name: "word-of-day" };

export function App() {
  const [screen, setScreen] = useState<Screen>({ name: "home" });

  switch (screen.name) {
    case "home":
      return (
        <Home
          onSpy={() => setScreen({ name: "spy-mode-choice" })}
          onMafia={() => setScreen({ name: "mafia-setup" })}
          onWordOfDay={() => setScreen({ name: "word-of-day" })}
        />
      );

    case "word-of-day":
      return <WordOfDay onBack={() => setScreen({ name: "home" })} />;

    case "spy-mode-choice":
      return (
        <SpyModeChoice
          onLocal={() => setScreen({ name: "local-setup" })}
          onOnline={() => setScreen({ name: "online-lobby" })}
          onBack={() => setScreen({ name: "home" })}
        />
      );

    case "local-setup":
      return (
        <LocalSetup
          initialNames={screen.initialNames}
          onStart={(players, location, timerSeconds) =>
            setScreen({ name: "local-reveal", players, location, timerSeconds })
          }
          onBack={() => setScreen({ name: "spy-mode-choice" })}
        />
      );

    case "local-reveal":
      return (
        <LocalReveal
          players={screen.players}
          location={screen.location}
          onDone={() =>
            setScreen({
              name: "local-discussion",
              players: screen.players,
              location: screen.location,
              timerSeconds: screen.timerSeconds,
            })
          }
        />
      );

    case "local-discussion":
      return (
        <LocalDiscussion
          players={screen.players}
          timerSeconds={screen.timerSeconds}
          onVote={() =>
            setScreen({
              name: "local-voting",
              players: screen.players,
              location: screen.location,
            })
          }
        />
      );

    case "local-voting":
      return (
        <LocalVoting
          players={screen.players}
          onResult={(votedOutIndex) =>
            setScreen({
              name: "local-results",
              players: screen.players,
              location: screen.location,
              votedOutIndex,
            })
          }
        />
      );

    case "local-results":
      return (
        <LocalResults
          players={screen.players}
          location={screen.location}
          votedOutIndex={screen.votedOutIndex}
          onPlayAgain={() =>
            setScreen({
              name: "local-setup",
              initialNames: screen.players.map((p) => p.name),
            })
          }
          onHome={() => setScreen({ name: "home" })}
        />
      );

    case "online-lobby":
      return (
        <OnlineLobby
          onGameStarted={(code) => setScreen({ name: "online-game", code })}
          onBack={() => setScreen({ name: "spy-mode-choice" })}
        />
      );

    case "online-game":
      return (
        <OnlineGame
          code={screen.code}
          onHome={() => setScreen({ name: "home" })}
        />
      );

    case "mafia-setup":
      return (
        <MafiaSetup
          initialNames={screen.initialNames}
          onStart={(state) => setScreen({ name: "mafia-reveal", state })}
          onBack={() => setScreen({ name: "home" })}
        />
      );

    case "mafia-reveal":
      return (
        <MafiaRoleReveal
          players={screen.state.players}
          onDone={() => setScreen({ name: "mafia-night", state: screen.state })}
        />
      );

    case "mafia-night":
      return (
        <MafiaNight
          state={screen.state}
          onDone={(mafiaTarget, doctorTarget) => {
            const newState = processNight(screen.state, mafiaTarget, doctorTarget);
            const winner = checkWinCondition(newState.players);
            if (winner) {
              setScreen({ name: "mafia-results", state: newState, winner });
            } else {
              setScreen({ name: "mafia-day", state: newState });
            }
          }}
        />
      );

    case "mafia-day":
      return (
        <MafiaDay
          state={screen.state}
          onVote={() => setScreen({ name: "mafia-voting", state: screen.state })}
        />
      );

    case "mafia-voting":
      return (
        <MafiaVoting
          players={screen.state.players}
          onResult={(kickedIndex) => {
            const newState = processVote(screen.state, kickedIndex);
            setScreen({ name: "mafia-kick-reveal", state: newState });
          }}
        />
      );

    case "mafia-kick-reveal": {
      const kickedIdx = screen.state.lastKickedIndex!;
      const kicked = screen.state.players[kickedIdx];
      const winner = checkWinCondition(screen.state.players);
      return (
        <MafiaKickReveal
          kicked={kicked}
          hasWinner={winner !== null}
          onContinue={() => {
            if (winner) {
              setScreen({ name: "mafia-results", state: screen.state, winner });
            } else {
              setScreen({ name: "mafia-night", state: screen.state });
            }
          }}
        />
      );
    }

    case "mafia-results":
      return (
        <MafiaResults
          players={screen.state.players}
          winner={screen.winner}
          onPlayAgain={() =>
            setScreen({
              name: "mafia-setup",
              initialNames: screen.state.players.map((p) => p.name),
            })
          }
          onHome={() => setScreen({ name: "home" })}
        />
      );
  }
}
