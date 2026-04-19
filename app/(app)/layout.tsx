import { Figtree } from "next/font/google";

import { AppSidebar } from "@/components/app/app-sidebar";

const figtree = Figtree({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${figtree.className} flex min-h-dvh bg-[#fdfdfd]`}>
      <AppSidebar />
      <main className="min-h-0 min-w-0 flex-1 overflow-auto p-8">{children}</main>
    </div>
  );
}
