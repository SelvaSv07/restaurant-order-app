import Link from "next/link";

export function SidebarPromo() {
  return (
    <div className="relative overflow-hidden rounded-xl bg-[#ffeee0] px-4 pb-4 pt-6">
      <p className="text-sm leading-snug text-[#333]">
        Streamline restaurant management with real-time insights.
      </p>
      <Link
        href="/settings"
        className="mt-6 flex w-full cursor-pointer items-center justify-center rounded-xl bg-[#ff6b1e] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#f55f0f]"
      >
        Upgrade Now
      </Link>
    </div>
  );
}
