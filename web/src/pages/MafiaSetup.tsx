import { useState, useEffect } from "react";
import { getTelegram } from "../hooks/useTelegram.js";
import { setupMafiaGame, type MafiaGameState } from "../hooks/useMafiaGame.js";

interface Props {
  initialNames?: string[];
  onStart: (state: MafiaGameState) => void;
  onBack: () => void;
}

export function MafiaSetup({ initialNames, onStart, onBack }: Props) {
  const [names, setNames] = useState<string[]>(initialNames ?? [""]);
  const [mafiaCount, setMafiaCount] = useState(1);
  const [hasDoctor, setHasDoctor] = useState(true);
  const [hasCop, setHasCop] = useState(true);
  const [timerEnabled, setTimerEnabled] = useState(true);
  const [timerMinutes, setTimerMinutes] = useState(3);

  useEffect(() => {
    const tg = getTelegram();
    tg?.BackButton.show();
    const handler = () => onBack();
    tg?.BackButton.onClick(handler);
    return () => tg?.BackButton.offClick(handler);
  }, [onBack]);

  const addPlayer = () => {
    if (names.length < 14) setNames([...names, ""]);
  };
  const removePlayer = (idx: number) => {
    if (names.length > 1) setNames(names.filter((_, i) => i !== idx));
  };
  const updateName = (idx: number, value: string) => {
    const updated = [...names];
    updated[idx] = value;
    setNames(updated);
  };

  const validNames = names.filter((n) => n.trim().length > 0);
  const specialRoles = (hasDoctor ? 1 : 0) + (hasCop ? 1 : 0);
  const minPlayers = mafiaCount + specialRoles + 1;
  const canStart = validNames.length >= Math.max(4, minPlayers);

  const handleStart = () => {
    const state = setupMafiaGame(validNames, {
      mafiaCount,
      hasDoctor,
      hasCop,
      timerSeconds: timerEnabled ? timerMinutes * 60 : null,
    });
    onStart(state);
  };

  return (
    <div className="page">
      <h1 className="page-title">Мафия</h1>
      <p className="page-subtitle">Минимум 4 игрока</p>

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
        {names.length < 14 && (
          <button className="btn btn-secondary" onClick={addPlayer}>
            + Добавить игрока
          </button>
        )}
      </div>

      <div style={{ marginBottom: 16 }}>
        <div className="setting-row">
          <span className="setting-label">🔫 Мафии</span>
          <div className="setting-value">
            <button className="stepper-btn" onClick={() => setMafiaCount(Math.max(1, mafiaCount - 1))}>−</button>
            <span className="stepper-value">{mafiaCount}</span>
            <button className="stepper-btn" onClick={() => setMafiaCount(Math.min(3, mafiaCount + 1))}>+</button>
          </div>
        </div>

        <div className="setting-row">
          <span className="setting-label">⚕️ Доктор</span>
          <button className={`toggle ${hasDoctor ? "active" : ""}`} onClick={() => setHasDoctor(!hasDoctor)} />
        </div>

        <div className="setting-row">
          <span className="setting-label">🕵️ Комиссар</span>
          <button className={`toggle ${hasCop ? "active" : ""}`} onClick={() => setHasCop(!hasCop)} />
        </div>

        <div className="setting-row">
          <span className="setting-label">⏱ Таймер дня</span>
          <button className={`toggle ${timerEnabled ? "active" : ""}`} onClick={() => setTimerEnabled(!timerEnabled)} />
        </div>

        {timerEnabled && (
          <div className="setting-row">
            <span className="setting-label">Минуты</span>
            <div className="setting-value">
              <button className="stepper-btn" onClick={() => setTimerMinutes(Math.max(1, timerMinutes - 1))}>−</button>
              <span className="stepper-value">{timerMinutes}</span>
              <button className="stepper-btn" onClick={() => setTimerMinutes(Math.min(10, timerMinutes + 1))}>+</button>
            </div>
          </div>
        )}
      </div>

      <div className="spacer" />

      <div className="bottom-actions">
        <button className="btn btn-primary" disabled={!canStart} onClick={handleStart}>
          Начать игру ({validNames.length} игроков)
        </button>
      </div>
    </div>
  );
}
