import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const defaultLocations: Record<string, string[]> = {
  "Классические": [
    "Больница",
    "Банк",
    "Пляж",
    "Ресторан",
    "Школа",
    "Супермаркет",
    "Кинотеатр",
    "Аэропорт",
    "Библиотека",
    "Зоопарк",
    "Цирк",
    "Полицейский участок",
    "Казино",
    "Отель",
    "Музей",
    "Стадион",
    "Церковь",
    "Тренажёрный зал",
    "Парикмахерская",
    "Автосервис",
  ],
  "Необычные места": [
    "Космическая станция",
    "Подводная лодка",
    "Пиратский корабль",
    "Замок",
    "Необитаемый остров",
    "Поезд",
    "Круизный лайнер",
    "Посольство",
    "Военная база",
    "Антарктическая станция",
  ],
  "Повседневные": [
    "Офис",
    "Автобус",
    "Парк",
    "Рынок",
    "Почта",
    "Аптека",
    "Заправка",
    "Прачечная",
    "Детский сад",
    "Свадьба",
  ],
};

async function main() {
  // Clear existing default packs
  await prisma.locationPack.deleteMany({ where: { isDefault: true } });

  for (const [packName, locations] of Object.entries(defaultLocations)) {
    await prisma.locationPack.create({
      data: {
        name: packName,
        isDefault: true,
        locations: {
          create: locations.map((name) => ({ name })),
        },
      },
    });
  }

  console.log("Seeded default location packs");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
