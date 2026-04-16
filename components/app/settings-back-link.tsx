import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export function SettingsBackLink() {
  return (
    <nav className="mb-2">
      <Link
        href="/settings"
        className="inline-flex cursor-pointer items-center gap-1 text-sm font-medium text-[#858585] transition hover:text-[#333]"
      >
        <ChevronLeft className="size-4" />
        Settings
      </Link>
    </nav>
  );
}
