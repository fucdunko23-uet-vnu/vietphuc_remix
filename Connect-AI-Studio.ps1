$ErrorActionPreference = 'Stop'
$chrome = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
if (-not (Test-Path -LiteralPath $chrome)) { throw 'Khong tim thay Chrome.' }
$listener = Get-NetTCPConnection -State Listen -LocalPort 9223 -ErrorAction SilentlyContinue
if ($listener) {
    Write-Host 'Chrome ket noi da mo. Mo https://aistudio.google.com/apps va https://labs.google/fx/tools/flow trong cua so do.'
} else {
    New-Item -ItemType Directory -Path 'D:\n8n\flow-browser' -Force | Out-Null
    Start-Process -FilePath $chrome -ArgumentList @('--remote-debugging-port=9223', '--remote-debugging-address=127.0.0.1', '--user-data-dir=D:\n8n\flow-browser', '--no-first-run', '--no-default-browser-check', '--new-window', 'https://aistudio.google.com/apps', 'https://labs.google/fx/tools/flow') -WindowStyle Normal
}
Write-Host 'Dang nhap Google trong cua so Chrome nay. Mo ca AI Studio va Flow.'
Write-Host 'Giu Chrome mo; bao tro ly: Da dang nhap ca hai.'
Read-Host 'Nhan Enter de dong huong dan (khong dong Chrome)'
