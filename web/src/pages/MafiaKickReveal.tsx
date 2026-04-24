import { ROLE_INFO, type MafiaPlayer } from "../hooks/useMafiaGame.js";

interface Props {
  kicked: MafiaPlayer;
  onContinue: () => void;
  hasWinner: boolean;
}

export function MafiaKickReveal({ kicked, onContinue, hasWinner }: Props) {
  const info = ROLE_INFO[kicked.role];
  const wasMafia = kicked.role === "mafia";

  return (
    <div className="page">
      <div className="reveal-container">
        <div className={`role-card ${info.color}`}>
          <div className="role-emoji">{info.emoji}</div>
          <div className="role-title">{kicked.name}</div>
          <div className="role-location">
            был{" "}
            {info.name === "Мафия" || info.name === "Комиссар"
              ? "—"
              : "—"}{" "}
            {info.name}
          </div>
        </div>
        <p style={{ fontSize: 16, color: "var(--text-secondary)", textAlign: "center" }}>
          {wasMafia ? "Город избавился от мафии!" : "Невиновный пал от руки города..."}
        </p>
        <button className="btn btn-primary" onClick={onContinue}>
          {hasWinner ? "К результатам" : "Продолжить"}
        </button>
      </div>
    </div>
  );
}
