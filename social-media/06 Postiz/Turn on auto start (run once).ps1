# Run once: right click this file > Run with PowerShell.
# It adds a Windows Task Scheduler task "DAUR Postiz" that runs "Start Postiz.ps1"
# each time you sign in, so Postiz and the calendar sync start by themselves.
# To remove it later: Task Scheduler > Task Scheduler Library > DAUR Postiz > Delete.

$script = Join-Path (Split-Path -Parent $MyInvocation.MyCommand.Path) "Start Postiz.ps1"
$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$script`""
$trigger = New-ScheduledTaskTrigger -AtLogOn -User $env:USERNAME
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -ExecutionTimeLimit (New-TimeSpan -Hours 1)
Register-ScheduledTask -TaskName "DAUR Postiz" -Description "Starts Docker, the local Postiz and the DAUR calendar sync at sign in" -Action $action -Trigger $trigger -Settings $settings -Force
Write-Host "Done. Postiz will start at every sign in. Press Enter to close."
Read-Host | Out-Null
