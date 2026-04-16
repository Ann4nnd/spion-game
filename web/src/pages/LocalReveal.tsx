import { useState } from "react";
import type { LocalPlayer } from "../hooks/useLocalGame.js";
import { getTelegram } from "../hooks/useTelegram.js";

interface Props {
  players: LocalPlayer[];
  location: string;
  onDone: () => void;
}

export function LocalReveal({ players, location, onDone }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);

  const player = players[currentIndex];
  const isLast = currentIndex === players.length - 1;
  const haptic = getTelegram()?.HapticFeedback;

  const showRole = () => {
    setRevealed(true);
    haptic?.impactOccurred("medium");
  };

  const next = () => {
    setRevealed(false);
    if (isLast) {
      onDone();
    } else {
      setCurrentIndex(currentIndex + 1);
    }
  };

  return (
    <div className="page">
      <div className="reveal-container">
        {!revealed ? (
          <>
            <div style={{ fontSize: 48 }}>🤫</div>
            <h2 className="page-title">Передай телефон</h2>
            <p style={{ fontSize: 20, fontWeight: 600 }}>{player.name}</p>
            <p className="page-subtitle">
              Игрок {currentIndex + 1} из {players.length}
            </p>
            <button className="btn btn-primary" onClick={showRole}>
              Показать мою роль
            </button>
          </>
        ) : (
          <>
            <div
              className={`role-card ${player.role === "spy" ? "spy" : "citizen"}`}
            >
              <div className="role-emoji">
                {player.role === "spy" ? "🕵️" : "👤"}
              </div>
              <div className="role-title">
                {player.role === "spy" ? "Ты — Шпион!" : "Ты — Мирный"}
              </div>
              {player.role === "citizen" && (
                <div className="role-location">Локация: {location}</div>
              )}
              {player.role === "spy" && (
                <div className="role-location">Угадай локацию!</div>
              )}
            </div>
            <button className="btn btn-primary" onClick={next}>
              {isLast ? "Все посмотрели — начать обсуждение" : "Понял, дальше"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
