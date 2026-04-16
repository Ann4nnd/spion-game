export interface LocalPlayer {
  name: string;
  role: "spy" | "citizen";
}

const DEFAULT_LOCATIONS = [
  "Больница", "Банк", "Пляж", "Ресторан", "Школа",
  "Супермаркет", "Кинотеатр", "Аэропорт", "Библиотека",
  "Зоопарк", "Цирк", "Полицейский участок", "Казино",
  "Отель", "Музей", "Стадион", "Церковь", "Тренажёрный зал",
  "Парикмахерская", "Автосервис", "Космическая станция",
  "Подводная лодка", "Пиратский корабль", "Замок",
  "Необитаемый остров", "Поезд", "Круизный лайнер",
  "Посольство", "Военная база", "Офис", "Парк",
  "Рынок", "Почта", "Аптека", "Заправка", "Свадьба",
];

export function setupLocalGame(
  playerNames: string[],
  spyCount: number
): { players: LocalPlayer[]; location: string } {
  const location =
    DEFAULT_LOCATIONS[Math.floor(Math.random() * DEFAULT_LOCATIONS.length)];

  const indices = playerNames.map((_, i) => i);
  // Shuffle to pick spies
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  const spyIndices = new Set(indices.slice(0, spyCount));

  const players: LocalPlayer[] = playerNames.map((name, i) => ({
    name,
    role: spyIndices.has(i) ? "spy" : "citizen",
  }));

  return { players, location };
}
