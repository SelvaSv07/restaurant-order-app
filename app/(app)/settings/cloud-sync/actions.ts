"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import type { CloudSyncRunResult } from "@/lib/cloud-sync/run-sync";
import { runCloudSyncOnce } from "@/lib/cloud-sync/run-sync";
import { releaseCloudSyncLock, tryAcquireCloudSyncLock } from "@/lib/cloud-sync/sync-lock";
import { db } from "@/lib/db";
import { cloudSyncSettings } from "@/lib/db/schema";
import { ensureDefaults } from "@/lib/repository";

export async function saveCloudSyncSettings(formData: FormData) {
  await ensureDefaults();

  const enabled = formData.get("enabled") === "on";
  const endpointBaseUrl = String(formData.get("endpointBaseUrl") ?? "").trim();
  const storeId = String(formData.get("storeId") ?? "").trim();
  const syncSecret = String(formData.get("syncSecret") ?? "").trim();

  await db
    .update(cloudSyncSettings)
    .set({
      enabled,
      endpointBaseUrl,
      storeId,
      ...(syncSecret ? { syncSecret } : {}),
    })
    .where(eq(cloudSyncSettings.id, 1));

  revalidatePath("/settings");
  revalidatePath("/settings/cloud-sync");
}

/**
 * Manual "Sync now" — waits for completion. If an automatic sync is already running, returns skipped.
 * The internal HTTP route (`/api/internal/cloud-sync`) is immediate + background for the Electron timer.
 */
export async function runCloudSyncNow(): Promise<CloudSyncRunResult> {
  if (!tryAcquireCloudSyncLock()) {
    return { ok: true, skipped: true, reason: "already_running" };
  }
  try {
    return await runCloudSyncOnce();
  } finally {
    releaseCloudSyncLock();
  }
}
