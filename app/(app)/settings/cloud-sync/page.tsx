import Link from "next/link";
import { ArrowLeft, CloudUpload } from "lucide-react";
import { eq } from "drizzle-orm";

import { CloudSyncSettingsForm } from "@/components/app/cloud-sync-settings-form";

import { db } from "@/lib/db";
import { cloudSyncSettings } from "@/lib/db/schema";
import { ensureDefaults } from "@/lib/repository";

export default async function CloudSyncPage() {
  await ensureDefaults();
  const [row] = await db.select().from(cloudSyncSettings).where(eq(cloudSyncSettings.id, 1));
  if (!row) {
    throw new Error("cloud_sync_settings row missing");
  }

  const hasSecret = row.syncSecret.trim().length > 0;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/settings"
          className="inline-flex size-9 items-center justify-center rounded-full ring-1 ring-[#ebebeb] hover:bg-black/[0.03]"
          aria-label="Back to settings"
        >
          <ArrowLeft className="size-4 text-[#333]" />
        </Link>
        <span className="flex size-10 items-center justify-center rounded-xl bg-[#ffeee0] text-[#ff6b1e]">
          <CloudUpload className="size-5" strokeWidth={2} />
        </span>
        <div>
          <h1 className="text-2xl font-semibold text-[#333]">Cloud sync</h1>
          <p className="text-sm text-[#858585]">
            Sends a full snapshot of bills, lines, inventory, and business info to your master admin on a schedule
            (every ~5 minutes in the desktop app).
          </p>
        </div>
      </div>

      <CloudSyncSettingsForm
        defaults={{
          enabled: row.enabled,
          endpointBaseUrl: row.endpointBaseUrl,
          storeId: row.storeId,
          lastSyncAt: row.lastSyncAt ?? null,
          lastError: row.lastError,
        }}
        hasSecret={hasSecret}
      />
    </div>
  );
}
