import fs from "fs";
import path from "path";

/** Prefer RESTAURANT_DB_PATH (e.g. Electron userData); otherwise DATABASE_URL or ./data/app.db. */
export function resolveRestaurantDbPath(): string {
  let resolved: string;
  const fromElectron = process.env.RESTAURANT_DB_PATH?.trim();
  if (fromElectron) {
    resolved = path.resolve(fromElectron);
  } else {
    const cwd = process.cwd();
    const fileUrl =
      process.env.SQLITE_DATABASE_URL?.trim() ||
      (process.env.DATABASE_URL?.trim().startsWith("file:")
        ? process.env.DATABASE_URL.trim()
        : undefined);
    if (fileUrl?.startsWith("file:")) {
      const fromUrl = fileUrl.replace(/^file:/, "").trim();
      resolved = path.isAbsolute(fromUrl) ? fromUrl : path.join(/* turbopackIgnore: true */ cwd, fromUrl);
    } else {
      resolved = path.join(/* turbopackIgnore: true */ cwd, "data", "app.db");
    }
  }

  fs.mkdirSync(path.dirname(resolved), { recursive: true });
  return resolved;
}
