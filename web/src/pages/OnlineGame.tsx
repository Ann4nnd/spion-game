import { useState, useEffect, useRef } from "react";
import { useTelegram } from "../hooks/useTelegram.js";
import { api } from "../api/client.js";

interface Props {
  code: string;
  onHome: () => void;
}

type Phase = "role" | "discussion" | "voting" | "results";

export function OnlineGame({ code, onHome }: Props) {
  const { user, haptic } = useTelegram();
  const userId = user?.id?.toString() || "";
  const [game, setGame] = useState<any>(null);
  const [phase, setPhase] = useState<Phase>("role");
  const [selectedVote, setSelectedVote] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const intervalRef = useRef<number | null>(null);

  // Load game
  useEffect(() => {
    const load = async () => {
      const g = await api.getGame(code);
      setGame(g);
      if (g.timerSeconds) setSecondsLeft(g.timerSeconds);
    };
    load();
  }, [code]);

  // Poll for updates during voting
  useEffect(() => {
    if (phase !== "voting") return;
    const interval = setInterval(async () => {
      try {
        const g = await api.getGame(code);
        setGame(g);
        if (g.status === "finished") {
          const r = await api.getResults(code);
          setResults(r);
          setPhase("results");
        }
      } catch {}
    }, 2000);
    return () => clearInterval(interval);
  }, [phase, code]);

  // Timer
  useEffect(() => {
    if (phase !== "discussion" || secondsLeft === null) return;
    intervalRef.current = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev === null || prev <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          haptic?.notificationOccurred("warning");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [phase]);

  const formatTime = (s: number) => {
    const min = Math.floor(s / 60);
    const sec = s % 60;
    return `${min}:${sec.toString().padStart(2, "0")}`;
  };

  if (!game) {
    return (
      <div className="page">
        <div className="reveal-container">
          <p>Загрузка...</p>
        </div>
      </div>
    );
  }

  const myPlayer = game.players?.find((p: any) => p.userId === userId);

  // Role reveal
  if (phase === "role") {
    return (
      <div className="page">
        <div className="reveal-container">
          <div
            className={`role-card ${myPlayer?.role === "spy" ? "spy" : "citizen"}`}
          >
            <div className="role-emoji">
              {myPlayer?.role === "spy" ? "🕵️" : "👤"}
            </div>
            <div className="role-title">
              {myPlayer?.role === "spy" ? "Ты — Шпион!" : "Ты — Мирный"}
            </div>
            {myPlayer?.role === "citizen" && (
              <div className="role-location">Локация: {game.location}</div>
            )}
            {myPlayer?.role === "spy" && (
              <div className="role-location">Угадай локацию!</div>
            )}
          </div>

          <div className="card">
            <div className="card-title">Игроки</div>
            {game.players?.map((p: any) => (
              <div key={p.id} style={{ padding: "4px 0" }}>
                {p.name}
              </div>
            ))}
          </div>

          <button
            className="btn btn-primary"
            onClick={() => setPhase("discussion")}
          >
            Начать обсуждение
          </button>
        </div>
      </div>
    );
  }

  // Discussion
  if (phase === "discussion") {
    return (
      <div className="page">
        <h1 className="page-title">Обсуждение</h1>
        <p className="page-subtitle">
          Задавайте вопросы, чтобы найти шпиона!
        </p>

        {secondsLeft !== null && (
          <div className={`timer-display ${secondsLeft < 30 ? "warning" : ""}`}>
            {formatTime(secondsLeft)}
          </div>
        )}

        <div className="card">
          <div className="card-title">Игроки</div>
          {game.players?.map((p: any) => (
            <div key={p.id} style={{ padding: "4px 0" }}>
              {p.name}
            </div>
          ))}
        </div>

        <div className="spacer" />

        <div className="bottom-actions">
          <button
            className="btn btn-primary"
            onClick={() => setPhase("voting")}
          >
            Голосовать
          </button>
        </div>
      </div>
    );
  }

  // Voting
  if (phase === "voting") {
    if (hasVoted) {
      return (
        <div className="page">
          <div className="reveal-container">
            <div style={{ fontSize: 48 }}>⏳</div>
            <h2 className="page-title">Голос принят</h2>
            <p className="page-subtitle">Ожидаем голоса остальных...</p>
          </div>
        </div>
      );
    }

    const handleVote = async () => {
      if (!selectedVote) return;
      try {
        const result = await api.vote(code, userId, selectedVote) as any;
        setHasVoted(true);
        haptic?.impactOccurred("medium");
        if (result.allVoted) {
          const r = await api.getResults(code);
          setResults(r);
          setPhase("results");
        }
      } catch {}
    };

    return (
      <div className="page">
        <h1 className="page-title">Голосование</h1>
        <p className="page-subtitle">Кто шпион?</p>

        <div className="vote-grid">
          {game.players
            ?.filter((p: any) => p.userId !== userId)
            .map((p: any) => (
              <button
                key={p.id}
                className={`vote-option ${selectedVote === p.id ? "selected" : ""}`}
                onClick={() => {
                  setSelectedVote(p.id);
                  haptic?.selectionChanged();
                }}
              >
                {p.name}
              </button>
            ))}
        </div>

        <div className="spacer" />

        <div className="bottom-actions">
          <button
            className="btn btn-primary"
            disabled={!selectedVote}
            onClick={handleVote}
          >
            Голосовать
          </button>
        </div>
      </div>
    );
  }

  // Results
  if (phase === "results" && results) {
    return (
      <div className="page">
        <div
          className={`results-banner ${results.spyWins ? "spy-wins" : "citizens-win"}`}
        >
          <div style={{ fontSize: 64, marginBottom: 12 }}>
            {results.spyWins ? "🕵️" : "🎉"}
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>
            {results.spyWins ? "Шпион победил!" : "Мирные победили!"}
          </h1>
          {results.votedOut && (
            <p style={{ fontSize: 16, opacity: 0.9 }}>
              Выгнали: {results.votedOut.name}
            </p>
          )}
        </div>

        <div className="card">
          <div className="card-title">Локация</div>
          <div style={{ fontSize: 20, fontWeight: 600, marginTop: 4 }}>
            {results.location}
          </div>
        </div>

        <div className="card">
          <div className="card-title">Шпионы</div>
          {results.spies?.map((s: any) => (
            <div key={s.id} style={{ padding: "4px 0", fontSize: 16 }}>
              🕵️ {s.name}
            </div>
          ))}
        </div>

        <div className="spacer" />

        <div className="bottom-actions">
          <button className="btn btn-primary" onClick={onHome}>
            На главную
          </button>
        </div>
      </div>
    );
  }

  return null;
}
