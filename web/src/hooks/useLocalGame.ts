export interface LocalPlayer {
  name: string;
  role: "spy" | "citizen";
}

export interface LocationPack {
  id: string;
  name: string;
  emoji: string;
  locations: string[];
}

export const LOCATION_PACKS: LocationPack[] = [
  {
    id: "classic",
    name: "Классические",
    emoji: "🏛️",
    locations: [
      "Больница", "Банк", "Пляж", "Ресторан", "Школа",
      "Супермаркет", "Кинотеатр", "Аэропорт", "Библиотека",
      "Зоопарк", "Цирк", "Полицейский участок", "Казино",
      "Отель", "Музей", "Стадион", "Церковь", "Тренажёрный зал",
      "Парикмахерская", "Автосервис",
    ],
  },
  {
    id: "adventure",
    name: "Приключения",
    emoji: "🗺️",
    locations: [
      "Космическая станция", "Подводная лодка", "Пиратский корабль",
      "Замок", "Необитаемый остров", "Круизный лайнер", "Посольство",
      "Военная база", "Антарктическая станция", "Вулкан",
      "Затерянный храм", "Подземный бункер", "Маяк",
      "Нефтяная платформа", "Воздушный шар",
    ],
  },
  {
    id: "everyday",
    name: "Повседневные",
    emoji: "🏙️",
    locations: [
      "Офис", "Парк", "Рынок", "Почта", "Аптека",
      "Заправка", "Свадьба", "Автобус", "Прачечная",
      "Детский сад", "Фитнес-клуб", "Торговый центр",
      "Кофейня", "Барбершоп", "Автомойка",
    ],
  },
  {
    id: "fantasy",
    name: "Фантастика",
    emoji: "🔮",
    locations: [
      "Школа магии", "Драконье логово", "Эльфийский лес",
      "Подземелье", "Летающий остров", "Башня волшебника",
      "Зачарованное озеро", "Тронный зал", "Таверна авантюристов",
      "Арена гладиаторов", "Портал между мирами", "Кладбище призраков",
      "Кузница гномов", "Храм древних богов", "Логово вампира",
    ],
  },
  {
    id: "pop",
    name: "Поп-культура",
    emoji: "🎬",
    locations: [
      "Хогвартс", "Звезда Смерти", "Матрица", "Готэм-сити",
      "Район 51", "Парк Юрского периода", "Хоббитон",
      "Щ.И.Т. штаб-квартира", "Бэтпещера", "Нарния",
      "Аркхэм", "Татуин", "Мордор", "Вестерос", "Спрингфилд",
    ],
  },
];

export function setupLocalGame(
  playerNames: string[],
  spyCount: number,
  selectedPackIds?: string[]
): { players: LocalPlayer[]; location: string } {
  // Collect locations from selected packs (or all if none selected)
  const packs = selectedPackIds && selectedPackIds.length > 0
    ? LOCATION_PACKS.filter((p) => selectedPackIds.includes(p.id))
    : LOCATION_PACKS;

  const allLocations = packs.flatMap((p) => p.locations);
  const location = allLocations[Math.floor(Math.random() * allLocations.length)];

  const indices = playerNames.map((_, i) => i);
  // Fisher-Yates shuffle
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
