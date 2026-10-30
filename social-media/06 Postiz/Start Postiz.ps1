# DAUR Supply: start Docker Desktop, the Postiz containers and the calendar sync.
# Runs at Windows sign in through the task "DAUR Postiz" (Task Scheduler).
# Safe to run by hand too: right click > Run with PowerShell.

$ErrorActionPreference = "Continue"
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$log = Join-Path $here "sync\start-log.txt"
function Log($m) { "$(Get-Date -Format s)  $m" | Add-Content -Path $log }

# Docker Desktop on this PC crashed on 29 Oct 2026 because socket files left by an
# earlier crash could not be removed. If Docker is not running, move such folders
# aside first (nothing is deleted; the folders are renamed with a date).
$dockerUp = $false
try { docker info *> $null; $dockerUp = ($LASTEXITCODE -eq 0) } catch {}
if (-not $dockerUp) {
  foreach ($d in @("$env:LOCALAPPDATA\Docker\run", "$env:LOCALAPPDATA\docker-secrets-engine")) {
    if (Test-Path $d) {
      $stale = Get-ChildItem $d -Force -ErrorAction SilentlyContinue | Where-Object { $_.Attributes -match "ReparsePoint" }
      if ($stale) { Rename-Item $d ((Split-Path $d -Leaf) + ".stale-" + (Get-Date -Format "yyyyMMdd-HHmmss")); Log "moved aside $d" }
    }
  }
  Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe"
  Log "starting Docker Desktop"
  for ($i = 0; $i -lt 60; $i++) { Start-Sleep 5; docker info *> $null; if ($LASTEXITCODE -eq 0) { break } }
}

Set-Location (Join-Path $here "server")
docker compose up -d *>> $log
Log "postiz containers started; open http://localhost:4007"

# start the calendar sync watcher once
$running = Get-CimInstance Win32_Process -Filter "Name = 'node.exe'" | Where-Object { $_.CommandLine -like "*daur-postiz-sync.mjs*" }
if (-not $running) {
  Start-Process -WindowStyle Hidden -FilePath "node" -ArgumentList "`"$here\sync\daur-postiz-sync.mjs`" --watch" -WorkingDirectory (Join-Path $here "sync")
  Log "sync watcher started"
}
