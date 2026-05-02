import { useState } from "react";
import { getTelegram } from "../hooks/useTelegram.js";
import type { MafiaPlayer } from "../hooks/useMafiaGame.js";

interface Props {
  players: MafiaPlayer[];
  onResult: (kickedIndex: number) => void;
}

export function MafiaVoting({ players, onResult }: Props) {
  const [selected, setSelected] = useState<number | null>(null);
  const haptic = getTelegram()?.HapticFeedback;

  const alivePlayers = players
    .map((p, i) => ({ ...p, idx: i }))
    .filter((p) => p.alive);

  const handleSelect = (idx: number) => {
    setSelected(idx);
    haptic?.selectionChanged();
  };

  const confirm = () => {
    if (selected === null) return;
    haptic?.impactOccurred("medium");
    onResult(selected);
  };

  return (
    <div className="page">
      <h1 className="page-title">Голосование</h1>
      <p className="page-subtitle">Кого выгнать из города?</p>
      <div className="vote-grid">
        {alivePlayers.map((p) => (
          <button
            key={p.idx}
            className={`vote-option ${selected === p.idx ? "selected" : ""}`}
            onClick={() => handleSelect(p.idx)}
          >
            {p.name}
          </button>
        ))}
      </div>
      <div className="spacer" />
      <div className="bottom-actions">
        <button className="btn btn-primary" disabled={selected === null} onClick={confirm}>
          Выгнать {selected !== null ? players[selected].name : ""}
        </button>
      </div>
    </div>
  );
}
