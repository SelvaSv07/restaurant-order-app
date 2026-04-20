import { PrintChrome } from "@/components/print/print-chrome";

import "./print.css";

export default function PrintLayout({ children }: { children: React.ReactNode }) {
  return <PrintChrome>{children}</PrintChrome>;
}
