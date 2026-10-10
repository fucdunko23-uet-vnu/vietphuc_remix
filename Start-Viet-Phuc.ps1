$ErrorActionPreference = 'Stop'
$workerRoot = 'D:\n8n\flow-automation'
$workerFile = Join-Path $workerRoot 'flow-worker.cjs'
if (!(Test-Path -LiteralPath (Join-Path $workerRoot 'worker-config.json'))) { throw 'Chua co cau hinh ket noi ung dung.' }
try { Invoke-RestMethod 'http://127.0.0.1:9223/json/version' -TimeoutSec 3 | Out-Null }
catch { Write-Host 'Hay chay Connect-AI-Studio.cmd va dang nhap Flow truoc.'; exit 1 }
$running = Get-CimInstance Win32_Process -Filter "Name='node.exe'" | Where-Object { $_.CommandLine -match 'flow-worker.cjs' }
if (!$running) {
  Start-Process -WindowStyle Hidden -FilePath 'C:\Program Files\nodejs\node.exe' -ArgumentList 'flow-worker.cjs' -WorkingDirectory $workerRoot -RedirectStandardOutput (Join-Path $workerRoot 'worker-current.log') -RedirectStandardError (Join-Path $workerRoot 'worker-current-error.log')
}
$config = Get-Content -Raw -LiteralPath (Join-Path $workerRoot 'worker-config.json') | ConvertFrom-Json
Write-Host ('Bo ket noi dang chay. Mo: ' + $config.appUrl)
Write-Host 'Giu Chrome dang nhap Flow va may tinh bat khi thu do.'
