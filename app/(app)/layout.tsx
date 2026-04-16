import { Figtree } from "next/font/google";

import { AppSidebar } from "@/components/app/app-sidebar";

const figtree = Figtree({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${figtree.className} flex min-h-screen`}>
      <AppSidebar />
      <main className="min-w-0 flex-1 bg-zinc-100 px-3 py-6 sm:px-4 sm:py-8">{children}</main>
    </div>
  );
}
