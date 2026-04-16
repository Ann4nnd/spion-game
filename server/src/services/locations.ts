import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function getLocationPacks() {
  const packs = await prisma.locationPack.findMany({
    include: { locations: true },
    orderBy: { isDefault: "desc" },
  });

  return packs.map((pack) => ({
    id: pack.id,
    name: pack.name,
    isDefault: pack.isDefault,
    locations: pack.locations.map((l) => l.name),
  }));
}

export async function getAllLocations() {
  const locations = await prisma.location.findMany({
    where: { pack: { isDefault: true } },
  });
  return locations.map((l) => l.name);
}
