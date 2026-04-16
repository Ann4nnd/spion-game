import { useState, useEffect } from "react";
import { getTelegram, useTelegram } from "../hooks/useTelegram.js";
import { api } from "../api/client.js";

interface Props {
  onGameStarted: (code: string) => void;
  onBack: () => void;
}

export function OnlineLobby({ onGameStarted, onBack }: Props) {
  const { user } = useTelegram();
  const [mode, setMode] = useState<"choose" | "create" | "join">("choose");
  const [code, setCode] = useState("");
  const [game, setGame] = useState<any>(null);
  const [error, setError] = useState("");
  const [spyCount, setSpyCount] = useState(1);
  const [timerEnabled, setTimerEnabled] = useState(true);
  const [timerMinutes, setTimerMinutes] = useState(5);

  const userId = user?.id?.toString() || `anon_${Date.now()}`;
  const userName = user?.first_name || "Игрок";

  useEffect(() => {
    const tg = getTelegram();
    tg?.BackButton.show();
    const handler = () => {
      if (mode === "choose") {
        onBack();
      } else if (game) {
        setGame(null);
        setMode("choose");
      } else {
        setMode("choose");
      }
    };
    tg?.BackButton.onClick(handler);
    return () => tg?.BackButton.offClick(handler);
  }, [mode, game, onBack]);

  // Poll game state when in lobby
  useEffect(() => {
    if (!game) return;
    const interval = setInterval(async () => {
      try {
        const updated = await api.getGame(game.code);
        setGame(updated);
        if (updated.status === "playing") {
          onGameStarted(updated.code);
        }
      } catch {}
    }, 2000);
    return () => clearInterval(interval);
  }, [game?.code]);

  const createGame = async () => {
    try {
      setError("");
      const g = await api.createGame({
        mode: "online",
        hostId: userId,
        hostName: userName,
        spyCount,
        timerSeconds: timerEnabled ? timerMinutes * 60 : null,
      });
      setGame(g);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const joinGame = async () => {
    try {
      setError("");
      await api.joinGame(code.toUpperCase(), userId, userName);
      const g = await api.getGame(code.toUpperCase());
      setGame(g);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const startGame = async () => {
    try {
      setError("");
      await api.startGame(game.code, userId);
      onGameStarted(game.code);
    } catch (e: any) {
      setError(e.message);
    }
  };

  // Lobby view
  if (game) {
    const isHost = game.hostId === userId;
    return (
      <div className="page">
        <h1 className="page-title">Лобби</h1>
        <div className="card" style={{ textAlign: "center" }}>
          <div className="card-text">Код игры</div>
          <div
            style={{
              fontSize: 32,
              fontWeight: 700,
              letterSpacing: 4,
              marginTop: 8,
            }}
          >
            {game.code}
          </div>
          <p className="card-text" style={{ marginTop: 8 }}>
            Отправь этот код друзьям
          </p>
        </div>

        <div className="card">
          <div className="card-title">
            Игроки ({game.players?.length || 0})
          </div>
          {game.players?.map((p: any) => (
            <div key={p.id} style={{ padding: "8px 0", fontSize: 16 }}>
              {p.name} {p.userId === game.hostId ? "👑" : ""}
            </div>
          ))}
        </div>

        {error && (
          <p style={{ color: "#e53935", textAlign: "center" }}>{error}</p>
        )}

        <div className="spacer" />

        {isHost && (
          <div className="bottom-actions">
            <button
              className="btn btn-primary"
              disabled={(game.players?.length || 0) < 3}
              onClick={startGame}
            >
              Начать игру ({game.players?.length || 0}/3 мин.)
            </button>
          </div>
        )}
        {!isHost && (
          <p className="page-subtitle">Ожидаем, пока хост начнёт игру...</p>
        )}
      </div>
    );
  }

  // Choose create or join
  if (mode === "choose") {
    return (
      <div className="page">
        <h1 className="page-title">Онлайн-режим</h1>
        <p className="page-subtitle">Создай игру или присоединись по коду</p>

        <div className="card mode-card" onClick={() => setMode("create")}>
          <div className="mode-icon">🆕</div>
          <div className="card-title">Создать игру</div>
          <div className="card-text">Ты будешь хостом</div>
        </div>

        <div className="card mode-card" onClick={() => setMode("join")}>
          <div className="mode-icon">🔗</div>
          <div className="card-title">Присоединиться</div>
          <div className="card-text">Введи код от друга</div>
        </div>
      </div>
    );
  }

  // Create form
  if (mode === "create") {
    return (
      <div className="page">
        <h1 className="page-title">Новая онлайн-игра</h1>

        <div className="setting-row">
          <span className="setting-label">Шпионов</span>
          <div className="setting-value">
            <button
              className="stepper-btn"
              onClick={() => setSpyCount(Math.max(1, spyCount - 1))}
            >
              −
            </button>
            <span className="stepper-value">{spyCount}</span>
            <button
              className="stepper-btn"
              onClick={() => setSpyCount(Math.min(3, spyCount + 1))}
            >
              +
            </button>
          </div>
        </div>

        <div className="setting-row">
          <span className="setting-label">Таймер</span>
          <button
            className={`toggle ${timerEnabled ? "active" : ""}`}
            onClick={() => setTimerEnabled(!timerEnabled)}
          />
        </div>

        {timerEnabled && (
          <div className="setting-row">
            <span className="setting-label">Минуты</span>
            <div className="setting-value">
              <button
                className="stepper-btn"
                onClick={() => setTimerMinutes(Math.max(1, timerMinutes - 1))}
              >
                −
              </button>
              <span className="stepper-value">{timerMinutes}</span>
              <button
                className="stepper-btn"
                onClick={() =>
                  setTimerMinutes(Math.min(15, timerMinutes + 1))
                }
              >
                +
              </button>
            </div>
          </div>
        )}

        {error && (
          <p style={{ color: "#e53935", textAlign: "center", marginTop: 16 }}>
            {error}
          </p>
        )}

        <div className="spacer" />

        <div className="bottom-actions">
          <button className="btn btn-primary" onClick={createGame}>
            Создать игру
          </button>
        </div>
      </div>
    );
  }

  // Join form
  return (
    <div className="page">
      <h1 className="page-title">Присоединиться</h1>
      <p className="page-subtitle">Введи код игры</p>

      <div className="input-group">
        <input
          className="input"
          style={{
            textAlign: "center",
            fontSize: 24,
            letterSpacing: 4,
            textTransform: "uppercase",
          }}
          placeholder="ABC123"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
        />
      </div>

      {error && (
        <p style={{ color: "#e53935", textAlign: "center" }}>{error}</p>
      )}

      <div className="spacer" />

      <div className="bottom-actions">
        <button
          className="btn btn-primary"
          disabled={code.length < 4}
          onClick={joinGame}
        >
          Войти в игру
        </button>
      </div>
    </div>
  );
}
