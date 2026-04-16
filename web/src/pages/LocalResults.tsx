import type { LocalPlayer } from "../hooks/useLocalGame.js";
import { getTelegram } from "../hooks/useTelegram.js";
import { useEffect } from "react";

interface Props {
  players: LocalPlayer[];
  location: string;
  votedOutIndex: number | null;
  onPlayAgain: () => void;
  onHome: () => void;
}

export function LocalResults({
  players,
  location,
  votedOutIndex,
  onPlayAgain,
  onHome,
}: Props) {
  const spies = players.filter((p) => p.role === "spy");
  const votedOut = votedOutIndex !== null ? players[votedOutIndex] : null;
  const spyWins = !votedOut || votedOut.role !== "spy";
  const haptic = getTelegram()?.HapticFeedback;

  useEffect(() => {
    haptic?.notificationOccurred(spyWins ? "error" : "success");
  }, []);

  return (
    <div className="page">
      <div
        className={`results-banner ${spyWins ? "spy-wins" : "citizens-win"}`}
      >
        <div style={{ fontSize: 64, marginBottom: 12 }}>
          {spyWins ? "😈" : "🎉"}
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 12 }}>
          {spyWins ? "Вы проиграли!" : "Вы выиграли!"}
        </h1>
        {votedOut && !spyWins && (
          <p style={{ fontSize: 18, opacity: 0.95 }}>
            {votedOut.name} — шпион!
          </p>
        )}
        {votedOut && spyWins && (
          <>
            <p style={{ fontSize: 18, opacity: 0.95, marginBottom: 8 }}>
              {votedOut.name} — не шпион!
            </p>
            <p style={{ fontSize: 18, opacity: 0.95 }}>
              {spies.length === 1 ? "Шпион" : "Шпионы"} — {spies.map((s) => s.name).join(", ")}
            </p>
          </>
        )}
      </div>

      <div className="card">
        <div className="card-title">Локация</div>
        <div style={{ fontSize: 20, fontWeight: 600, marginTop: 4 }}>
          {location}
        </div>
      </div>

      <div className="card">
        <div className="card-title">Роли</div>
        {players.map((p, i) => (
          <div
            key={i}
            style={{
              padding: "8px 0",
              display: "flex",
              justifyContent: "space-between",
              fontSize: 16,
            }}
          >
            <span>{p.name}</span>
            <span style={{ fontWeight: 600 }}>
              {p.role === "spy" ? "🕵️ Шпион" : "👤 Мирный"}
            </span>
          </div>
        ))}
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
