import type { FastifyInstance } from "fastify";
import * as locationService from "../services/locations.js";

export async function locationRoutes(app: FastifyInstance) {
  app.get("/", async () => {
    return locationService.getLocationPacks();
  });

  app.get("/all", async () => {
    return locationService.getAllLocations();
  });
}
