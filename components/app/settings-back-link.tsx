import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export function SettingsBackLink() {
  return (
    <nav className="mb-2">
      <Link
        href="/settings"
        className="inline-flex cursor-pointer items-center gap-1 rounded-md text-sm font-medium text-[#858585] transition hover:text-[#333] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff6b1e]/35"
      >
        <ChevronLeft className="size-4" />
        Settings
      </Link>
    </nav>
  );
}
