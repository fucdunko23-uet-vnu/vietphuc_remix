$processes = Get-CimInstance Win32_Process -Filter "Name='node.exe'" | Where-Object { $_.CommandLine -match 'flow-worker.cjs' }
foreach ($process in $processes) { Stop-Process -Id $process.ProcessId }
Write-Host 'Da dung bo ket noi Flow. Ung dung se hien chua ket noi sau toi da 45 giay.'
