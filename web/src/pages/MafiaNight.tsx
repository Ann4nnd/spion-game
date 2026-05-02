import { useState, useEffect, useRef } from "react";
import { getTelegram } from "../hooks/useTelegram.js";
import {
  speak,
  stopSpeaking,
  setNarratorMuted,
  isNarratorMuted,
  primeNarrator,
} from "../hooks/useNarrator.js";
import { type MafiaGameState } from "../hooks/useMafiaGame.js";

interface Props {
  state: MafiaGameState;
  onDone: (mafiaTarget: number, doctorTarget: number | null) => void;
}

type Phase =
  | "intro"
  | "calling-mafia"
  | "mafia-action"
  | "mafia-sleep"
  | "calling-doctor"
  | "doctor-action"
  | "doctor-sleep"
  | "calling-cop"
  | "cop-action"
  | "cop-result"
  | "cop-sleep"
  | "city-wakes";

export function MafiaNight({ state, onDone }: Props) {
  const haptic = getTelegram()?.HapticFeedback;
  const { players } = state;

  const doctorPlayer = players.find((p) => p.role === "doctor" && p.alive);
  const copPlayer = players.find((p) => p.role === "cop" && p.alive);
  const copIndex = players.findIndex((p) => p.role === "cop" && p.alive);

  const [phase, setPhase] = useState<Phase>("intro");
  const [mafiaTarget, setMafiaTarget] = useState<number | null>(null);
  const [doctorTarget, setDoctorTarget] = useState<number | null>(null);
  const [copTarget, setCopTarget] = useState<number | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [muted, setMuted] = useState(isNarratorMuted());
  const [countdown, setCountdown] = useState(0);

  const alivePlayers = players
    .map((p, i) => ({ ...p, idx: i }))
    .filter((p) => p.alive);

  // Narration triggers per phase
  const narrationDoneRef = useRef(false);
  useEffect(() => {
    narrationDoneRef.current = false;
    let cancelled = false;
    const run = async () => {
      const phrase = phaseNarration(phase);
      if (phrase) await speak(phrase);
      if (!cancelled) narrationDoneRef.current = true;
    };
    run();
    return () => {
      cancelled = true;
      stopSpeaking();
    };
  }, [phase]);

  // Auto-advance for sleep / wake phases
  useEffect(() => {
    if (
      phase === "mafia-sleep" ||
      phase === "doctor-sleep" ||
      phase === "cop-sleep"
    ) {
      setCountdown(3);
      const interval = setInterval(() => {
        setCountdown((c) => {
          if (c <= 1) {
            clearInterval(interval);
            advance();
            return 0;
          }
          return c - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [phase]);

  const advance = () => {
    haptic?.impactOccurred("light");
    setSelected(null);
    if (phase === "intro") {
      primeNarrator();
      setPhase("calling-mafia");
    } else if (phase === "calling-mafia") {
      setPhase("mafia-action");
    } else if (phase === "mafia-action") {
      if (selected === null) return;
      setMafiaTarget(selected);
      setPhase("mafia-sleep");
    } else if (phase === "mafia-sleep") {
      if (doctorPlayer) setPhase("calling-doctor");
      else if (copPlayer) setPhase("calling-cop");
      else setPhase("city-wakes");
    } else if (phase === "calling-doctor") {
      setPhase("doctor-action");
    } else if (phase === "doctor-action") {
      setDoctorTarget(selected);
      setPhase("doctor-sleep");
    } else if (phase === "doctor-sleep") {
      if (copPlayer) setPhase("calling-cop");
      else setPhase("city-wakes");
    } else if (phase === "calling-cop") {
      setPhase("cop-action");
    } else if (phase === "cop-action") {
      if (selected === null) return;
      setCopTarget(selected);
      setPhase("cop-result");
    } else if (phase === "cop-result") {
      setPhase("cop-sleep");
    } else if (phase === "cop-sleep") {
      setPhase("city-wakes");
    } else if (phase === "city-wakes") {
      onDone(mafiaTarget!, doctorTarget);
    }
  };

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    setNarratorMuted(next);
  };

  const muteButton = (
    <button
      onClick={toggleMute}
      style={{
        position: "absolute",
        top: 16,
        right: 16,
        background: "var(--bg-glass)",
        border: "1px solid var(--border-glass)",
        borderRadius: 20,
        padding: "8px 12px",
        color: "var(--text-secondary)",
        fontSize: 14,
        cursor: "pointer",
        zIndex: 10,
      }}
    >
      {muted ? "🔇" : "🔊"}
    </button>
  );

  // ===== PHASE: INTRO =====
  if (phase === "intro") {
    return (
      <div className="page" style={{ position: "relative" }}>
        {muteButton}
        <div className="reveal-container">
          <div style={{ fontSize: 64 }}>🌙</div>
          <h2 className="page-title">Ночь {state.round}</h2>
          <p className="page-subtitle" style={{ maxWidth: 320 }}>
            Положите телефон на стол. Все закрывают глаза.
            <br />
            Голос будет вызывать роли.
          </p>
          <button className="btn btn-primary" onClick={advance}>
            Все готовы — начать
          </button>
        </div>
      </div>
    );
  }

  // ===== PHASE: CALLING [ROLE] — voice plays, button waits =====
  if (
    phase === "calling-mafia" ||
    phase === "calling-doctor" ||
    phase === "calling-cop"
  ) {
    const info = callingInfo(phase);
    return (
      <div className="page" style={{ position: "relative" }}>
        {muteButton}
        <div className="reveal-container">
          <div style={{ fontSize: 80 }}>{info.emoji}</div>
          <h2 className="page-title">{info.title}</h2>
          <p className="page-subtitle">{info.subtitle}</p>
          <button className="btn btn-primary" onClick={advance}>
            {info.button}
          </button>
        </div>
      </div>
    );
  }

  // ===== PHASE: MAFIA ACTION =====
  if (phase === "mafia-action") {
    const targets = alivePlayers.filter((p) => p.role !== "mafia");
    return (
      <div className="page" style={{ position: "relative" }}>
        {muteButton}
        <h1 className="page-title">🔫 Выбери жертву</h1>
        <p className="page-subtitle">Кого мафия убивает этой ночью?</p>
        <div className="vote-grid">
          {targets.map((p) => (
            <button
              key={p.idx}
              className={`vote-option ${selected === p.idx ? "selected" : ""}`}
              onClick={() => {
                setSelected(p.idx);
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
            disabled={selected === null}
            onClick={advance}
          >
            Подтвердить
          </button>
        </div>
      </div>
    );
  }

  // ===== PHASE: DOCTOR ACTION =====
  if (phase === "doctor-action") {
    return (
      <div className="page" style={{ position: "relative" }}>
        {muteButton}
        <h1 className="page-title">⚕️ Кого спасти?</h1>
        <p className="page-subtitle">Можно вылечить себя</p>
        <div className="vote-grid">
          {alivePlayers.map((p) => (
            <button
              key={p.idx}
              className={`vote-option ${selected === p.idx ? "selected" : ""}`}
              onClick={() => {
                setSelected(p.idx);
                haptic?.selectionChanged();
              }}
            >
              {p.name}
            </button>
          ))}
        </div>
        <div className="spacer" />
        <div className="bottom-actions">
          <button className="btn btn-primary" onClick={advance}>
            {selected !== null ? "Подтвердить" : "Никого не лечить"}
          </button>
        </div>
      </div>
    );
  }

  // ===== PHASE: COP ACTION =====
  if (phase === "cop-action") {
    const targets = alivePlayers.filter((p) => p.idx !== copIndex);
    return (
      <div className="page" style={{ position: "relative" }}>
        {muteButton}
        <h1 className="page-title">🕵️ Кого проверить?</h1>
        <p className="page-subtitle">Узнаешь, мафия или нет</p>
        <div className="vote-grid">
          {targets.map((p) => (
            <button
              key={p.idx}
              className={`vote-option ${selected === p.idx ? "selected" : ""}`}
              onClick={() => {
                setSelected(p.idx);
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
            disabled={selected === null}
            onClick={advance}
          >
            Проверить
          </button>
        </div>
      </div>
    );
  }

  // ===== PHASE: COP RESULT =====
  if (phase === "cop-result") {
    const target = players[copTarget!];
    const isMafia = target.role === "mafia";
    return (
      <div className="page" style={{ position: "relative" }}>
        {muteButton}
        <div className="reveal-container">
          <div className={`role-card ${isMafia ? "mafia" : "villager"}`}>
            <div className="role-emoji">{isMafia ? "🔫" : "👤"}</div>
            <div className="role-title">{target.name}</div>
            <div className="role-location">
              {isMafia ? "Это мафия!" : "Не мафия"}
            </div>
          </div>
          <button className="btn btn-primary" onClick={advance}>
            Понял, скрыть
          </button>
        </div>
      </div>
    );
  }

  // ===== PHASE: SLEEP (auto-advance) =====
  if (
    phase === "mafia-sleep" ||
    phase === "doctor-sleep" ||
    phase === "cop-sleep"
  ) {
    return (
      <div className="page" style={{ position: "relative" }}>
        {muteButton}
        <div className="reveal-container">
          <div style={{ fontSize: 80 }}>📵</div>
          <h2 className="page-title">Положи телефон</h2>
          <p className="page-subtitle">Закрой глаза. Голос вызовет следующую роль.</p>
          <div
            style={{
              fontSize: 64,
              fontWeight: 700,
              fontFamily: "JetBrains Mono, monospace",
              color: "var(--accent-gold)",
            }}
          >
            {countdown}
          </div>
        </div>
      </div>
    );
  }

  // ===== PHASE: CITY WAKES =====
  return (
    <div className="page" style={{ position: "relative" }}>
      {muteButton}
      <div className="reveal-container">
        <div style={{ fontSize: 80 }}>🌅</div>
        <h2 className="page-title">Город просыпается</h2>
        <p className="page-subtitle">Все открывают глаза</p>
        <button className="btn btn-primary" onClick={advance}>
          Продолжить
        </button>
      </div>
    </div>
  );
}

// ===== Helpers =====

function phaseNarration(phase: Phase): string | null {
  switch (phase) {
    case "calling-mafia":
      return "Мафия, просыпается";
    case "mafia-sleep":
      return "Мафия засыпает";
    case "calling-doctor":
      return "Доктор, просыпается";
    case "doctor-sleep":
      return "Доктор засыпает";
    case "calling-cop":
      return "Комиссар, просыпается";
    case "cop-sleep":
      return "Комиссар засыпает";
    case "city-wakes":
      return "Город просыпается";
    default:
      return null;
  }
}

function callingInfo(phase: Phase) {
  if (phase === "calling-mafia")
    return {
      emoji: "🔫",
      title: "Мафия, просыпайся",
      subtitle: "Только мафия открывает глаза. Возьми телефон.",
      button: "Я мафия — продолжить",
    };
  if (phase === "calling-doctor")
    return {
      emoji: "⚕️",
      title: "Доктор, просыпайся",
      subtitle: "Только доктор открывает глаза. Возьми телефон.",
      button: "Я доктор — продолжить",
    };
  return {
    emoji: "🕵️",
    title: "Комиссар, просыпайся",
    subtitle: "Только комиссар открывает глаза. Возьми телефон.",
    button: "Я комиссар — продолжить",
  };
}
