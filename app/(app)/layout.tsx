import { Figtree } from "next/font/google";

import { AppSidebar } from "@/components/app/app-sidebar";

const figtree = Figtree({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
      <div className={`${figtree.className} flex h-full min-h-0 flex-1 overflow-hidden bg-[#fdfdfd]`}>
      <AppSidebar />
      <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto px-4 py-0 sm:px-5">{children}</main>
    </div>
  );
}
