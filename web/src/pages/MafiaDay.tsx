import { useState, useEffect, useRef } from "react";
import { getTelegram } from "../hooks/useTelegram.js";
import type { MafiaGameState } from "../hooks/useMafiaGame.js";

interface Props {
  state: MafiaGameState;
  onVote: () => void;
}

export function MafiaDay({ state, onVote }: Props) {
  const { players, settings, lastNightKilled } = state;
  const [secondsLeft, setSecondsLeft] = useState(settings.timerSeconds);
  const [timerDone, setTimerDone] = useState(false);
  const intervalRef = useRef<number | null>(null);
  const haptic = getTelegram()?.HapticFeedback;

  const killedPlayer = lastNightKilled !== null ? players[lastNightKilled] : null;

  useEffect(() => {
    if (secondsLeft === null) return;
    intervalRef.current = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev === null || prev <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          haptic?.notificationOccurred("warning");
          setTimerDone(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const formatTime = (s: number) => {
    const min = Math.floor(s / 60);
    const sec = s % 60;
    return `${min}:${sec.toString().padStart(2, "0")}`;
  };

  const aliveNames = players.filter((p) => p.alive).map((p) => p.name);

  return (
    <div className="page">
      <h1 className="page-title">☀️ День {state.round - 1}</h1>

      {killedPlayer ? (
        <div className="card" style={{ textAlign: "center", padding: "24px" }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>💀</div>
          <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>
            {killedPlayer.name}
          </div>
          <div style={{ color: "var(--text-secondary)" }}>
            был убит этой ночью
          </div>
        </div>
      ) : (
        <div className="card" style={{ textAlign: "center", padding: "24px" }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>⚕️</div>
          <div style={{ fontSize: 18, fontWeight: 600 }}>
            Этой ночью никто не пострадал
          </div>
          <div style={{ color: "var(--text-secondary)", marginTop: 4 }}>
            Доктор спас жертву
          </div>
        </div>
      )}

      {secondsLeft !== null && (
        <div className={`timer-display ${secondsLeft < 30 ? "warning" : ""}`}>
          {timerDone ? "Время вышло!" : formatTime(secondsLeft)}
        </div>
      )}

      <div className="card">
        <div className="card-title">Живые ({aliveNames.length})</div>
        {aliveNames.map((name, i) => (
          <div key={i} style={{ padding: "6px 0", fontSize: 16 }}>
            {name}
          </div>
        ))}
      </div>

      <div className="spacer" />
      <div className="bottom-actions">
        <button className="btn btn-primary" onClick={onVote}>
          {timerDone ? "Время голосования!" : "Перейти к голосованию"}
        </button>
      </div>
    </div>
  );
}
