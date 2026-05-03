import { useState, useEffect, useCallback } from "react";
import { getTelegram } from "../hooks/useTelegram.js";
import { getTodayWord, isValidWord } from "../data/wordList.js";

interface Props {
  onBack: () => void;
}

type Status = "playing" | "won" | "lost";
type LetterStatus = "correct" | "present" | "absent" | "empty";

const ROWS = 6;
const COLS = 5;

// Russian QWERTY layout
const KEYBOARD_ROWS = [
  ["й", "ц", "у", "к", "е", "н", "г", "ш", "щ", "з", "х", "ъ"],
  ["ф", "ы", "в", "а", "п", "р", "о", "л", "д", "ж", "э"],
  ["ENTER", "я", "ч", "с", "м", "и", "т", "ь", "б", "ю", "DEL"],
];

function evaluateGuess(guess: string, target: string): LetterStatus[] {
  const result: LetterStatus[] = Array(COLS).fill("absent");
  const targetChars = target.split("");
  const guessChars = guess.split("");
  const used = Array(COLS).fill(false);

  // Pass 1: greens
  for (let i = 0; i < COLS; i++) {
    if (guessChars[i] === targetChars[i]) {
      result[i] = "correct";
      used[i] = true;
    }
  }
  // Pass 2: yellows
  for (let i = 0; i < COLS; i++) {
    if (result[i] === "correct") continue;
    for (let j = 0; j < COLS; j++) {
      if (!used[j] && guessChars[i] === targetChars[j]) {
        result[i] = "present";
        used[j] = true;
        break;
      }
    }
  }
  return result;
}

function makeShareGrid(guesses: string[], target: string): string {
  return guesses
    .map((g) =>
      evaluateGuess(g, target)
        .map((s) => (s === "correct" ? "🟩" : s === "present" ? "🟨" : "⬛"))
        .join("")
    )
    .join("\n");
}

export function WordOfDay({ onBack }: Props) {
  const haptic = getTelegram()?.HapticFeedback;
  const { word, dayIndex } = getTodayWord();
  const storageKey = `wod-${dayIndex}`;

  const [guesses, setGuesses] = useState<string[]>([]);
  const [current, setCurrent] = useState("");
  const [status, setStatus] = useState<Status>("playing");
  const [shake, setShake] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Load saved state
  useEffect(() => {
    const tg = getTelegram();
    tg?.BackButton.show();
    const handler = () => onBack();
    tg?.BackButton.onClick(handler);

    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        setGuesses(parsed.guesses || []);
        setStatus(parsed.status || "playing");
      }
    } catch {}

    return () => tg?.BackButton.offClick(handler);
  }, [onBack, storageKey]);

  // Save state
  useEffect(() => {
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({ guesses, status })
      );
    } catch {}
  }, [guesses, status, storageKey]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 1800);
  };

  const handleKey = useCallback(
    (key: string) => {
      if (status !== "playing") return;
      if (key === "DEL") {
        setCurrent((c) => c.slice(0, -1));
        haptic?.selectionChanged();
      } else if (key === "ENTER") {
        if (current.length !== COLS) {
          setShake(true);
          setTimeout(() => setShake(false), 400);
          haptic?.notificationOccurred("error");
          showToast("Нужно 5 букв");
          return;
        }
        if (!isValidWord(current)) {
          setShake(true);
          setTimeout(() => setShake(false), 400);
          haptic?.notificationOccurred("error");
          showToast("Только русские буквы");
          return;
        }
        const newGuesses = [...guesses, current];
        setGuesses(newGuesses);
        setCurrent("");
        haptic?.impactOccurred("light");

        if (current === word) {
          setStatus("won");
          haptic?.notificationOccurred("success");
        } else if (newGuesses.length >= ROWS) {
          setStatus("lost");
          haptic?.notificationOccurred("error");
        }
      } else if (current.length < COLS && /^[а-я]$/.test(key)) {
        setCurrent((c) => c + key);
        haptic?.selectionChanged();
      }
    },
    [current, guesses, status, word, haptic]
  );

  // Physical keyboard support (desktop + when keyboard visible on mobile)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Backspace") handleKey("DEL");
      else if (e.key === "Enter") handleKey("ENTER");
      else {
        const key = e.key.toLowerCase().replace("ё", "е");
        if (/^[а-я]$/.test(key)) handleKey(key);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleKey]);

  // Compute key statuses (best status across all guesses)
  const keyStatuses: Record<string, LetterStatus> = {};
  for (const g of guesses) {
    const evals = evaluateGuess(g, word);
    for (let i = 0; i < COLS; i++) {
      const letter = g[i];
      const s = evals[i];
      const cur = keyStatuses[letter];
      if (cur === "correct") continue;
      if (cur === "present" && s !== "correct") continue;
      keyStatuses[letter] = s;
    }
  }

  const handleShare = () => {
    const grid = makeShareGrid(guesses, word);
    const score = status === "won" ? `${guesses.length}/6` : "X/6";
    const text = `Слово #${dayIndex} ${score}\n\n${grid}\n\nt.me/spionpartygame_bot`;

    const tg = getTelegram() as any;
    if (tg?.shareText) {
      tg.shareText(text);
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        showToast("Скопировано!");
      });
    } else {
      showToast(text);
    }
    haptic?.impactOccurred("medium");
  };

  return (
    <div className="page wod-page">
      <h1 className="page-title">Слово дня</h1>
      <p className="page-subtitle">№{dayIndex} · {ROWS} попыток</p>

      <div className={`wod-grid ${shake ? "shake" : ""}`}>
        {Array.from({ length: ROWS }).map((_, rowIdx) => {
          const isCurrent = rowIdx === guesses.length && status === "playing";
          const guess = guesses[rowIdx] ?? (isCurrent ? current : "");
          const evaluated = guesses[rowIdx]
            ? evaluateGuess(guesses[rowIdx], word)
            : null;

          return (
            <div className="wod-row" key={rowIdx}>
              {Array.from({ length: COLS }).map((_, colIdx) => {
                const letter = guess[colIdx] ?? "";
                let cls = "wod-cell";
                if (evaluated) cls += " " + evaluated[colIdx];
                else if (letter) cls += " filled";
                return (
                  <div className={cls} key={colIdx}>
                    {letter.toUpperCase()}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {status !== "playing" && (
        <div className="wod-result">
          <div className="wod-result-title">
            {status === "won" ? "🎉 Победа!" : "😔 Не угадала"}
          </div>
          <div className="wod-result-word">
            Слово: <strong>{word.toUpperCase()}</strong>
          </div>
          <button className="btn btn-primary" onClick={handleShare}>
            Поделиться результатом
          </button>
        </div>
      )}

      <div className="wod-keyboard">
        {KEYBOARD_ROWS.map((row, ri) => (
          <div className="wod-key-row" key={ri}>
            {row.map((key) => {
              const isWide = key === "ENTER" || key === "DEL";
              const stat = keyStatuses[key];
              let cls = "wod-key";
              if (isWide) cls += " wide";
              if (stat) cls += " " + stat;
              return (
                <button
                  key={key}
                  className={cls}
                  onClick={() => handleKey(key)}
                >
                  {key === "ENTER" ? "↵" : key === "DEL" ? "⌫" : key.toUpperCase()}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {toast && <div className="wod-toast">{toast}</div>}
    </div>
  );
}
