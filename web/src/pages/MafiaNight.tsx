import { useState } from "react";
import { getTelegram } from "../hooks/useTelegram.js";
import { ROLE_INFO, type MafiaGameState } from "../hooks/useMafiaGame.js";

interface Props {
  state: MafiaGameState;
  onDone: (mafiaTarget: number, doctorTarget: number | null) => void;
}

type Phase = "intro" | "mafia-handoff" | "mafia-action" | "doctor-handoff" | "doctor-action" | "cop-handoff" | "cop-action" | "cop-result" | "done";

export function MafiaNight({ state, onDone }: Props) {
  const haptic = getTelegram()?.HapticFeedback;
  const { players, settings } = state;

  const mafiaPlayers = players.filter((p) => p.role === "mafia" && p.alive);
  const doctorPlayer = players.find((p) => p.role === "doctor" && p.alive);
  const copPlayer = players.find((p) => p.role === "cop" && p.alive);

  const [phase, setPhase] = useState<Phase>("intro");
  const [mafiaTarget, setMafiaTarget] = useState<number | null>(null);
  const [doctorTarget, setDoctorTarget] = useState<number | null>(null);
  const [copTarget, setCopTarget] = useState<number | null>(null);
  const [selected, setSelected] = useState<number | null>(null);

  const alivePlayers = players
    .map((p, i) => ({ ...p, idx: i }))
    .filter((p) => p.alive);

  const handleNext = () => {
    haptic?.impactOccurred("medium");
    if (phase === "intro") {
      setPhase("mafia-handoff");
    } else if (phase === "mafia-handoff") {
      setPhase("mafia-action");
      setSelected(null);
    } else if (phase === "mafia-action") {
      if (selected === null) return;
      setMafiaTarget(selected);
      if (doctorPlayer) setPhase("doctor-handoff");
      else if (copPlayer) setPhase("cop-handoff");
      else setPhase("done");
    } else if (phase === "doctor-handoff") {
      setPhase("doctor-action");
      setSelected(null);
    } else if (phase === "doctor-action") {
      setDoctorTarget(selected);
      if (copPlayer) setPhase("cop-handoff");
      else setPhase("done");
    } else if (phase === "cop-handoff") {
      setPhase("cop-action");
      setSelected(null);
    } else if (phase === "cop-action") {
      if (selected === null) return;
      setCopTarget(selected);
      setPhase("cop-result");
    } else if (phase === "cop-result") {
      setPhase("done");
    } else if (phase === "done") {
      onDone(mafiaTarget!, doctorTarget);
    }
  };

  // Intro
  if (phase === "intro") {
    return (
      <div className="page">
        <div className="reveal-container">
          <div style={{ fontSize: 64 }}>🌙</div>
          <h2 className="page-title">Ночь {state.round}</h2>
          <p className="page-subtitle">Город засыпает... Город просыпается ночью.</p>
          <button className="btn btn-primary" onClick={handleNext}>
            Начать ночь
          </button>
        </div>
      </div>
    );
  }

  // Mafia handoff
  if (phase === "mafia-handoff") {
    return (
      <div className="page">
        <div className="reveal-container">
          <div style={{ fontSize: 48 }}>🤫</div>
          <h2 className="page-title">
            {mafiaPlayers.length === 1 ? "Мафия, проснись" : "Мафия, просыпайтесь"}
          </h2>
          <p style={{ fontSize: 18, fontWeight: 500, color: "var(--text-secondary)" }}>
            {mafiaPlayers.map((p) => p.name).join(", ")}
          </p>
          <p className="page-subtitle">Передайте телефон мафии</p>
          <button className="btn btn-primary" onClick={handleNext}>
            Мы мафия — продолжить
          </button>
        </div>
      </div>
    );
  }

  // Mafia action — pick victim
  if (phase === "mafia-action") {
    const targets = alivePlayers.filter((p) => p.role !== "mafia");
    return (
      <div className="page">
        <h1 className="page-title">🔫 Выбери жертву</h1>
        <p className="page-subtitle">Кого убить этой ночью?</p>
        <div className="vote-grid">
          {targets.map((p) => (
            <button
              key={p.idx}
              className={`vote-option ${selected === p.idx ? "selected" : ""}`}
              onClick={() => { setSelected(p.idx); haptic?.selectionChanged(); }}
            >
              {p.name}
            </button>
          ))}
        </div>
        <div className="spacer" />
        <div className="bottom-actions">
          <button className="btn btn-primary" disabled={selected === null} onClick={handleNext}>
            Подтвердить
          </button>
        </div>
      </div>
    );
  }

  // Doctor handoff
  if (phase === "doctor-handoff") {
    return (
      <div className="page">
        <div className="reveal-container">
          <div style={{ fontSize: 48 }}>🤫</div>
          <h2 className="page-title">Доктор, проснись</h2>
          <p style={{ fontSize: 18, fontWeight: 500 }}>{doctorPlayer!.name}</p>
          <p className="page-subtitle">Передайте телефон доктору</p>
          <button className="btn btn-primary" onClick={handleNext}>
            Я доктор — продолжить
          </button>
        </div>
      </div>
    );
  }

  // Doctor action
  if (phase === "doctor-action") {
    return (
      <div className="page">
        <h1 className="page-title">⚕️ Кого спасти?</h1>
        <p className="page-subtitle">Можно лечить себя</p>
        <div className="vote-grid">
          {alivePlayers.map((p) => (
            <button
              key={p.idx}
              className={`vote-option ${selected === p.idx ? "selected" : ""}`}
              onClick={() => { setSelected(p.idx); haptic?.selectionChanged(); }}
            >
              {p.name}
            </button>
          ))}
        </div>
        <div className="spacer" />
        <div className="bottom-actions">
          <button className="btn btn-primary" onClick={handleNext}>
            {selected !== null ? "Подтвердить" : "Никого не лечить"}
          </button>
        </div>
      </div>
    );
  }

  // Cop handoff
  if (phase === "cop-handoff") {
    return (
      <div className="page">
        <div className="reveal-container">
          <div style={{ fontSize: 48 }}>🤫</div>
          <h2 className="page-title">Комиссар, проснись</h2>
          <p style={{ fontSize: 18, fontWeight: 500 }}>{copPlayer!.name}</p>
          <p className="page-subtitle">Передайте телефон комиссару</p>
          <button className="btn btn-primary" onClick={handleNext}>
            Я комиссар — продолжить
          </button>
        </div>
      </div>
    );
  }

  // Cop action
  if (phase === "cop-action") {
    const targets = alivePlayers.filter((p) => p.idx !== players.findIndex((x) => x === copPlayer));
    return (
      <div className="page">
        <h1 className="page-title">🕵️ Кого проверить?</h1>
        <p className="page-subtitle">Узнаешь, мафия или нет</p>
        <div className="vote-grid">
          {targets.map((p) => (
            <button
              key={p.idx}
              className={`vote-option ${selected === p.idx ? "selected" : ""}`}
              onClick={() => { setSelected(p.idx); haptic?.selectionChanged(); }}
            >
              {p.name}
            </button>
          ))}
        </div>
        <div className="spacer" />
        <div className="bottom-actions">
          <button className="btn btn-primary" disabled={selected === null} onClick={handleNext}>
            Проверить
          </button>
        </div>
      </div>
    );
  }

  // Cop result
  if (phase === "cop-result") {
    const target = players[copTarget!];
    const isMafia = target.role === "mafia";
    return (
      <div className="page">
        <div className="reveal-container">
          <div className={`role-card ${isMafia ? "mafia" : "villager"}`}>
            <div className="role-emoji">{isMafia ? "🔫" : "👤"}</div>
            <div className="role-title">{target.name}</div>
            <div className="role-location">
              {isMafia ? "Это мафия!" : "Не мафия"}
            </div>
          </div>
          <button className="btn btn-primary" onClick={handleNext}>
            Понял, скрыть
          </button>
        </div>
      </div>
    );
  }

  // Done — wake up city
  return (
    <div className="page">
      <div className="reveal-container">
        <div style={{ fontSize: 64 }}>🌅</div>
        <h2 className="page-title">Город засыпает...</h2>
        <p className="page-subtitle">Теперь все проснутся</p>
        <button className="btn btn-primary" onClick={handleNext}>
          Город просыпается
        </button>
      </div>
    </div>
  );
}
