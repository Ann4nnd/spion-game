import { useEffect } from "react";
import { getTelegram } from "../hooks/useTelegram.js";
import { ROLE_INFO, type MafiaPlayer } from "../hooks/useMafiaGame.js";

interface Props {
  players: MafiaPlayer[];
  winner: "mafia" | "villagers";
  onPlayAgain: () => void;
  onHome: () => void;
}

export function MafiaResults({ players, winner, onPlayAgain, onHome }: Props) {
  const haptic = getTelegram()?.HapticFeedback;
  const mafiaWins = winner === "mafia";

  useEffect(() => {
    haptic?.notificationOccurred(mafiaWins ? "error" : "success");
  }, []);

  return (
    <div className="page">
      <div className={`results-banner ${mafiaWins ? "mafia-wins" : "villagers-win"}`}>
        <div style={{ fontSize: 64, marginBottom: 12 }}>
          {mafiaWins ? "🔫" : "🎉"}
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>
          {mafiaWins ? "Мафия победила!" : "Мирные победили!"}
        </h1>
        <p style={{ fontSize: 16, opacity: 0.9 }}>
          {mafiaWins
            ? "Мафия захватила город"
            : "Город очистился от мафии"}
        </p>
      </div>

      <div className="card">
        <div className="card-title">Все роли</div>
        {players.map((p, i) => {
          const info = ROLE_INFO[p.role];
          return (
            <div
              key={i}
              style={{
                padding: "8px 0",
                display: "flex",
                justifyContent: "space-between",
                fontSize: 16,
              }}
            >
              <span style={{ opacity: p.alive ? 1 : 0.5 }}>
                {p.name} {!p.alive && "💀"}
              </span>
              <span style={{ fontWeight: 600 }}>
                {info.emoji} {info.name}
              </span>
            </div>
          );
        })}
      </div>

      <div className="spacer" />
      <div className="bottom-actions">
        <button className="btn btn-primary" onClick={onPlayAgain}>
          Играть ещё раз
        </button>
        <button className="btn btn-secondary" onClick={onHome}>
          На главную
        </button>
      </div>
    </div>
  );
}
