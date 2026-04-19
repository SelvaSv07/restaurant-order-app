import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { cloudSyncSettings } from "@/lib/db/schema";
import { ensureDefaults } from "@/lib/repository";

import { buildIngestPayloadV1 } from "@/lib/cloud-sync/build-payload";

export type CloudSyncRunResult =
  | { ok: true; skipped: true; reason: string }
  | { ok: true; skipped?: false; applied?: unknown }
  | { ok: false; error: string };

export async function runCloudSyncOnce(): Promise<CloudSyncRunResult> {
  await ensureDefaults();

  const [row] = await db.select().from(cloudSyncSettings).where(eq(cloudSyncSettings.id, 1));
  if (!row) {
    return { ok: false, error: "Cloud sync settings missing" };
  }

  if (!row.enabled) {
    return { ok: true, skipped: true, reason: "disabled" };
  }

  const base = row.endpointBaseUrl.trim().replace(/\/+$/, "");
  const storeId = row.storeId.trim();
  const secret = row.syncSecret.trim();

  if (!base || !storeId || !secret) {
    await db
      .update(cloudSyncSettings)
      .set({
        lastError: "Incomplete configuration (endpoint, store id, or secret).",
      })
      .where(eq(cloudSyncSettings.id, 1));

    return { ok: false, error: "incomplete configuration" };
  }

  let payload: unknown;
  try {
    payload = await buildIngestPayloadV1(storeId, secret);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await db.update(cloudSyncSettings).set({ lastError: msg }).where(eq(cloudSyncSettings.id, 1));
    return { ok: false, error: msg };
  }

  try {
    const url = `${base}/api/ingest/v1`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });

    const body = (await res.json().catch(() => ({}))) as { error?: string; applied?: unknown };

    if (!res.ok) {
      const err = body.error ?? `HTTP ${res.status}`;
      await db.update(cloudSyncSettings).set({ lastError: err }).where(eq(cloudSyncSettings.id, 1));
      return { ok: false, error: err };
    }

    await db
      .update(cloudSyncSettings)
      .set({
        lastSyncAt: new Date(),
        lastError: "",
        lastPayloadVersion: 1,
      })
      .where(eq(cloudSyncSettings.id, 1));

    return { ok: true, applied: body.applied };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await db.update(cloudSyncSettings).set({ lastError: msg }).where(eq(cloudSyncSettings.id, 1));
    return { ok: false, error: msg };
  }
}
