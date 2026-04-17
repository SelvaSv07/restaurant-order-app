import { execSync } from "child_process";
import os from "os";
import fs from "fs";
import path from "path";

/**
 * Send raw ESC/POS bytes to a Windows printer using winspool.drv P/Invoke.
 * This is the most reliable way to send raw bytes to a thermal printer on Windows.
 */
export function sendRawToPrinter(
  printerName: string,
  data: Buffer,
  jobName: string,
): void {
  const timestamp = Date.now();
  const dataPath = path.join(os.tmpdir(), `raw_${timestamp}.bin`);
  const scriptPath = path.join(os.tmpdir(), `raw_${timestamp}.ps1`);

  try {
    fs.writeFileSync(dataPath, data);

    const psScript = `
$ErrorActionPreference = 'Stop'

Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;

public class RawPrinterHelper {
    [StructLayout(LayoutKind.Sequential)]
    public struct DOCINFOA {
        [MarshalAs(UnmanagedType.LPStr)] public string pDocName;
        [MarshalAs(UnmanagedType.LPStr)] public string pOutputFile;
        [MarshalAs(UnmanagedType.LPStr)] public string pDatatype;
    }

    [DllImport("winspool.drv", SetLastError=true, CharSet=CharSet.Ansi)]
    public static extern bool OpenPrinter(string pPrinterName, out IntPtr phPrinter, IntPtr pDefault);
    [DllImport("winspool.drv", SetLastError=true)]
    public static extern bool StartDocPrinter(IntPtr hPrinter, int level, ref DOCINFOA pDocInfo);
    [DllImport("winspool.drv", SetLastError=true)]
    public static extern bool StartPagePrinter(IntPtr hPrinter);
    [DllImport("winspool.drv", SetLastError=true)]
    public static extern bool WritePrinter(IntPtr hPrinter, IntPtr pBytes, int dwCount, out int dwWritten);
    [DllImport("winspool.drv", SetLastError=true)]
    public static extern bool EndPagePrinter(IntPtr hPrinter);
    [DllImport("winspool.drv", SetLastError=true)]
    public static extern bool EndDocPrinter(IntPtr hPrinter);
    [DllImport("winspool.drv", SetLastError=true)]
    public static extern bool ClosePrinter(IntPtr hPrinter);

    public static bool SendRaw(string printerName, byte[] data, string docName) {
        IntPtr hPrinter;
        if (!OpenPrinter(printerName, out hPrinter, IntPtr.Zero)) return false;
        try {
            var di = new DOCINFOA { pDocName = docName, pOutputFile = null, pDatatype = "RAW" };
            if (!StartDocPrinter(hPrinter, 1, ref di)) return false;
            try {
                StartPagePrinter(hPrinter);
                IntPtr pUnmanagedBytes = Marshal.AllocCoTaskMem(data.Length);
                try {
                    Marshal.Copy(data, 0, pUnmanagedBytes, data.Length);
                    int written;
                    WritePrinter(hPrinter, pUnmanagedBytes, data.Length, out written);
                } finally {
                    Marshal.FreeCoTaskMem(pUnmanagedBytes);
                }
                EndPagePrinter(hPrinter);
            } finally {
                EndDocPrinter(hPrinter);
            }
        } finally {
            ClosePrinter(hPrinter);
        }
        return true;
    }
}
'@

$bytes = [System.IO.File]::ReadAllBytes('${dataPath.replace(/\\/g, "\\\\").replace(/'/g, "''")}')
$ok = [RawPrinterHelper]::SendRaw('${printerName.replace(/'/g, "''")}', $bytes, '${jobName.replace(/'/g, "''")}')
if ($ok) {
    Write-Output 'PRINT_SUCCESS'
} else {
    Write-Error "Failed to send raw data to printer '${printerName.replace(/'/g, "''")}'."
    exit 1
}
`;

    fs.writeFileSync(scriptPath, psScript, "utf-8");

    const result = execSync(
      `powershell -NoProfile -ExecutionPolicy Bypass -File "${scriptPath}"`,
      { encoding: "utf-8", windowsHide: true, timeout: 15000 },
    );

    if (!result.includes("PRINT_SUCCESS")) {
      throw new Error(`Print did not complete successfully: ${result}`);
    }
  } finally {
    try { fs.unlinkSync(scriptPath); } catch { /* ignore */ }
    try { fs.unlinkSync(dataPath); } catch { /* ignore */ }
  }
}
