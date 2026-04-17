import { PrintChrome } from "@/components/print/print-chrome";

export default function PrintLayout({ children }: { children: React.ReactNode }) {
  return <PrintChrome>{children}</PrintChrome>;
}
