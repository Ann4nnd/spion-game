import { useState, useEffect } from "react";
import { getTelegram } from "../hooks/useTelegram.js";
import { setupLocalGame, LOCATION_PACKS, type LocalPlayer } from "../hooks/useLocalGame.js";

interface Props {
  initialNames?: string[];
  onStart: (
    players: LocalPlayer[],
    location: string,
    timerSeconds: number | null
  ) => void;
  onBack: () => void;
}

export function LocalSetup({ initialNames, onStart, onBack }: Props) {
  const [names, setNames] = useState<string[]>(initialNames ?? [""]);
  const [spyCount, setSpyCount] = useState(1);
  const [timerEnabled, setTimerEnabled] = useState(true);
  const [timerMinutes, setTimerMinutes] = useState(5);
  const [selectedPacks, setSelectedPacks] = useState<Set<string>>(
    new Set(LOCATION_PACKS.map((p) => p.id))
  );

  useEffect(() => {
    const tg = getTelegram();
    tg?.BackButton.show();
    const handler = () => onBack();
    tg?.BackButton.onClick(handler);
    return () => tg?.BackButton.offClick(handler);
  }, [onBack]);

  const addPlayer = () => {
    if (names.length < 12) setNames([...names, ""]);
  };

  const removePlayer = (idx: number) => {
    if (names.length > 1) setNames(names.filter((_, i) => i !== idx));
  };

  const updateName = (idx: number, value: string) => {
    const updated = [...names];
    updated[idx] = value;
    setNames(updated);
  };

  const togglePack = (id: string) => {
    const next = new Set(selectedPacks);
    if (next.has(id)) {
      if (next.size > 1) next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedPacks(next);
  };

  const totalLocations = LOCATION_PACKS
    .filter((p) => selectedPacks.has(p.id))
    .reduce((sum, p) => sum + p.locations.length, 0);

  const validNames = names.filter((n) => n.trim().length > 0);
  const canStart = validNames.length >= 3 && spyCount < validNames.length;

  const handleStart = () => {
    const { players, location } = setupLocalGame(
      validNames,
      spyCount,
      [...selectedPacks]
    );
    const timer = timerEnabled ? timerMinutes * 60 : null;
    onStart(players, location, timer);
  };

  return (
    <div className="page">
      <h1 className="page-title">Настройка игры</h1>
      <p className="page-subtitle">Минимум 3 игрока</p>

      <div style={{ marginBottom: 16 }}>
        <label style={{ fontSize: 13, fontWeight: 500, marginBottom: 8, display: "block", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.03em" }}>
          Игроки
        </label>
        <ul className="player-list">
          {names.map((name, i) => (
            <li key={i} className="player-item">
              <input
                className="input"
                style={{ flex: 1, marginRight: 8 }}
                placeholder={`Игрок ${i + 1}`}
                value={name}
                onChange={(e) => updateName(i, e.target.value)}
              />
              {names.length > 1 && (
                <button className="remove-btn" onClick={() => removePlayer(i)}>
                  ✕
                </button>
              )}
            </li>
          ))}
        </ul>
        {names.length < 12 && (
          <button className="btn btn-secondary" onClick={addPlayer}>
            + Добавить игрока
          </button>
        )}
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ fontSize: 13, fontWeight: 500, marginBottom: 10, display: "block", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.03em" }}>
          Локации ({totalLocations} шт.)
        </label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {LOCATION_PACKS.map((pack) => (
            <button
              key={pack.id}
              onClick={() => togglePack(pack.id)}
              style={{
                padding: "10px 16px",
                borderRadius: "var(--radius-sm)",
                border: selectedPacks.has(pack.id)
                  ? "1px solid var(--accent-gold)"
                  : "1px solid var(--border-glass)",
                background: selectedPacks.has(pack.id)
                  ? "var(--accent-gold-soft)"
                  : "var(--bg-glass)",
                color: selectedPacks.has(pack.id)
                  ? "var(--accent-gold)"
                  : "var(--text-secondary)",
                fontSize: 14,
                fontWeight: 500,
                cursor: "pointer",
                fontFamily: "inherit",
                transition: "all 0.2s",
                boxShadow: selectedPacks.has(pack.id)
                  ? "0 0 20px rgba(212, 168, 67, 0.1)"
                  : "none",
              }}
            >
              {pack.emoji} {pack.name}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
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
                onClick={() => setTimerMinutes(Math.min(15, timerMinutes + 1))}
              >
                +
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="spacer" />

      <div className="bottom-actions">
        <button
          className="btn btn-primary"
          disabled={!canStart}
          onClick={handleStart}
        >
          Начать игру ({validNames.length} игроков)
        </button>
      </div>
    </div>
  );
}
