import { useEffect } from "react";
import { getTelegram } from "../hooks/useTelegram.js";

interface Props {
  onLocal: () => void;
  onOnline: () => void;
  onBack: () => void;
}

export function SpyModeChoice({ onLocal, onOnline, onBack }: Props) {
  useEffect(() => {
    const tg = getTelegram();
    tg?.BackButton.show();
    const handler = () => onBack();
    tg?.BackButton.onClick(handler);
    return () => tg?.BackButton.offClick(handler);
  }, [onBack]);

  return (
    <div className="page">
      <div style={{ textAlign: "center", margin: "24px 0 8px" }}>
        <div style={{ fontSize: 56 }}>🕵️</div>
      </div>
      <h1 className="page-title">Шпион</h1>
      <p className="page-subtitle">Выбери режим игры</p>

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
