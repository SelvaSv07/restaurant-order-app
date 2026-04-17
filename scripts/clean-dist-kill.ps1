# Stops processes that lock dist/ (Restaurant Order from win-unpacked, node server, etc.).
# CLEAN_TARGET_DIR = absolute path to the electron-builder output folder (usually .../dist).
$ErrorActionPreference = 'SilentlyContinue'

$target = $env:CLEAN_TARGET_DIR
if (-not $target) {
  exit 0
}

try {
  $targetFull = [System.IO.Path]::GetFullPath($target)
} catch {
  exit 0
}

function Test-UsesPath {
  param([string]$Cl, [string]$Ex, [string]$Root)
  if ($Cl) {
    if ($Cl.IndexOf($Root, [StringComparison]::OrdinalIgnoreCase) -ge 0) { return $true }
    $alt = $Root -replace '\\', '/'
    if ($Cl.IndexOf($alt, [StringComparison]::OrdinalIgnoreCase) -ge 0) { return $true }
  }
  if ($Ex) {
    if ($Ex.IndexOf($Root, [StringComparison]::OrdinalIgnoreCase) -ge 0) { return $true }
  }
  return $false
}

taskkill /F /IM "Restaurant Order.exe" /T 2>$null

Get-CimInstance Win32_Process | ForEach-Object {
  if (-not (Test-UsesPath -Cl $_.CommandLine -Ex $_.ExecutablePath -Root $targetFull)) { return }
  $procId = $_.ProcessId
  if ($procId -eq $PID) { return }
  try {
    Write-Host "Stopping $($_.Name) PID $procId (locks dist/)"
    Stop-Process -Id $procId -Force
  } catch {}
}

Start-Sleep -Milliseconds 500
