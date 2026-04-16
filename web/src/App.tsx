import { useState } from "react";
import { Home } from "./pages/Home.js";
import { LocalSetup } from "./pages/LocalSetup.js";
import { LocalReveal } from "./pages/LocalReveal.js";
import { LocalDiscussion } from "./pages/LocalDiscussion.js";
import { LocalVoting } from "./pages/LocalVoting.js";
import { LocalResults } from "./pages/LocalResults.js";
import { OnlineLobby } from "./pages/OnlineLobby.js";
import { OnlineGame } from "./pages/OnlineGame.js";
import type { LocalPlayer } from "./hooks/useLocalGame.js";

type Screen =
  | { name: "home" }
  | { name: "local-setup"; initialNames?: string[] }
  | {
      name: "local-reveal";
      players: LocalPlayer[];
      location: string;
      timerSeconds: number | null;
    }
  | {
      name: "local-discussion";
      players: LocalPlayer[];
      location: string;
      timerSeconds: number | null;
    }
  | {
      name: "local-voting";
      players: LocalPlayer[];
      location: string;
    }
  | {
      name: "local-results";
      players: LocalPlayer[];
      location: string;
      votedOutIndex: number | null;
    }
  | { name: "online-lobby" }
  | { name: "online-game"; code: string };

export function App() {
  const [screen, setScreen] = useState<Screen>({ name: "home" });

  switch (screen.name) {
    case "home":
      return (
        <Home
          onLocal={() => setScreen({ name: "local-setup" })}
          onOnline={() => setScreen({ name: "online-lobby" })}
        />
      );

    case "local-setup":
      return (
        <LocalSetup
          initialNames={screen.initialNames}
          onStart={(players, location, timerSeconds) =>
            setScreen({
              name: "local-reveal",
              players,
              location,
              timerSeconds,
            })
          }
          onBack={() => setScreen({ name: "home" })}
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
          onBack={() => setScreen({ name: "home" })}
        />
      );

    case "online-game":
      return (
        <OnlineGame
          code={screen.code}
          onHome={() => setScreen({ name: "home" })}
        />
      );
  }
}
