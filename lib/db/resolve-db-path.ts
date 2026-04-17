import path from "path";

/** Prefer RESTAURANT_DB_PATH (e.g. Electron userData); otherwise DATABASE_URL or ./data/app.db. */
export function resolveRestaurantDbPath(): string {
  const fromElectron = process.env.RESTAURANT_DB_PATH?.trim();
  if (fromElectron) {
    return path.resolve(fromElectron);
  }
  const fromUrl = process.env.DATABASE_URL?.replace(/^file:/, "")?.trim();
  if (fromUrl) {
    return path.isAbsolute(fromUrl)
      ? fromUrl
      : path.join(/* turbopackIgnore: true */ process.cwd(), fromUrl);
  }
  return path.join(/* turbopackIgnore: true */ process.cwd(), "data", "app.db");
}
