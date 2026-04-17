const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronPrint", {
  listPrinters: () => ipcRenderer.invoke("printers:list"),
  printUrl: (url, opts) => ipcRenderer.invoke("print:url", url, opts ?? {}),
});
