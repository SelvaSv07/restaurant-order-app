export type ElectronPrinterInfo = {
  name: string;
  displayName?: string;
  description?: string;
  status?: number;
  isDefault?: boolean;
};

export type ElectronPrintApi = {
  listPrinters: () => Promise<ElectronPrinterInfo[]>;
  printUrl: (
    url: string,
    opts?: { deviceName?: string },
  ) => Promise<{ ok: boolean; error?: string }>;
};

declare global {
  interface Window {
    electronPrint?: ElectronPrintApi;
  }
}

export {};
