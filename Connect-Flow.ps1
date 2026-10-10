$ErrorActionPreference = 'Stop'
$chrome = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
$profileDir = 'D:\n8n\flow-browser'
if (-not (Test-Path -LiteralPath $chrome)) { throw 'Khong tim thay Google Chrome.' }
$listener = Get-NetTCPConnection -State Listen -LocalPort 9223 -ErrorAction SilentlyContinue
if ($listener) {
    Write-Host 'Trinh duyet ket noi dang mo. Hay dang nhap Flow trong cua so Chrome do.'
} else {
    New-Item -ItemType Directory -Path $profileDir -Force | Out-Null
    Start-Process -FilePath $chrome -ArgumentList @('--remote-debugging-port=9223', '--remote-debugging-address=127.0.0.1', '--user-data-dir=D:\n8n\flow-browser', '--no-first-run', '--no-default-browser-check', '--new-window', 'https://labs.google/fx/tools/flow') -WindowStyle Normal
}
Write-Host 'Dang nhap dung tai khoan co tin dung Flow trong cua so Chrome vua mo.'
Write-Host 'Khi thay trang Flow, giu cua so mo va bao tro ly: Da dang nhap Flow.'
Read-Host 'Nhan Enter de dong cua so huong dan nay (khong dong Chrome)'
