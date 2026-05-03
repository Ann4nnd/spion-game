import { useEffect } from "react";
import { getTelegram } from "../hooks/useTelegram.js";

interface Props {
  onSpy: () => void;
  onMafia: () => void;
  onWordOfDay: () => void;
}

export function Home({ onSpy, onMafia, onWordOfDay }: Props) {
  useEffect(() => {
    const tg = getTelegram();
    tg?.ready();
    tg?.expand();
    tg?.BackButton.hide();
  }, []);

  return (
    <div className="page">
      <div style={{ textAlign: "center", margin: "24px 0 8px" }}>
        <div style={{ fontSize: 56 }}>🎭</div>
      </div>
      <h1 className="page-title">Пати Геймс</h1>
      <p className="page-subtitle">Игры для компании в Telegram</p>

      <div className="card mode-card" onClick={onSpy}>
        <div className="mode-icon">🕵️</div>
        <div className="card-title">Шпион</div>
        <div className="card-text">
          Найди шпиона среди своих друзей. Кто не знает локацию?
        </div>
      </div>

      <div className="card mode-card" onClick={onMafia}>
        <div className="mode-icon">🔫</div>
        <div className="card-title">Мафия</div>
        <div className="card-text">
          Классика! Ночь, день, голосование. Вычисли мафию.
        </div>
      </div>

      <div className="card mode-card" onClick={onWordOfDay}>
        <div className="mode-icon">📝</div>
        <div className="card-title">Слово дня</div>
        <div className="card-text">
          Угадай слово за 6 попыток. Новое слово каждый день.
        </div>
      </div>
    </div>
  );
}
