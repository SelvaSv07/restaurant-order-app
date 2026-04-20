"use client";

import { Eye, EyeOff, Pencil, RefreshCw } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { runCloudSyncNow, saveCloudSyncSettings } from "@/app/(app)/settings/cloud-sync/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

type Defaults = {
  enabled: boolean;
  endpointBaseUrl: string;
  storeId: string;
  /** Server may serialize dates as ISO strings across the RSC boundary. */
  lastSyncAt: Date | string | null;
  lastError: string;
};

function parseLastSyncAt(value: Date | string | null | undefined): Date | null {
  if (value == null) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatLastSyncAt(value: Date | null): string {
  if (!value) return "Never";
  return value.toLocaleString("en-IN", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function CloudSyncSettingsForm({
  defaults,
  hasSecret,
}: {
  defaults: Defaults;
  hasSecret: boolean;
}) {
  const router = useRouter();
  const [syncing, setSyncing] = useState(false);
  const [lastSyncAt, setLastSyncAt] = useState<Date | null>(() => parseLastSyncAt(defaults.lastSyncAt));

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [dialogStep, setDialogStep] = useState<"form" | "confirm">("form");
  const [isSavePending, startSaveTransition] = useTransition();

  const [editEnabled, setEditEnabled] = useState(defaults.enabled);
  const [editEndpoint, setEditEndpoint] = useState(defaults.endpointBaseUrl);
  const [editStoreId, setEditStoreId] = useState(defaults.storeId);
  const [editSyncSecret, setEditSyncSecret] = useState("");

  useEffect(() => {
    setLastSyncAt(parseLastSyncAt(defaults.lastSyncAt));
  }, [defaults.lastSyncAt]);

  function openEditDialog() {
    setEditEnabled(defaults.enabled);
    setEditEndpoint(defaults.endpointBaseUrl);
    setEditStoreId(defaults.storeId);
    setEditSyncSecret("");
    setDialogStep("form");
    setEditOpen(true);
  }

  function closeEditDialog() {
    setEditOpen(false);
    setDialogStep("form");
  }

  function handleEditOpenChange(open: boolean) {
    if (!open) {
      closeEditDialog();
    }
  }

  function submitSettingsFromDialog() {
    const fd = new FormData();
    if (editEnabled) fd.append("enabled", "on");
    fd.append("endpointBaseUrl", editEndpoint.trim());
    fd.append("storeId", editStoreId.trim());
    if (editSyncSecret.trim()) fd.append("syncSecret", editSyncSecret.trim());

    startSaveTransition(async () => {
      try {
        await saveCloudSyncSettings(fd);
        toast.success("Saved cloud sync settings");
        router.refresh();
        closeEditDialog();
      } catch {
        toast.error("Could not save settings");
      }
    });
  }

  async function syncNow() {
    setSyncing(true);
    try {
      const body = await runCloudSyncNow();
      if (!body.ok) {
        toast.error(body.error);
        return;
      }
      if (body.skipped) {
        if (body.reason === "already_running") {
          toast.message("Sync in progress", { description: "Another sync is running. Try again in a moment." });
          return;
        }
        const hint =
          body.reason === "disabled"
            ? "Turn on sync in Edit, save, then try again (or finish endpoint, store id, and secret)."
            : body.reason;
        toast.message("Skipped", { description: hint });
        return;
      }
      toast.success("Synced to cloud");
      setLastSyncAt(new Date());
    } catch {
      toast.error("Sync failed");
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4 rounded-xl border border-[#ebebeb] bg-white p-6 shadow-none">
        <div className="space-y-2">
          <p className="text-sm font-medium text-[#333]">Admin base URL</p>
          <p className="break-all rounded-lg border border-[#ebebeb] bg-[#fafafa] px-3 py-2.5 font-mono text-sm text-[#333]">
            {defaults.endpointBaseUrl?.trim() || "—"}
          </p>
          <p className="text-xs text-[#858585]">No trailing slash. Use HTTPS in production.</p>
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          <Button
            type="button"
            variant="outline"
            className="border-[#ebebeb] text-[#333]"
            aria-expanded={detailsOpen}
            onClick={() => setDetailsOpen((v) => !v)}
          >
            {detailsOpen ? (
              <>
                <EyeOff className="size-4" />
                Hide details
              </>
            ) : (
              <>
                <Eye className="size-4" />
                Show details
              </>
            )}
          </Button>
          <Button type="button" variant="outline" className="border-[#ebebeb] text-[#333]" onClick={openEditDialog}>
            <Pencil className="size-4" />
            Edit
          </Button>
        </div>

        {detailsOpen ? (
          <div className="space-y-4 border-t border-[#ebebeb] pt-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-[#333]">Auto sync</p>
                <p className="text-xs text-[#858585]">Scheduled push from the desktop app (~every 5 min).</p>
              </div>
              <span className="text-sm font-medium text-[#333]">{defaults.enabled ? "On" : "Off"}</span>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-[#333]">Store id</p>
              <p className="break-all font-mono text-sm text-[#333]">{defaults.storeId?.trim() || "—"}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-[#333]">Sync secret</p>
              <p className="font-mono text-sm text-[#333]">
                {hasSecret ? "Saved — hidden for security" : "Not set"}
              </p>
            </div>
          </div>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#ebebeb] pt-4">
          <Button
            type="button"
            disabled={syncing}
            onClick={() => void syncNow()}
            className="gap-2 border-0 bg-[#ff6b1e] font-semibold shadow-none hover:bg-[#ea580c] focus-visible:ring-2 focus-visible:ring-[#ff6b1e]/35"
          >
            <RefreshCw className={`size-4 ${syncing ? "animate-spin" : ""}`} />
            Sync now
          </Button>
          <div className="min-w-0 flex-1 text-right sm:flex-initial">
            <p className="text-xs text-[#858585]">Last sync</p>
            <p className="truncate text-sm font-medium text-[#333] tabular-nums" title={formatLastSyncAt(lastSyncAt)}>
              {formatLastSyncAt(lastSyncAt)}
            </p>
          </div>
        </div>
      </div>

      <Dialog open={editOpen} onOpenChange={handleEditOpenChange}>
        <DialogContent className="sm:max-w-md" showCloseButton>
          {dialogStep === "form" ? (
            <>
              <DialogHeader>
                <DialogTitle className="text-[#333]">Edit cloud sync</DialogTitle>
                <DialogDescription>Update connection settings for your master admin.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-2">
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#ebebeb] px-3 py-3">
                  <div>
                    <Label htmlFor="edit-auto-sync" className="text-[#333]">
                      Auto sync
                    </Label>
                    <p className="text-xs text-muted-foreground">Push bills and inventory on a schedule.</p>
                  </div>
                  <Switch
                    id="edit-auto-sync"
                    checked={editEnabled}
                    onCheckedChange={(v) => setEditEnabled(v)}
                    className="data-checked:bg-[#ff6b1e]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-endpoint">Admin base URL</Label>
                  <Input
                    id="edit-endpoint"
                    value={editEndpoint}
                    onChange={(e) => setEditEndpoint(e.target.value)}
                    placeholder="https://admin.example.com"
                    className="h-10"
                    autoComplete="off"
                  />
                  <p className="text-xs text-muted-foreground">No trailing slash.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-store">Store id (UUID)</Label>
                  <Input
                    id="edit-store"
                    value={editStoreId}
                    onChange={(e) => setEditStoreId(e.target.value)}
                    placeholder="From master admin → Settings"
                    className="h-10 font-mono text-sm"
                    autoComplete="off"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-secret">Sync secret</Label>
                  <Input
                    id="edit-secret"
                    type="password"
                    value={editSyncSecret}
                    onChange={(e) => setEditSyncSecret(e.target.value)}
                    placeholder={hasSecret ? "Leave blank to keep existing secret" : "Paste secret from master admin"}
                    className="h-10 font-mono text-sm"
                    autoComplete="new-password"
                  />
                </div>
              </div>
              <div className="flex flex-wrap justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => closeEditDialog()}>
                  Cancel
                </Button>
                <Button
                  type="button"
                  className="bg-[#ff6b1e] hover:bg-[#ea580c]"
                  onClick={() => setDialogStep("confirm")}
                >
                  Save
                </Button>
              </div>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle className="text-[#333]">Confirm changes</DialogTitle>
                <DialogDescription>Apply these cloud sync settings?</DialogDescription>
              </DialogHeader>
              <ul className="list-inside list-disc space-y-1 rounded-lg border border-[#ebebeb] bg-[#fafafa] px-4 py-3 text-sm text-[#333]">
                <li>Auto sync: {editEnabled ? "On" : "Off"}</li>
                <li className="break-all">
                  URL: {editEndpoint.trim() || "—"}
                </li>
                <li className="break-all font-mono text-xs">Store: {editStoreId.trim() || "—"}</li>
                <li>
                  Secret:{" "}
                  {editSyncSecret.trim()
                    ? "New secret will be saved"
                    : hasSecret
                      ? "Existing secret unchanged"
                      : "No secret set"}
                </li>
              </ul>
              <div className="flex flex-wrap justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setDialogStep("form")} disabled={isSavePending}>
                  Back
                </Button>
                <Button
                  type="button"
                  className="bg-[#ff6b1e] hover:bg-[#ea580c]"
                  disabled={isSavePending}
                  onClick={() => submitSettingsFromDialog()}
                >
                  {isSavePending ? "Saving…" : "Confirm & save"}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
