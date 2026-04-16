import { useState } from "react";
import type { LocalPlayer } from "../hooks/useLocalGame.js";
import { getTelegram } from "../hooks/useTelegram.js";

interface Props {
  players: LocalPlayer[];
  onResult: (votedOutIndex: number | null) => void;
}

export function LocalVoting({ players, onResult }: Props) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const haptic = getTelegram()?.HapticFeedback;

  const handleSelect = (idx: number) => {
    setSelectedIndex(idx);
    haptic?.selectionChanged();
  };

  const confirmVote = () => {
    if (selectedIndex === null) return;
    haptic?.impactOccurred("medium");
    onResult(selectedIndex);
  };

  return (
    <div className="page">
      <h1 className="page-title">Голосование</h1>
      <p className="page-subtitle">Кого вы считаете шпионом?</p>

      <div className="vote-grid">
        {players.map((p, i) => (
          <button
            key={i}
            className={`vote-option ${selectedIndex === i ? "selected" : ""}`}
            onClick={() => handleSelect(i)}
          >
            {p.name}
          </button>
        ))}
      </div>

      <div className="spacer" />

      <div className="bottom-actions">
        <button
          className="btn btn-primary"
          disabled={selectedIndex === null}
          onClick={confirmVote}
        >
          Выгнать {selectedIndex !== null ? players[selectedIndex].name : ""}
        </button>
      </div>
    </div>
  );
}
