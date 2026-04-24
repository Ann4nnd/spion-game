import { useState } from "react";
import { getTelegram } from "../hooks/useTelegram.js";
import { ROLE_INFO, type MafiaPlayer } from "../hooks/useMafiaGame.js";

interface Props {
  players: MafiaPlayer[];
  onDone: () => void;
}

export function MafiaRoleReveal({ players, onDone }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const haptic = getTelegram()?.HapticFeedback;

  const player = players[currentIndex];
  const info = ROLE_INFO[player.role];
  const isLast = currentIndex === players.length - 1;

  const showRole = () => {
    setRevealed(true);
    haptic?.impactOccurred("medium");
  };

  const next = () => {
    setRevealed(false);
    if (isLast) onDone();
    else setCurrentIndex(currentIndex + 1);
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
            <div className={`role-card ${info.color}`}>
              <div className="role-emoji">{info.emoji}</div>
              <div className="role-title">{info.name}</div>
              <div className="role-location">{info.description}</div>
            </div>
            <button className="btn btn-primary" onClick={next}>
              {isLast ? "Все посмотрели — начать ночь" : "Понял, дальше"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
