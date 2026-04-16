import { useEffect } from "react";
import { getTelegram } from "../hooks/useTelegram.js";

interface Props {
  onLocal: () => void;
  onOnline: () => void;
}

export function Home({ onLocal, onOnline }: Props) {
  useEffect(() => {
    const tg = getTelegram();
    tg?.ready();
    tg?.expand();
    tg?.BackButton.hide();
  }, []);

  return (
    <div className="page">
      <div style={{ textAlign: "center", margin: "32px 0 16px" }}>
        <div style={{ fontSize: 64 }}>🕵️</div>
      </div>
      <h1 className="page-title">Шпион</h1>
      <p className="page-subtitle">
        Найди шпиона среди своих друзей!
      </p>

      <div className="card mode-card" onClick={onOnline}>
        <div className="mode-icon">🌐</div>
        <div className="card-title">Онлайн</div>
        <div className="card-text">
          Каждый играет на своём устройстве. Роли приходят приватно.
        </div>
      </div>

      <div className="card mode-card" onClick={onLocal}>
        <div className="mode-icon">📱</div>
        <div className="card-title">Одно устройство</div>
        <div className="card-text">
          Передавайте телефон по кругу. Каждый смотрит свою роль.
        </div>
      </div>
    </div>
  );
}
