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
# Docker was reinstalled per user on 30 Oct 2026 (AppData\Local\Programs\DockerDesktop);
# accept either install location and make sure docker.exe is on PATH.
$dockerHome = @("$env:LOCALAPPDATA\Programs\DockerDesktop", "C:\Program Files\Docker\Docker") | Where-Object { Test-Path "$_\Docker Desktop.exe" } | Select-Object -First 1
if ($dockerHome) { $env:Path += ";$dockerHome\resources\bin" }

$dockerUp = $false
try { docker info *> $null; $dockerUp = ($LASTEXITCODE -eq 0) } catch {}
if (-not $dockerUp) {
  foreach ($d in @("$env:LOCALAPPDATA\Docker\run", "$env:LOCALAPPDATA\docker-secrets-engine")) {
    if (Test-Path $d) {
      $stale = Get-ChildItem $d -Force -ErrorAction SilentlyContinue | Where-Object { $_.Attributes -match "ReparsePoint" }
      if ($stale) { Rename-Item $d ((Split-Path $d -Leaf) + ".stale-" + (Get-Date -Format "yyyyMMdd-HHmmss")); Log "moved aside $d" }
    }
  }
  Start-Process "$dockerHome\Docker Desktop.exe"
  Log "starting Docker Desktop"
  for ($i = 0; $i -lt 60; $i++) { Start-Sleep 5; docker info *> $null; if ($LASTEXITCODE -eq 0) { break } }
}

Set-Location (Join-Path $here "server")
docker compose up -d *>> $log
Log "postiz containers started; open http://localhost:4007"

# The automatic folder sync is OFF since 30 Oct 2026: the owner asked Claude to create,
# schedule and verify posts through the Postiz MCP connection instead (see 00 READ ME Postiz.txt).
# To turn the folder sync back on, remove the "#" from the lines below.
# $running = Get-CimInstance Win32_Process -Filter "Name = 'node.exe'" | Where-Object { $_.CommandLine -like "*daur-postiz-sync.mjs*" }
# if (-not $running) {
#   Start-Process -WindowStyle Hidden -FilePath "node" -ArgumentList "`"$here\sync\daur-postiz-sync.mjs`" --watch" -WorkingDirectory (Join-Path $here "sync")
#   Log "sync watcher started"
# }
docker compose up -d ngrok *>> $log
