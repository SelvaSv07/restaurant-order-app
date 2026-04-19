import { after, NextResponse } from "next/server";

import { runCloudSyncOnce } from "@/lib/cloud-sync/run-sync";
import { releaseCloudSyncLock, tryAcquireCloudSyncLock } from "@/lib/cloud-sync/sync-lock";

function isLoopbackRequest(request: Request): boolean {
  const host = (request.headers.get("host") ?? "").toLowerCase();
  if (host.startsWith("127.0.0.1:") || host.startsWith("localhost:")) return true;

  /** IPv6 loopback */
  if (host.startsWith("[::1]:")) return true;

  return false;
}

/**
 * Electron's timer hits this URL; we respond immediately (202) and run sync after the response
 * via `after()`, so the Next server and Electron main process are not held open on this request.
 */
export async function GET(request: Request) {
  if (!isLoopbackRequest(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!tryAcquireCloudSyncLock()) {
    return NextResponse.json(
      { ok: true, skipped: true, reason: "already_running" },
      { status: 200 }
    );
  }

  after(async () => {
    try {
      await runCloudSyncOnce();
    } catch (e) {
      console.error("[cloud-sync] background sync failed:", e);
    } finally {
      releaseCloudSyncLock();
    }
  });

  return NextResponse.json({ ok: true, accepted: true }, { status: 202 });
}

export async function POST(request: Request) {
  return GET(request);
}
