import { useState, useEffect, useRef } from "react";
import type { LocalPlayer } from "../hooks/useLocalGame.js";
import { getTelegram } from "../hooks/useTelegram.js";

interface Props {
  players: LocalPlayer[];
  timerSeconds: number | null;
  onVote: () => void;
}

export function LocalDiscussion({ players, timerSeconds, onVote }: Props) {
  const [secondsLeft, setSecondsLeft] = useState(timerSeconds);
  const [timerDone, setTimerDone] = useState(false);
  const intervalRef = useRef<number | null>(null);
  const haptic = getTelegram()?.HapticFeedback;

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

  return (
    <div className="page">
      <h1 className="page-title">Обсуждение</h1>
      <p className="page-subtitle">
        Задавайте вопросы по кругу, чтобы вычислить шпиона!
      </p>

      {secondsLeft !== null && (
        <div className={`timer-display ${secondsLeft < 30 ? "warning" : ""}`}>
          {timerDone ? "Время вышло!" : formatTime(secondsLeft)}
        </div>
      )}

      <div className="card">
        <div className="card-title">Игроки ({players.length})</div>
        {players.map((p, i) => (
          <div key={i} style={{ padding: "8px 0", fontSize: 16 }}>
            {p.name}
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
